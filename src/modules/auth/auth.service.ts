import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { User, UserStatus, AuthProvider } from '@modules/users/entities/user.entity';
import { UserRefreshToken } from './entities/user-refresh-token.entity';
import {
    BadRequestException,
    UnauthorizedException,
    NotFoundException
} from '../../shared/exceptions/app.exception';
import { LoggerService } from '@shared/modules/logger/logger.service';

export interface LoginResponse {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    tokenType: string;
    user: Partial<User>;
}

export interface TokenPayload {
    sub: string;
    email: string;
    role: string;
}

@Injectable()
export class AuthService {
    constructor(
        private jwtService: JwtService,
        private configService: ConfigService,
        @InjectRepository(User)
        private usersRepository: Repository<User>,
        @InjectRepository(UserRefreshToken)
        private refreshTokenRepository: Repository<UserRefreshToken>,
        private readonly logger: LoggerService,
    ) { }

    async validateUser(email: string, password: string): Promise<User> {
        try {
            this.logger.debug(`Validating user: ${email}`);
            const user = await this.usersRepository.findOne({
                where: { email },
            });

            if (!user) {
                throw new UnauthorizedException('Invalid credentials');
            }

            if (user.status !== UserStatus.ACTIVE) {
                throw new UnauthorizedException('Account is not active');
            }

            // For OAuth users who don't have a password
            if (!user.password) {
                throw new UnauthorizedException('Please log in with your social provider');
            }

            const isPasswordValid = await bcrypt.compare(password, user.password);
            if (!isPasswordValid) {
                throw new UnauthorizedException('Invalid credentials');
            }

            return user;
        } catch (error) {
            this.logger.error(`Error validating user ${email}: ${error.message}`);
            throw error;
        }
    }

    async validateOAuthUser(profile: any): Promise<User> {
        // This is a placeholder. In a real implementation, you'd extract data from the profile
        // based on the provider and find or create a user in your database

        const email = profile.emails?.[0]?.value;
        if (!email) {
            throw new BadRequestException('Email not provided by OAuth provider');
        }

        let user = await this.usersRepository.findOne({
            where: { email },
        });

        if (!user) {
            // Create new user from OAuth profile
            user = this.usersRepository.create({
                email,
                firstName: profile.name?.givenName || profile.displayName || '',
                lastName: profile.name?.familyName || '',
                provider: profile.provider as AuthProvider,
                providerId: profile.id,
                providerData: profile,
                emailVerified: true, // We trust the email from OAuth provider
                status: UserStatus.ACTIVE,
            });

            await this.usersRepository.save(user);
        } else {
            // Update existing user with OAuth data
            user.provider = profile.provider as AuthProvider;
            user.providerId = profile.id;
            user.providerData = profile;
            user.emailVerified = true;

            await this.usersRepository.save(user);
        }

        return user;
    }

    async login(user: User, userAgent?: string, ipAddress?: string): Promise<LoginResponse> {
        const payload: TokenPayload = {
            sub: user.id,
            email: user.email,
            role: user.role,
        };

        const accessToken = this.jwtService.sign(payload);
        const refreshToken = await this.generateRefreshToken(user, userAgent, ipAddress);

        const jwtExpiresIn = this.configService.get<string>('auth.jwtExpiresIn', '1h');
        const expiresInSeconds = this.parseExpirationTime(jwtExpiresIn);

        return {
            accessToken,
            refreshToken,
            expiresIn: expiresInSeconds,
            tokenType: 'Bearer',
            user: user.toResponse(),
        };
    }

    async refreshToken(token: string, userAgent?: string, ipAddress?: string): Promise<LoginResponse> {
        const refreshTokenEntity = await this.refreshTokenRepository.findOne({
            where: { token },
            relations: ['user'],
        });

        if (!refreshTokenEntity) {
            throw new UnauthorizedException('Invalid refresh token');
        }

        if (refreshTokenEntity.isExpired()) {
            await this.refreshTokenRepository.remove(refreshTokenEntity);
            throw new UnauthorizedException('Refresh token expired');
        }

        const { user } = refreshTokenEntity;

        if (user.status !== UserStatus.ACTIVE) {
            throw new UnauthorizedException('Account is not active');
        }

        // Revoke the old refresh token
        await this.refreshTokenRepository.remove(refreshTokenEntity);

        // Generate new tokens
        return this.login(user, userAgent, ipAddress);
    }

    async logout(refreshToken: string): Promise<void> {
        const token = await this.refreshTokenRepository.findOne({
            where: { token: refreshToken },
        });

        if (!token) {
            return; // Token not found, no action needed
        }

        await this.refreshTokenRepository.remove(token);
    }

    async logoutAll(userId: string): Promise<void> {
        await this.refreshTokenRepository.delete({ userId });
    }

    private async generateRefreshToken(user: User, userAgent?: string, ipAddress?: string): Promise<string> {
        // Generate a random token
        const token = crypto.randomBytes(40).toString('hex');

        const refreshTokenExpiresIn = this.configService.get<string>(
            'auth.refreshTokenExpiresIn',
            '7d',
        );

        // Calculate expiration date
        const expiresAt = new Date();
        expiresAt.setSeconds(
            expiresAt.getSeconds() + this.parseExpirationTime(refreshTokenExpiresIn),
        );

        // Create and save refresh token entity
        const refreshToken = this.refreshTokenRepository.create({
            userId: user.id,
            token,
            userAgent,
            ipAddress,
            expiresAt,
        });

        await this.refreshTokenRepository.save(refreshToken);

        return token;
    }

    private parseExpirationTime(expiresIn: string): number {
        const match = expiresIn.match(/^(\d+)([smhdw])$/);

        if (!match) {
            return 3600; // Default to 1 hour in seconds
        }

        const value = parseInt(match[1], 10);
        const unit = match[2];

        switch (unit) {
            case 's': return value;
            case 'm': return value * 60;
            case 'h': return value * 3600;
            case 'd': return value * 86400;
            case 'w': return value * 604800;
            default: return 3600;
        }
    }
}

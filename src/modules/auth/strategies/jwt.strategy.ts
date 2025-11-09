import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { User } from '@modules/users/entities/user.entity';
import { UnauthorizedException as AppUnauthorizedException } from '@shared/exceptions/app.exception';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(
        private configService: ConfigService,
        @InjectRepository(User)
        private usersRepository: Repository<User>,
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: configService.get<string>('auth.jwtSecret') || 'default-secret-for-dev',
        });
    }

    async validate(payload: any) {
        const { sub: userId } = payload;

        const user = await this.usersRepository.findOne({
            where: { id: userId },
        });

        if (!user) {
            throw new AppUnauthorizedException('User not found');
        }

        // Remove sensitive information
        return user.toResponse();
    }
}

import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
// OAuth2Strategy removed to prevent errors
import { User } from '@modules/users/entities/user.entity';
import { UserRefreshToken } from './entities/user-refresh-token.entity';
import { UsersModule } from '@modules/users/users.module';
import { LoggerModule } from '@shared/modules/logger/logger.module';

@Module({
    imports: [
        ConfigModule,
        LoggerModule,
        PassportModule.register({ defaultStrategy: 'jwt' }),
        JwtModule.registerAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: async (configService: ConfigService) => ({
                secret: configService.get('auth.jwtSecret'),
                signOptions: {
                    expiresIn: configService.get('auth.jwtExpiresIn'),
                },
            }),
        }),
        TypeOrmModule.forFeature([User, UserRefreshToken]),
        UsersModule,
    ],
    controllers: [AuthController],
    providers: [AuthService, JwtStrategy],
    exports: [AuthService, JwtStrategy],
})
export class AuthModule { }

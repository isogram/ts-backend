import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-oauth2';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';
import { AuthProvider } from '@modules/users/entities/user.entity';

@Injectable()
export class OAuth2Strategy extends PassportStrategy(Strategy, 'oauth2') {
    constructor(
        private configService: ConfigService,
        private authService: AuthService,
    ) {
        // Get Google OAuth config as default - in a real app you might want to make this configurable
        const googleConfig = configService.get('auth.oauth.google');

        super({
            authorizationURL: 'https://accounts.google.com/o/oauth2/v2/auth',
            tokenURL: 'https://oauth2.googleapis.com/token',
            clientID: googleConfig.clientID,
            clientSecret: googleConfig.clientSecret,
            callbackURL: googleConfig.callbackURL,
            scope: googleConfig.scope,
        });
    }

    // This is a placeholder strategy as the actual OAuth2 providers would be configured separately
    // In a real application, you'd create specific strategies for each provider
    async validate(accessToken: string, refreshToken: string, profile: any, done: any) {
        // This would typically contact your database to find or create a user based on OAuth profile
        const user = await this.authService.validateOAuthUser(profile);
        done(null, user);
    }
}

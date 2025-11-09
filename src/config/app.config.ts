import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
    nodeEnv: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '3000', 10),
    apiPrefix: process.env.API_PREFIX || 'api',
    basicAuthUsername: process.env.BASIC_AUTH_USERNAME || 'admin',
    basicAuthPassword: process.env.BASIC_AUTH_PASSWORD || 'password',
    swaggerEnabled: process.env.SWAGGER_ENABLED === 'true',
    requestTimeout: parseInt(process.env.REQUEST_TIMEOUT || '30000', 10),
    rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
    rateLimitTimeWindow: parseInt(process.env.RATE_LIMIT_WINDOW || '60000', 10),
    logLevel: process.env.LOG_LEVEL || 'info',
}));

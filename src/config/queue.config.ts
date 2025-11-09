import { registerAs } from '@nestjs/config';

export default registerAs('queue', () => ({
    driver: process.env.QUEUE_DRIVER || 'bull', // 'bull' or 'sqs'
    bull: {
        redis: {
            host: process.env.REDIS_HOST || 'localhost',
            port: parseInt(process.env.REDIS_PORT || '6379', 10),
            password: process.env.REDIS_PASSWORD || '',
        },
    },
}));

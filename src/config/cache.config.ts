import { registerAs } from '@nestjs/config';

export default registerAs('cache', () => ({
    driver: process.env.CACHE_DRIVER || 'memory', // 'memory', 'redis'
    ttl: parseInt(process.env.CACHE_TTL || '300', 10), // Default 5 minutes
    max: parseInt(process.env.CACHE_MAX_ITEMS || '1000', 10), // Max items for memory store
}));

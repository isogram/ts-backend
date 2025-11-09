import appConfig from './app.config';
import databaseConfig from './database.config';
import authConfig from './auth.config';
import redisConfig from './redis.config';
import awsConfig from './aws.config';
import storageConfig from './storage.config';
import queueConfig from './queue.config';
import cacheConfig from './cache.config';

export const configurations = [
    appConfig,
    databaseConfig,
    authConfig,
    redisConfig,
    awsConfig,
    storageConfig,
    queueConfig,
    cacheConfig,
];

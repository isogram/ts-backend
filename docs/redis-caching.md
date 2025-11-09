# Redis Caching Configuration

This document explains how to configure Redis as the caching provider for the NestJS application, replacing the default in-memory cache.

## Current Cache Setup

Currently, the application uses in-memory caching as configured in `app.module.ts`. The cache configuration is controlled by environment variables defined in `src/config/cache.config.ts`.

## Switching to Redis Cache

To use Redis for caching instead of the in-memory store, follow these steps:

### 1. Install Required Dependencies

First, install the Redis cache store for NestJS cache manager:

```bash
npm install cache-manager-redis-store@2.0.0 redis@3.1.2
```

> Note: We're using specific versions that are compatible with the NestJS cache-manager. For the latest NestJS versions, you might use `@nestjs/cache-manager` with `cache-manager-redis-yet` or other compatible Redis stores.

### 2. Update the Cache Configuration in `app.module.ts`

Replace the current cache configuration with the following Redis implementation:

```typescript
// Caching
CacheModule.registerAsync({
  isGlobal: true,
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: (configService: ConfigService) => {
    const cacheDriver = configService.get('cache.driver', 'memory');
    
    // Base configuration
    const ttl = configService.get('cache.ttl', 300);
    
    // Use Redis if configured, otherwise fall back to memory cache
    if (cacheDriver === 'redis') {
      const redisHost = configService.get('redis.host', 'localhost');
      const redisPort = configService.get('redis.port', 6379);
      const redisPassword = configService.get('redis.password', undefined);
      const redisTtl = configService.get('redis.ttl', ttl);
      
      return {
        store: require('cache-manager-redis-store'),
        host: redisHost,
        port: redisPort,
        password: redisPassword || undefined,
        ttl: redisTtl,
        isGlobal: true,
      };
    }
    
    // Fall back to memory cache if not using Redis
    return {
      ttl,
      max: configService.get('cache.max', 1000),
      isGlobal: true,
    };
  },
}),
```

### 3. Update Environment Variables

In your `.env` file, set the following variables to use Redis:

```env
# Cache Configuration
CACHE_DRIVER=redis
CACHE_TTL=300

# Redis Configuration (also used for cache when CACHE_DRIVER=redis)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password_if_any
REDIS_TTL=300
```

### 4. Ensure Redis is Available

Make sure Redis is running and accessible using the configuration you've provided.

If you're using Docker, your Redis service might already be defined in your `docker-compose.yml` file. If not, you can add it:

```yaml
services:
  redis:
    image: redis:alpine
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
    restart: unless-stopped

volumes:
  redis-data:
```

## Using the Cache Service

After configuration, you can inject and use the Cache service in any of your NestJS services:

```typescript
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Injectable, Inject } from '@nestjs/common';

@Injectable()
export class YourService {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  async findData(id: string): Promise<any> {
    // Try to get data from cache first
    const cachedData = await this.cacheManager.get(`data-${id}`);
    if (cachedData) {
      return cachedData;
    }

    // If not in cache, fetch from database
    const data = await this.fetchDataFromDatabase(id);
    
    // Store in cache for future requests
    await this.cacheManager.set(`data-${id}`, data, { ttl: 300 });
    
    return data;
  }

  private async fetchDataFromDatabase(id: string): Promise<any> {
    // Your database logic here
  }
}
```

## Cache Decorators

NestJS provides decorators for easy caching of controller methods:

```typescript
import { CacheKey, CacheTTL, UseInterceptors, CacheInterceptor } from '@nestjs/common';

@Controller('items')
@UseInterceptors(CacheInterceptor)
export class ItemsController {
  constructor(private itemsService: ItemsService) {}

  @Get(':id')
  @CacheKey('item-by-id')  // Custom cache key
  @CacheTTL(60)            // Custom TTL in seconds
  findOne(@Param('id') id: string) {
    return this.itemsService.findOne(id);
  }
}
```

## Benefits of Redis Over In-Memory Cache

1. **Persistence**: Redis can persist data to disk, so cache survives application restarts.
2. **Scalability**: Redis works across multiple instances of your application.
3. **Memory Management**: Offloads memory management from your Node.js process.
4. **Advanced Features**: Redis provides additional features like pub/sub, sorted sets, and more.

## Common Issues and Troubleshooting

1. **Connection Issues**: Ensure Redis is running and accessible from your application.
2. **Authentication**: If Redis requires authentication, make sure the password is correctly set.
3. **Serialization**: Objects stored in Redis are automatically serialized/deserialized, but complex objects might need custom serialization logic.

## Further Redis Configuration Options

For more advanced Redis configurations, you can adjust the store configuration:

```typescript
return {
  store: require('cache-manager-redis-store'),
  host: redisHost,
  port: redisPort,
  password: redisPassword,
  ttl: redisTtl,
  db: 0,                   // Redis database index
  prefix: 'app:cache:',    // Key prefix for all cache entries
  isGlobal: true,
};
```

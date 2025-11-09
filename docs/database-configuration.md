# Database Configuration

This document explains the database configuration structure in our NestJS application and why we have multiple database initialization files.

## Overview of Database Configuration Files

Our project uses three main files for database configuration:

1. **`src/config/database.config.ts`**: Configuration source of truth
2. **`src/app.module.ts`**: NestJS integration with TypeORM
3. **`src/data-source.ts`**: Standalone TypeORM DataSource for migrations and CLI operations

## Configuration Files Explained

### 1. `src/config/database.config.ts`

This file defines our database configuration settings using NestJS's configuration system. It registers settings under the 'database' namespace, making them available through the ConfigService throughout the application.

```typescript
import { registerAs } from '@nestjs/config';

export default registerAs('database', () => ({
    type: process.env.DATABASE_TYPE || 'postgres',
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432', 10),
    username: process.env.DATABASE_USERNAME || 'postgres',
    password: process.env.DATABASE_PASSWORD || 'postgres',
    database: process.env.DATABASE_NAME || 'ts_backend',
    // other configuration options...
}));
```

This is the **source of truth** for database configuration in our NestJS application.

### 2. `src/app.module.ts`

This file contains the TypeORM module initialization for our NestJS application. It imports and uses the configuration from `database.config.ts` via the ConfigService.

```typescript
TypeOrmModule.forRootAsync({
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: (configService: ConfigService) => {
    return {
      type: 'postgres',
      host: configService.get('database.host'),
      port: configService.get<number>('database.port'),
      username: configService.get<string>('database.username'),
      password: configService.get<string>('database.password'),
      database: configService.get<string>('database.database'),
      // other configuration options...
    };
  },
})
```

This connects our database configuration to our NestJS application, allowing dependency injection throughout the app.

### 3. `src/data-source.ts`

This file creates a standalone TypeORM DataSource object that can be used outside of the NestJS dependency injection system.

```typescript
import { DataSource, DataSourceOptions } from 'typeorm';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env' });

export const dataSourceOptions: DataSourceOptions = {
    type: 'postgres',
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432', 10),
    username: process.env.DATABASE_USERNAME || 'postgres',
    password: process.env.DATABASE_PASSWORD || 'postgres',
    database: process.env.DATABASE_NAME || 'ts_backend',
    // other configuration options...
};

const dataSource = new DataSource(dataSourceOptions);
export default dataSource;
```

This DataSource is primarily used for:

- CLI operations (migrations, schema generation)
- Standalone scripts that need database access but don't need the full NestJS container
- TypeORM migration commands

## Why We Need Multiple Configurations

This approach follows a common pattern in NestJS applications for several reasons:

### 1. Separation of Concerns

- `database.config.ts`: Handles environment-specific configuration
- `app.module.ts`: Handles NestJS integration
- `data-source.ts`: Handles CLI and standalone script support

### 2. Different Contexts

- Inside NestJS application: Config is accessed through ConfigService (`app.module.ts`)
- Outside NestJS (migrations, CLI): Direct DataSource is needed (`data-source.ts`)

### 3. TypeORM CLI Compatibility

The TypeORM CLI requires a DataSource object exported from a JavaScript/TypeScript file to run migrations and other database operations.

## Best Practices

When making changes to database configuration:

1. Update `src/config/database.config.ts` first
2. Ensure that any direct configurations in `src/data-source.ts` match those settings
3. The `app.module.ts` configuration will automatically use your updated settings via ConfigService

This pattern enables flexibility while maintaining a single source of truth in your configuration files.

## Migration Commands

To run migrations using the standalone DataSource:

```bash
# Generate a new migration
npm run typeorm:generate -- src/migrations/YourMigrationName

# Run migrations
npm run typeorm:run

# Revert the last migration
npm run typeorm:revert
```

Note: These commands depend on your project's script configuration in package.json.

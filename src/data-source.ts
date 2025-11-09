import { DataSource, DataSourceOptions } from 'typeorm';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env' });

// Load fallback environment variables if .env is not found
if (!process.env.DATABASE_HOST) {
    dotenv.config({ path: '.env.example' });
}

export const dataSourceOptions: DataSourceOptions = {
    type: 'postgres',
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432', 10),
    username: process.env.DATABASE_USERNAME || 'postgres',
    password: process.env.DATABASE_PASSWORD || 'postgres',
    database: process.env.DATABASE_NAME || 'ts_backend',
    entities: ['src/**/*.entity{.ts,.js}', 'dist/**/*.entity{.ts,.js}'],
    migrations: ['src/migrations/*{.ts,.js}', 'dist/migrations/*{.ts,.js}'],
    synchronize: false, // Never use synchronize in production
    logging: process.env.DATABASE_LOGGING === 'true',
};

const dataSource = new DataSource(dataSourceOptions);
export default dataSource;

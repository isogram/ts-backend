import { registerAs } from '@nestjs/config';

export default registerAs('database', () => ({
    type: process.env.DATABASE_TYPE || 'postgres',
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432', 10),
    username: process.env.DATABASE_USERNAME || 'postgres',
    password: process.env.DATABASE_PASSWORD || 'postgres',
    database: process.env.DATABASE_NAME || 'ts_backend',
    synchronize: process.env.DATABASE_SYNCHRONIZE === 'true',
    logging: process.env.DATABASE_LOGGING === 'true',
    autoLoadEntities: process.env.DATABASE_AUTOLOAD_ENTITIES === 'false' ? false : true,
    entities: ['src/**/*.entity{.ts,.js}', 'dist/**/*.entity{.ts,.js}'],
    migrations: ['src/migrations/*{.ts,.js}', 'dist/migrations/*{.ts,.js}'],
    migrationsRun: process.env.DATABASE_MIGRATIONS_RUN === 'true',
    cli: {
        migrationsDir: 'src/migrations',
    },
}));

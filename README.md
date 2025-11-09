# TS Backend

A comprehensive NestJS backend boilerplate with batteries included. This project provides a robust foundation for building scalable, secure, and maintainable Node.js applications.

## Features

- **Authentication**: JWT and OAuth2 authentication
- **Authorization**: Role-based access control with admin and user routes separation
- **Database Integration**: TypeORM with PostgreSQL
- **API Routing**: NestJS Express integration
- **Error Handling**: Custom error classes and global error filter
- **Structured Logging**: Winston logger with request ID and correlation ID
- **Distributed Tracing**: X-Trace-ID header propagation with AsyncLocalStorage context
- **Queue Processing**: Bull with Redis integration and admin UI
- **Caching**: NestJS Cache Manager with memory/Redis store
- **File Upload**: Multer with AWS S3 / MinIO integration
- **Containerization**: Docker and Docker Compose support
- **Serverless**: AWS Lambda deployment configuration
- **API Documentation**: Swagger / OpenAPI integration
- **Security**: Helmet, CORS, rate limiting

## Architecture Overview

### Project Structure

```plaintext
src/
├── config/             # Configuration files for different components
├── database/           # Database seeders and related tools
├── middleware/         # Custom middleware
├── migrations/         # Database migrations
├── modules/            # Feature modules (auth, users, files, etc.)
│   ├── auth/           # Authentication
│   │   ├── controllers/
│   │   ├── dto/        # Data Transfer Objects
│   │   ├── entities/   # Database entities
│   │   ├── strategies/ # Auth strategies (JWT, OAuth2)
│   ├── users/          # User management
│   │   ├── controllers/
│   │       ├── users.controller.ts      # Public user endpoints
│   │       └── admin-users.controller.ts # Admin user management
│   └── files/          # File uploads
│       ├── controllers/
│           ├── files.controller.ts      # Public file endpoints
│           └── admin-files.controller.ts # Admin file management
├── shared/             # Shared components
│   ├── decorators/     # Custom decorators (@Public, @Roles)
│   ├── exceptions/     # Exception classes
│   ├── filters/        # Global filters (error handling)
│   ├── guards/         # Auth guards (JWT, Roles)
│   ├── interceptors/   # Request interceptors (logging)
│   ├── modules/        # Shared modules (logger, queue)
│   └── services/       # Shared services (email, storage, etc.)
└── main.ts             # Application entry point
```

## Key Concepts

### Authentication and Authorization

The application implements a robust authentication system using JWT tokens:

1. **JWT Authentication**: Secure token-based authentication with refresh token support
2. **OAuth2 Integration**: Support for social logins (Google, GitHub, Facebook)
3. **Role-Based Access Control**: Users are assigned roles (user, admin, super_admin)
4. **Public Endpoints**: Use the `@Public()` decorator to exempt routes from authentication

```typescript
// Example of a secured admin-only endpoint
@Controller('admin/users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
export class AdminUsersController {
    // Admin-only endpoints
}

// Example of a public endpoint
@Public()
@Post('login')
async login(@Body() loginDto: LoginDto): Promise<LoginResponse> {
    // Authentication logic
}
```

### Admin vs Regular User Routes

The application separates admin routes from regular user routes:

1. **Admin Routes**: Protected with `@Roles(UserRole.ADMIN)` and prefixed with `/admin/`
2. **Regular User Routes**: Available to authenticated users, with permissions based on resource ownership
3. **Role-Based Authorization**: Using guards to enforce role requirements across the application

### Database Configuration

The application has three database configuration files for different purposes:

1. **`src/config/database.config.ts`**: Source of truth for database configuration
2. **`src/app.module.ts`**: Configures TypeORM for NestJS dependency injection
3. **`src/data-source.ts`**: Standalone DataSource for TypeORM CLI and migrations

See `docs/database-configuration.md` for details on why this structure is used.

### Queue System

The application uses Bull with Redis for background job processing:

1. **Queue Management**: Process tasks asynchronously (emails, file processing)
2. **Admin UI**: Bull-Board dashboard available at `/admin/queues` for monitoring jobs
3. **Multiple Processors**: Different processors handle different types of jobs

See `docs/queue-system.md` for details on the queue architecture.

### File Storage

The application supports multiple storage options:

1. **S3-Compatible Storage**: Works with AWS S3, MinIO, and other S3-compatible storage
2. **Local File Storage**: For development or smaller deployments
3. **File Access Control**: Files can be public or private with access control

### Caching

The application provides a flexible caching system:

1. **In-Memory Cache**: Default for development
2. **Redis Cache**: For production environments (see `docs/redis-caching.md`)
3. **Cache Decorators**: Easy-to-use cache annotations for controllers

## Getting Started

### Prerequisites

- Node.js (v16+)
- Docker and Docker Compose (for local development)
- PostgreSQL (if not using Docker)
- Redis (if not using Docker)

### Installation

```bash
npm install
```

### Environment Setup

Copy the example environment file:

```bash
cp .env.example .env
```

Then edit the `.env` file with your specific configuration.

### Running with Docker Compose (Recommended)

```bash
# Start all services
docker-compose up

# Start in detached mode
docker-compose up -d

# Stop all services
docker-compose down
```

### Running Without Docker

```bash
# Development mode
npm run start

# Watch mode
npm run start:dev

# Production mode
npm run start:prod
```

## Database Management

### Configuration

The database configuration can be found in `src/config/database.config.ts` and key options in `.env`:

```env
DATABASE_TYPE=postgres
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=ts_backend
DATABASE_SYNCHRONIZE=false  # Should be false in production
DATABASE_LOGGING=true
DATABASE_MIGRATIONS_RUN=true
```

### Migrations

For production environments, use database migrations:

```bash
# Create a new migration (empty)
npm run migration:create -- --name=MigrationName

# Generate a migration from entity changes
npm run migration:generate -- --name=MigrationName

# Run migrations
npm run migration:run

# Revert the last migration
npm run migration:revert
```

### Database Seeding

To seed your database with initial data:

```bash
# Run all seeders
npm run db:seed
```

## Queue Management

The application uses Bull with Redis for background job processing. Access the dashboard at:

```
http://localhost:3000/admin/queues
```

Username: admin  
Password: password

## API Documentation

Swagger API documentation is available at:

```
http://localhost:3000/api/docs
```

## Security Measures

The application implements several security best practices:

1. **Helmet**: Sets HTTP security headers
2. **Rate Limiting**: Protects against brute force attacks
3. **CORS**: Controls cross-origin requests
4. **Validation**: Validates all incoming data with DTO schemas
5. **Password Hashing**: Uses bcrypt for secure password storage

## Deployment

### Docker / ECS

```bash
# Build the Docker image
docker build -t ts-backend .

# Run the container
docker run -p 3000:3000 ts-backend
```

### AWS Lambda

```bash
# Install serverless framework
npm install -g serverless

# Deploy to AWS
serverless deploy
```

## Development Guidelines

### Adding New Features

1. Create a new module in the `src/modules` directory
2. Implement entities, DTOs, services, and controllers
3. Follow the separation of admin vs. regular user routes
4. Add appropriate guards and decorators for security

### Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## Documentation

See the `docs` folder for detailed documentation on various aspects of the application:

- [Database Configuration](docs/database-configuration.md)
- [Queue System](docs/queue-system.md)
- [Redis Caching](docs/redis-caching.md)
- [Path Aliases](docs/path-aliases.md)
- [Queue Dashboard](docs/queue-dashboard.md)
- [Logging](docs/logging.md)

## License

MIT

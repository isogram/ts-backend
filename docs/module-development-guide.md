# Module Development Guide

This document provides a comprehensive guide for creating new modules in the TS backend application and managing communication between modules.

## Table of Contents

1. [Module Architecture Overview](#module-architecture-overview)
2. [Creating a New Module](#creating-a-new-module)
3. [Inter-Module Communication](#inter-module-communication)
5. [Best Practices](#best-practices)
6. [Examples](#examples)

## Module Architecture Overview

Our NestJS application follows a modular architecture where each feature is encapsulated in its own module. This approach provides:

- **Separation of Concerns**: Each module handles a specific domain
- **Reusability**: Modules can be easily reused across different parts of the application
- **Testability**: Modules can be tested in isolation
- **Maintainability**: Changes in one module don't affect others

### Module Types

1. **Feature Modules**: Business logic modules (users, auth, files, etc.)
2. **Shared Modules**: Common functionality used across features
3. **Core Modules**: Application-wide singletons (database, configuration)

## Creating a New Module

### Step 1: Generate Module Structure

Use the NestJS CLI to generate a new module:

```bash
# Generate a new module (replace 'products' with your module name)
nest generate module modules/products
nest generate controller modules/products/controllers/products
nest generate controller modules/products/controllers/admin-products
nest generate service modules/products/products
nest generate class modules/products/entities/product.entity --no-spec
nest generate class modules/products/dto/create-product.dto --no-spec
nest generate class modules/products/dto/update-product.dto --no-spec
```

Or create the structure manually:

```plaintext
src/modules/products/
├── controllers/
│   ├── products.controller.ts          # Public endpoints
│   └── admin-products.controller.ts    # Admin endpoints
├── dto/
│   ├── create-product.dto.ts
│   ├── update-product.dto.ts
│   └── query-product.dto.ts
├── entities/
│   └── product.entity.ts
├── products.module.ts
├── products.service.ts
└── tests/
    ├── products.controller.spec.ts
    ├── products.service.spec.ts
    └── admin-products.controller.spec.ts
```

### Step 2: Create the Entity

Define your database entity:

```typescript
// src/modules/products/entities/product.entity.ts
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { User } from '@modules/users/entities/user.entity';

@Entity('products')
export class Product {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ length: 255 })
    name: string;

    @Column('text', { nullable: true })
    description: string;

    @Column('decimal', { precision: 10, scale: 2 })
    price: number;

    @Column({ default: true })
    isActive: boolean;

    @Column({ name: 'created_by' })
    createdBy: string;

    @ManyToOne(() => User, { nullable: false })
    @JoinColumn({ name: 'created_by' })
    creator: User;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
```

### Step 3: Create DTOs

Define your Data Transfer Objects:

```typescript
// src/modules/products/dto/create-product.dto.ts
import { IsString, IsNumber, IsOptional, IsBoolean, MinLength, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateProductDto {
    @ApiProperty({ description: 'Product name', minLength: 2 })
    @IsString()
    @MinLength(2)
    name: string;

    @ApiProperty({ description: 'Product description', required: false })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiProperty({ description: 'Product price', minimum: 0 })
    @IsNumber({ maxDecimalPlaces: 2 })
    @Min(0)
    price: number;

    @ApiProperty({ description: 'Is product active', default: true })
    @IsOptional()
    @IsBoolean()
    isActive?: boolean = true;
}
```

```typescript
// src/modules/products/dto/update-product.dto.ts
import { PartialType } from '@nestjs/swagger';
import { CreateProductDto } from './create-product.dto';

export class UpdateProductDto extends PartialType(CreateProductDto) {}
```

### Step 4: Create the Service

Implement your business logic:

```typescript
// src/modules/products/products.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { UsersService } from '@modules/users/users.service';
import { LoggerService } from '@shared/modules/logger/logger.service';

@Injectable()
export class ProductsService {
    constructor(
        @InjectRepository(Product)
        private productsRepository: Repository<Product>,
        private usersService: UsersService,  // Example of service injection
        private logger: LoggerService,
    ) {}

    async create(createProductDto: CreateProductDto, userId: string): Promise<Product> {
        this.logger.debug(`Creating product: ${createProductDto.name}`, { userId });
        
        // Validate user exists (example of inter-module communication)
        await this.usersService.findById(userId);

        const product = this.productsRepository.create({
            ...createProductDto,
            createdBy: userId,
        });

        return this.productsRepository.save(product);
    }

    async findAll(): Promise<Product[]> {
        return this.productsRepository.find({
            relations: ['creator'],
            where: { isActive: true },
        });
    }

    async findById(id: string): Promise<Product> {
        const product = await this.productsRepository.findOne({
            where: { id },
            relations: ['creator'],
        });

        if (!product) {
            throw new NotFoundException('Product not found');
        }

        return product;
    }

    async update(id: string, updateProductDto: UpdateProductDto): Promise<Product> {
        const product = await this.findById(id);
        
        Object.assign(product, updateProductDto);
        
        return this.productsRepository.save(product);
    }

    async delete(id: string): Promise<void> {
        const result = await this.productsRepository.delete(id);
        
        if (result.affected === 0) {
            throw new NotFoundException('Product not found');
        }
    }
}
```

### Step 5: Create Controllers

Create separate controllers for public and admin endpoints:

```typescript
// src/modules/products/controllers/products.controller.ts
import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    UseGuards,
    Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ProductsService } from '../products.service';
import { CreateProductDto } from '../dto/create-product.dto';
import { UpdateProductDto } from '../dto/update-product.dto';
import { JwtAuthGuard } from '@shared/guards/jwt-auth.guard';
import { Public } from '@shared/decorators/public.decorator';

@ApiTags('products')
@Controller('products')
export class ProductsController {
    constructor(private readonly productsService: ProductsService) {}

    @Public()
    @Get()
    @ApiOperation({ summary: 'Get all active products' })
    findAll() {
        return this.productsService.findAll();
    }

    @Public()
    @Get(':id')
    @ApiOperation({ summary: 'Get product by ID' })
    findOne(@Param('id') id: string) {
        return this.productsService.findById(id);
    }

    @Post()
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Create a new product' })
    create(@Body() createProductDto: CreateProductDto, @Request() req) {
        return this.productsService.create(createProductDto, req.user.sub);
    }

    @Patch(':id')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Update product' })
    update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto) {
        return this.productsService.update(id, updateProductDto);
    }
}
```

```typescript
// src/modules/products/controllers/admin-products.controller.ts
import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ProductsService } from '../products.service';
import { CreateProductDto } from '../dto/create-product.dto';
import { UpdateProductDto } from '../dto/update-product.dto';
import { JwtAuthGuard } from '@shared/guards/jwt-auth.guard';
import { RolesGuard } from '@shared/guards/roles.guard';
import { Roles } from '@shared/decorators/roles.decorator';
import { UserRole } from '@modules/users/entities/user.entity';

@ApiTags('admin-products')
@Controller('admin/products')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
@ApiBearerAuth()
export class AdminProductsController {
    constructor(private readonly productsService: ProductsService) {}

    @Get()
    @ApiOperation({ summary: 'Get all products (including inactive)' })
    findAll() {
        // This would be a different method that includes inactive products
        return this.productsService.findAllForAdmin();
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete product permanently' })
    remove(@Param('id') id: string) {
        return this.productsService.delete(id);
    }
}
```

### Step 6: Create the Module

Define your module configuration:

```typescript
// src/modules/products/products.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { ProductsService } from './products.service';
import { Product } from './entities/product.entity';
import { ProductsController } from './controllers/products.controller';
import { AdminProductsController } from './controllers/admin-products.controller';
import { UsersModule } from '@modules/users/users.module'; // Import needed modules
import { LoggerModule } from '@shared/modules/logger/logger.module';

@Module({
    imports: [
        ConfigModule,
        TypeOrmModule.forFeature([Product]), // Register entities
        UsersModule,    // Import for UsersService
        LoggerModule,   // Import for LoggerService
    ],
    controllers: [
        ProductsController,
        AdminProductsController,
    ],
    providers: [ProductsService],
    exports: [ProductsService], // Export service for other modules
})
export class ProductsModule {}
```

### Step 7: Register in App Module

Add your module to the main application module:

```typescript
// src/app.module.ts
import { ProductsModule } from '@modules/products/products.module';

@Module({
    imports: [
        // ... other imports
        ProductsModule, // Add your new module
    ],
    // ... rest of configuration
})
export class AppModule {}
```

## Inter-Module Communication

### 1. Service Injection

The most common way modules communicate is through service injection:

```typescript
// In ProductsService
constructor(
    @InjectRepository(Product)
    private productsRepository: Repository<Product>,
    private usersService: UsersService,  // Injected from UsersModule
    private emailService: EmailService,  // Injected from shared services
) {}
```

**Requirements:**

- The target module must export the service
- Your module must import the target module

### 2. Event-Based Communication

Use NestJS EventEmitter for loose coupling:

```typescript
// Install event emitter
npm install @nestjs/event-emitter

// In ProductsService
import { EventEmitter2 } from '@nestjs/event-emitter';

constructor(
    private eventEmitter: EventEmitter2,
) {}

async create(createProductDto: CreateProductDto): Promise<Product> {
    const product = await this.productsRepository.save(newProduct);
    
    // Emit event
    this.eventEmitter.emit('product.created', {
        productId: product.id,
        userId: product.createdBy,
    });
    
    return product;
}
```

```typescript
// In EmailService or another service
import { OnEvent } from '@nestjs/event-emitter';

@OnEvent('product.created')
async handleProductCreated(payload: { productId: string; userId: string }) {
    // Send notification email
    await this.sendProductCreatedEmail(payload.userId, payload.productId);
}
```

### 3. Queue-Based Communication

For asynchronous processing:

```typescript
// In ProductsService
constructor(
    private queueService: QueueService,
) {}

async create(createProductDto: CreateProductDto): Promise<Product> {
    const product = await this.productsRepository.save(newProduct);
    
    // Queue background task
    await this.queueService.add({
        name: 'product:process-creation',
        payload: {
            productId: product.id,
            userId: product.createdBy,
        },
    });
    
    return product;
}
```

### 4. Database Relations

Use TypeORM relations for data relationships:

```typescript
// In Product entity
@ManyToOne(() => User, user => user.products)
@JoinColumn({ name: 'created_by' })
creator: User;

// In User entity
@OneToMany(() => Product, product => product.creator)
products: Product[];
```

## Best Practices

### 1. Module Design Principles

- **Single Responsibility**: Each module should have one clear purpose
- **Loose Coupling**: Minimize dependencies between modules
- **High Cohesion**: Related functionality should be in the same module

### 2. Dependency Management

- Always export services that other modules might need
- Import only the modules you actually use
- Avoid circular dependencies

### 3. Error Handling

Use consistent error handling across modules:

```typescript
import { NotFoundException, BadRequestException } from '@shared/exceptions/app.exception';

// Use custom exceptions for consistency
throw new NotFoundException('Product not found');
```

### 4. Logging

Use the centralized logging service:

```typescript
constructor(
    private logger: LoggerService,
) {}

async someMethod() {
    this.logger.debug('Processing product creation', { productId: '123' });
    this.logger.error('Failed to create product', { error: error.message });
}
```

### 5. Configuration

Use the configuration service for module-specific settings:

```typescript
// In your service
constructor(
    private configService: ConfigService,
) {}

getProductLimit(): number {
    return this.configService.get<number>('products.maxPerUser', 10);
}
```

## Examples

### Example 1: Orders Module Communicating with Products and Users

```typescript
// orders.service.ts
@Injectable()
export class OrdersService {
    constructor(
        @InjectRepository(Order)
        private ordersRepository: Repository<Order>,
        private productsService: ProductsService,  // Direct injection
        private usersService: UsersService,        // Direct injection
        private emailService: EmailService,        // Shared service
        private queueService: QueueService,        // Async processing
        private eventEmitter: EventEmitter2,       // Event communication
    ) {}

    async createOrder(createOrderDto: CreateOrderDto, userId: string): Promise<Order> {
        // Validate user
        const user = await this.usersService.findById(userId);
        
        // Validate products
        const products = await Promise.all(
            createOrderDto.productIds.map(id => this.productsService.findById(id))
        );
        
        // Create order
        const order = await this.ordersRepository.save({
            userId,
            products,
            total: this.calculateTotal(products),
        });
        
        // Emit event for other modules to react
        this.eventEmitter.emit('order.created', {
            orderId: order.id,
            userId,
            products: products.map(p => p.id),
        });
        
        // Queue background tasks
        await this.queueService.add({
            name: 'order:send-confirmation',
            payload: { orderId: order.id },
        });
        
        return order;
    }
}
```

### Example 2: Event-Driven Architecture

```typescript
// Multiple services can listen to the same event
@OnEvent('user.registered')
async handleUserRegistered(payload: { userId: string, email: string }) {
    // EmailService: Send welcome email
    await this.sendWelcomeEmail(payload.email);
}

@OnEvent('user.registered')  
async handleUserRegistered(payload: { userId: string }) {
    // ProfileService: Create default profile
    await this.createDefaultProfile(payload.userId);
}

@OnEvent('user.registered')
async handleUserRegistered(payload: { userId: string }) {
    // AnalyticsService: Track registration
    await this.trackUserRegistration(payload.userId);
}
```

This guide provides a comprehensive approach to creating and managing modules in your NestJS application. Follow these patterns to maintain consistency and ensure your application remains scalable and maintainable.
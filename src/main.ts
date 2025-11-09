import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import compression from 'compression';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from '@shared/filters/global-exception.filter';
import { LoggingInterceptor } from '@shared/interceptors/logging.interceptor';
import { LoggerService } from '@shared/modules/logger/logger.service';

async function bootstrap() {
  // Create NestJS app
  const app = await NestFactory.create(AppModule);

  // Get config service and logger
  const configService = app.get(ConfigService);
  const loggerService = app.get(LoggerService);
  const port = configService.get<number>('app.port', 3000);
  const apiPrefix = configService.get<string>('app.apiPrefix', 'api');
  const swaggerEnabled = configService.get<boolean>('app.swaggerEnabled', true);
  const environment = configService.get<string>('app.nodeEnv', 'development');

  // Global prefix
  app.setGlobalPrefix(apiPrefix);

  // Security
  app.use(helmet());

  // CORS
  app.enableCors();

  // Compression
  app.use(compression());

  // Global exception filter
  app.useGlobalFilters(new GlobalExceptionFilter());

  // Logging interceptor
  app.useGlobalInterceptors(new LoggingInterceptor());

  // Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Swagger API documentation
  if (swaggerEnabled) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('TS Backend API')
      .setDescription('TS Backend API Documentation')
      .setVersion('1.0')
      .addBearerAuth()
      .addTag('auth')
      .addTag('users')
      .addTag('files')
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup(`${apiPrefix}/docs`, app, document);
  }

  await app.listen(port);
  loggerService.log(`Application is running on: http://localhost:${port}/${apiPrefix}`);
  if (swaggerEnabled) {
    loggerService.log(`Swagger documentation is available at: http://localhost:${port}/${apiPrefix}/docs`);
  }
}

bootstrap();

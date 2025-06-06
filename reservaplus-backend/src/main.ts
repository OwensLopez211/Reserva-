// src/main.ts
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';

import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Security
  app.use(helmet());

  // CORS
  app.enableCors({
    origin: configService.get<string>('app.frontendUrl') || 'http://localhost:4200',
    credentials: true,
  });

  // Global pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Global prefix
  app.setGlobalPrefix('api');

  // Swagger Documentation
  const swaggerConfig = new DocumentBuilder()
    .setTitle('ReservaPlus API')
    .setDescription('API para la plataforma configurable de gestión de reservas ReservaPlus')
    .setVersion('1.0')
    .addServer('http://localhost:3000', 'Desarrollo Local')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Token JWT de Auth0',
        in: 'header',
      },
      'JWT-auth',
    )
    .addTag('Health', 'Health checks y estado del sistema')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);

  // Configurar Swagger UI
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'none',
      filter: true,
      showRequestDuration: true,
    },
    customSiteTitle: 'ReservaPlus API Documentation',
  });

  const port = configService.get<number>('app.port') || 3000;
  await app.listen(port);

  console.log(`🚀 ReservaPlus API running on: http://localhost:${port}`);
  console.log(`📚 API Documentation: http://localhost:${port}/api/docs`);
}

void bootstrap();

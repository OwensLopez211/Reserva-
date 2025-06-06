import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '@nestjs/cache-manager';
import { ThrottlerModule } from '@nestjs/throttler';
import { JwtModule } from '@nestjs/jwt';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TestController } from './test/test.controller';

import { databaseConfig } from './config/database.config';
import { authConfig } from './config/auth.config';
import { redisConfig } from './config/redis.config';
import { appConfig } from './config/app.config';

// Importar MÓDULOS completos
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
// import { OrganizationsModule } from './organizations/organizations.module'; // Cuando lo crees

// Entities
import { User } from './users/entities/user.entity';
import { Organization } from './organizations/entities/organization.entity';
import { OrganizationUser } from './organizations/entities/organization-user.entity';

@Module({
  imports: [
    // Environment Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig, authConfig, redisConfig, appConfig],
    }),

    // Database Configuration
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres' as const,
        host: configService.get<string>('database.host'),
        port: configService.get<number>('database.port'),
        username: configService.get<string>('database.username'),
        password: configService.get<string>('database.password'),
        database: configService.get<string>('database.name'),
        entities: [User, Organization, OrganizationUser],
        synchronize: configService.get('NODE_ENV') === 'development',
        logging: configService.get('NODE_ENV') === 'development',
      }),
    }),

    // Redis Cache Configuration
    CacheModule.register({
      isGlobal: true,
      ttl: 300, // 5 minutes default
    }),

    // Rate Limiting
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute
        limit: 100, // 100 requests per minute
      },
    ]),

    // JWT Module for TestController
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('auth.jwtSecret'),
        signOptions: {
          expiresIn: configService.get<string>('auth.jwtExpiresIn'),
        },
      }),
    }),

    // *** AGREGAR LOS MÓDULOS AQUÍ ***
    AuthModule,
    UsersModule,
    // OrganizationsModule, // Cuando lo crees
  ],
  controllers: [AppController, TestController],
  providers: [AppService],
})
export class AppModule {}

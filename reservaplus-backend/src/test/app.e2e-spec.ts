// test/auth.e2e-spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { AppModule } from '../app.module';
import { User } from '../users/entities/user.entity';
import { OrganizationUser } from '../organizations/entities/organization-user.entity';
import { TestAuthHelper, mockUser, mockOrganization } from './test-setup';

describe('Auth Controller (e2e)', () => {
  let app: INestApplication;
  let userRepository: Repository<User>;
  let orgUserRepository: Repository<OrganizationUser>;
  let authHelper: TestAuthHelper;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(getRepositoryToken(User))
      .useValue({
        findOne: jest.fn(),
        create: jest.fn(),
        save: jest.fn(),
        createQueryBuilder: jest.fn(() => ({
          innerJoin: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          andWhere: jest.fn().mockReturnThis(),
          orderBy: jest.fn().mockReturnThis(),
          skip: jest.fn().mockReturnThis(),
          take: jest.fn().mockReturnThis(),
          getManyAndCount: jest.fn(),
        })),
      })
      .overrideProvider(getRepositoryToken(OrganizationUser))
      .useValue({
        find: jest.fn(),
        findOne: jest.fn(),
        createQueryBuilder: jest.fn(() => ({
          innerJoin: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          andWhere: jest.fn().mockReturnThis(),
          orderBy: jest.fn().mockReturnThis(),
          getOne: jest.fn(),
        })),
      })
      .compile();

    app = moduleFixture.createNestApplication();

    // Configurar pipes como en main.ts
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    app.setGlobalPrefix('api');

    userRepository = moduleFixture.get<Repository<User>>(getRepositoryToken(User));
    orgUserRepository = moduleFixture.get<Repository<OrganizationUser>>(
      getRepositoryToken(OrganizationUser),
    );

    authHelper = new TestAuthHelper();

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /auth/login', () => {
    it('should return login URL', async () => {
      const response = await request(app.getHttpServer()).get('/api/auth/login').expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          loginUrl: expect.stringContaining('authorize'),
        },
        timestamp: expect.any(String),
        requestId: expect.any(String),
      });
    });

    it('should include returnTo parameter in login URL', async () => {
      const returnTo = 'http://localhost:4200/dashboard';

      const response = await request(app.getHttpServer())
        .get('/api/auth/login')
        .query({ returnTo })
        .expect(200);

      expect(response.body.data.loginUrl).toContain('state=' + encodeURIComponent(returnTo));
    });
  });

  describe('GET /auth/profile', () => {
    it('should return user profile when authenticated', async () => {
      // Mock del usuario existente
      userRepository.findOne = jest.fn().mockResolvedValue(mockUser);
      orgUserRepository.findOne = jest.fn().mockResolvedValue({
        organizationId: 'org-123456789',
        role: 'admin',
        isActive: true,
      });

      const token = authHelper.generateTestToken();

      const response = await request(app.getHttpServer())
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          id: expect.any(String),
          email: 'test@example.com',
          fullName: expect.any(String),
        },
      });
    });

    it('should fail without authorization token', async () => {
      await request(app.getHttpServer()).get('/api/auth/profile').expect(401);
    });

    it('should work without organization context', async () => {
      userRepository.findOne = jest.fn().mockResolvedValue(mockUser);
      orgUserRepository.findOne = jest.fn().mockResolvedValue(null);

      const token = authHelper.generateTokenWithoutOrg();

      const response = await request(app.getHttpServer())
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('POST /auth/switch-organization', () => {
    it('should switch organization successfully', async () => {
      userRepository.findOne = jest.fn().mockResolvedValue(mockUser);
      orgUserRepository.findOne = jest.fn().mockResolvedValue({
        organizationId: 'org-different-123',
        role: 'manager',
        isActive: true,
      });

      const token = authHelper.generateTestToken();

      const switchData = {
        organizationId: 'org-different-123',
      };

      const response = await request(app.getHttpServer())
        .post('/api/auth/switch-organization')
        .set('Authorization', `Bearer ${token}`)
        .send(switchData)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          accessToken: expect.any(String),
          expiresIn: expect.any(Number),
        },
        message: 'Organization switched successfully',
      });
    });

    it('should fail with invalid organization ID', async () => {
      userRepository.findOne = jest.fn().mockResolvedValue(mockUser);
      orgUserRepository.findOne = jest.fn().mockResolvedValue(null);

      const token = authHelper.generateTestToken();

      const switchData = {
        organizationId: 'org-invalid-123',
      };

      await request(app.getHttpServer())
        .post('/api/auth/switch-organization')
        .set('Authorization', `Bearer ${token}`)
        .send(switchData)
        .expect(401);
    });

    it('should validate UUID format for organizationId', async () => {
      const token = authHelper.generateTestToken();

      const switchData = {
        organizationId: 'invalid-uuid',
      };

      await request(app.getHttpServer())
        .post('/api/auth/switch-organization')
        .set('Authorization', `Bearer ${token}`)
        .send(switchData)
        .expect(400);
    });
  });

  describe('POST /auth/refresh', () => {
    it('should refresh token successfully', async () => {
      userRepository.findOne = jest.fn().mockResolvedValue(mockUser);

      const refreshToken = authHelper.generateTestToken();

      const refreshData = {
        refreshToken,
      };

      const response = await request(app.getHttpServer())
        .post('/api/auth/refresh')
        .send(refreshData)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          accessToken: expect.any(String),
          expiresIn: expect.any(Number),
        },
      });
    });

    it('should fail with expired token', async () => {
      const expiredToken = authHelper.generateExpiredToken();

      const refreshData = {
        refreshToken: expiredToken,
      };

      await request(app.getHttpServer()).post('/api/auth/refresh').send(refreshData).expect(401);
    });

    it('should fail with invalid token', async () => {
      const refreshData = {
        refreshToken: 'invalid.token.here',
      };

      await request(app.getHttpServer()).post('/api/auth/refresh').send(refreshData).expect(401);
    });
  });

  describe('POST /auth/logout', () => {
    it('should logout successfully', async () => {
      const token = authHelper.generateTestToken();

      const response = await request(app.getHttpServer())
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Logged out successfully',
      });
    });

    it('should fail without authorization', async () => {
      await request(app.getHttpServer()).post('/api/auth/logout').expect(401);
    });
  });

  describe('GET /auth/me', () => {
    it('should return current user info', async () => {
      userRepository.findOne = jest.fn().mockResolvedValue(mockUser);
      orgUserRepository.findOne = jest.fn().mockResolvedValue({
        organizationId: 'org-123456789',
        role: 'admin',
        isActive: true,
      });

      const token = authHelper.generateTestToken();

      const response = await request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          email: 'test@example.com',
          fullName: expect.any(String),
        },
      });
    });
  });

  describe('POST /auth/callback', () => {
    it('should handle Auth0 callback', async () => {
      const callbackData = {
        code: 'test-auth-code',
        state: 'test-state',
      };

      const response = await request(app.getHttpServer())
        .post('/api/auth/callback')
        .send(callbackData)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: expect.stringContaining('Auth0 callback'),
      });
    });
  });
});

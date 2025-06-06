import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { JwtService } from '@nestjs/jwt';

import { AppModule } from '../app.module';

describe('Auth Endpoints (e2e)', () => {
  let app: INestApplication;
  let jwtService: JwtService;

  // Helper para generar tokens de testing
  const generateTestToken = (payload: any = {}) => {
    const defaultPayload = {
      sub: 'auth0|test123456789',
      email: 'test@example.com',
      organizationId: 'org-123456789',
      role: 'admin',
      name: 'Test User',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
      ...payload,
    };

    return jwtService.sign(defaultPayload);
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

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

    jwtService = moduleFixture.get<JwtService>(JwtService);

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /api/auth/login', () => {
    it('should return Auth0 login URL', async () => {
      const response = await request(app.getHttpServer()).get('/api/auth/login').expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          loginUrl: expect.stringContaining('authorize'),
        },
        timestamp: expect.any(String),
        requestId: expect.any(String),
      });

      // Verificar que la URL contiene los parámetros necesarios
      const loginUrl = response.body.data.loginUrl;
      expect(loginUrl).toContain('response_type=code');
      expect(loginUrl).toContain('client_id=');
      expect(loginUrl).toContain('redirect_uri=');
      expect(loginUrl).toContain('scope=openid%20profile%20email');
    });

    it('should include returnTo parameter when provided', async () => {
      const returnTo = 'http://localhost:4200/dashboard';

      const response = await request(app.getHttpServer())
        .get('/api/auth/login')
        .query({ returnTo })
        .expect(200);

      const loginUrl = response.body.data.loginUrl;
      expect(loginUrl).toContain(`state=${encodeURIComponent(returnTo)}`);
    });

    it('should work without returnTo parameter', async () => {
      const response = await request(app.getHttpServer()).get('/api/auth/login').expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.loginUrl).toBeDefined();
    });
  });

  describe('POST /api/auth/callback', () => {
    it('should handle Auth0 callback (placeholder)', async () => {
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

    it('should handle callback without state', async () => {
      const callbackData = {
        code: 'test-auth-code',
      };

      const response = await request(app.getHttpServer())
        .post('/api/auth/callback')
        .send(callbackData)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/auth/profile (Protected)', () => {
    it('should return 401 without token', async () => {
      await request(app.getHttpServer()).get('/api/auth/profile').expect(401);
    });

    it('should return 401 with invalid token', async () => {
      await request(app.getHttpServer())
        .get('/api/auth/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });

    it('should return 401 with malformed Authorization header', async () => {
      await request(app.getHttpServer())
        .get('/api/auth/profile')
        .set('Authorization', 'InvalidFormat token')
        .expect(401);
    });

    // Nota: Este test requeriría mocking más complejo de la base de datos
    // Para testing real, necesitarías una base de datos de test
    it.skip('should return user profile with valid token', async () => {
      const token = generateTestToken();

      const response = await request(app.getHttpServer())
        .get('/api/auth/profile')
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

  describe('GET /api/auth/me (Protected)', () => {
    it('should return 401 without authorization', async () => {
      await request(app.getHttpServer()).get('/api/auth/me').expect(401);
    });

    it('should return 401 with expired token', async () => {
      const expiredToken = jwtService.sign({
        sub: 'auth0|test123',
        email: 'test@example.com',
        iat: Math.floor(Date.now() / 1000) - 7200, // 2 horas atrás
        exp: Math.floor(Date.now() / 1000) - 3600, // 1 hora atrás (expirado)
      });

      await request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);
    });
  });

  describe('POST /api/auth/switch-organization (Protected)', () => {
    it('should return 401 without token', async () => {
      const switchData = {
        organizationId: 'org-different-123',
      };

      await request(app.getHttpServer())
        .post('/api/auth/switch-organization')
        .send(switchData)
        .expect(401);
    });

    it('should validate UUID format for organizationId', async () => {
      const token = generateTestToken();
      const switchData = {
        organizationId: 'invalid-uuid-format',
      };

      await request(app.getHttpServer())
        .post('/api/auth/switch-organization')
        .set('Authorization', `Bearer ${token}`)
        .send(switchData)
        .expect(400);
    });

    it('should reject missing organizationId', async () => {
      const token = generateTestToken();

      await request(app.getHttpServer())
        .post('/api/auth/switch-organization')
        .set('Authorization', `Bearer ${token}`)
        .send({})
        .expect(400);
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('should validate required refreshToken field', async () => {
      await request(app.getHttpServer()).post('/api/auth/refresh').send({}).expect(400);
    });

    it('should reject invalid token format', async () => {
      const refreshData = {
        refreshToken: 'clearly-invalid-token',
      };

      const response = await request(app.getHttpServer())
        .post('/api/auth/refresh')
        .send(refreshData)
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
      });
    });

    it('should reject empty refreshToken', async () => {
      const refreshData = {
        refreshToken: '',
      };

      await request(app.getHttpServer()).post('/api/auth/refresh').send(refreshData).expect(400);
    });
  });

  describe('POST /api/auth/logout (Protected)', () => {
    it('should return 401 without token', async () => {
      await request(app.getHttpServer()).post('/api/auth/logout').expect(401);
    });

    it.skip('should logout successfully with valid token', async () => {
      const token = generateTestToken();

      const response = await request(app.getHttpServer())
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Logged out successfully',
      });
    });
  });

  describe('API Response Format Consistency', () => {
    it('should return consistent error format for 401', async () => {
      const response = await request(app.getHttpServer()).get('/api/auth/profile').expect(401);

      // Verificar que el formato de error es consistente
      expect(response.body).toHaveProperty('statusCode', 401);
      expect(response.body).toHaveProperty('message');
    });

    it('should return consistent error format for 400', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/refresh')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('statusCode', 400);
      expect(response.body).toHaveProperty('message');
    });
  });

  describe('Rate Limiting (if implemented)', () => {
    it.skip('should handle rate limiting on auth endpoints', async () => {
      // Hacer múltiples requests rápidos
      const promises = Array(10)
        .fill(null)
        .map(() => request(app.getHttpServer()).get('/api/auth/login'));

      const responses = await Promise.all(promises);

      // Todos deberían ser exitosos si no hay rate limiting
      // O algunos deberían ser 429 si hay rate limiting
      responses.forEach((response) => {
        expect([200, 429]).toContain(response.status);
      });
    });
  });
});

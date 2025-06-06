import { JwtService } from '@nestjs/jwt';

export class TestAuthHelper {
  private jwtService: JwtService;

  constructor() {
    this.jwtService = new JwtService({
      secret: 'test-secret-key',
      signOptions: { expiresIn: '1h' },
    });
  }

  /**
   * Genera un token JWT válido para testing
   */
  generateTestToken(payload: {
    sub?: string;
    email?: string;
    organizationId?: string;
    role?: string;
    name?: string;
  } = {}): string {
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

    return this.jwtService.sign(defaultPayload);
  }

  /**
   * Genera headers de autorización para requests
   */
  getAuthHeaders(token?: string): { Authorization: string } {
    const authToken = token || this.generateTestToken();
    return {
      Authorization: `Bearer ${authToken}`,
    };
  }

  /**
   * Genera un token sin organización (para endpoints que lo permiten)
   */
  generateTokenWithoutOrg(payload: any = {}): string {
    return this.generateTestToken({
      ...payload,
      organizationId: undefined,
      role: undefined,
    });
  }

  /**
   * Genera un token expirado para testing
   */
  generateExpiredToken(): string {
    return this.jwtService.sign({
      sub: 'auth0|test123456789',
      email: 'test@example.com',
      iat: Math.floor(Date.now() / 1000) - 7200, // 2 horas atrás
      exp: Math.floor(Date.now() / 1000) - 3600, // 1 hora atrás (expirado)
    });
  }
}

/**
 * Mock de usuario para testing
 */
export const mockUser = {
  id: 'user-123456789',
  auth0UserId: 'auth0|test123456789',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  organizationUsers: [
    {
      id: 'orguser-123',
      organizationId: 'org-123456789',
      userId: 'user-123456789',
      role: 'admin',
      isActive: true,
    },
  ],
};

/**
 * Mock de organización para testing
 */
export const mockOrganization = {
  id: 'org-123456789',
  name: 'Test Clinic',
  slug: 'test-clinic',
  industryType: 'clinic',
  email: 'info@testclinic.com',
  subscriptionStatus: 'active',
};
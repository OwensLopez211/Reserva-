import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';

import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';

// Mocks
const mockConfigService = {
  get: jest.fn((key: string) => {
    const config = {
      'auth.auth0Domain': 'test-domain.auth0.com',
      'auth.auth0ClientId': 'test-client-id',
      'auth.auth0Audience': 'https://api.test.com',
      'auth.jwtExpiresIn': '24h',
      'app.appUrl': 'http://localhost:3000',
    };
    return config[key];
  }),
};

const mockJwtService = {
  sign: jest.fn().mockReturnValue('mocked-jwt-token'),
  verify: jest.fn(),
  decode: jest.fn(),
};

const mockUsersService = {
  findById: jest.fn(),
  getUserOrganizations: jest.fn(),
  getUserOrganizationContext: jest.fn(),
  findByAuth0Id: jest.fn(),
};

const mockUser = {
  id: 'user-123',
  auth0UserId: 'auth0|test123',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  isActive: true,
  organizationUsers: [],
};

describe('AuthService', () => {
  let service: AuthService;
  let usersService: UsersService;
  let jwtService: JwtService;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    jwtService = module.get<JwtService>(JwtService);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getAuth0LoginUrl', () => {
    it('should generate Auth0 login URL', async () => {
      const result = await service.getAuth0LoginUrl();

      expect(result.loginUrl).toContain('test-domain.auth0.com');
      expect(result.loginUrl).toContain('response_type=code');
      expect(result.loginUrl).toContain('client_id=test-client-id');
    });

    it('should include returnTo parameter when provided', async () => {
      const returnTo = 'http://localhost:4200/dashboard';
      const result = await service.getAuth0LoginUrl(returnTo);

      expect(result.loginUrl).toContain(`state=${encodeURIComponent(returnTo)}`);
    });
  });

  describe('getProfile', () => {
    it('should return user profile with organizations', async () => {
      const userContext = {
        id: 'user-123',
        auth0UserId: 'auth0|123',
        email: 'test@example.com',
        organizationId: 'org-123',
        role: 'admin',
        isActive: true,
      };

      mockUsersService.findById.mockResolvedValue(mockUser);
      mockUsersService.getUserOrganizations.mockResolvedValue([
        {
          organizationId: 'org-123',
          role: 'admin',
          isActive: true,
        },
      ]);

      const result = await service.getProfile(userContext);

      expect(result).toMatchObject({
        id: mockUser.id,
        email: mockUser.email,
        fullName: expect.any(String),
        organizations: expect.any(Array),
      });

      expect(mockUsersService.findById).toHaveBeenCalledWith('user-123');
      expect(mockUsersService.getUserOrganizations).toHaveBeenCalledWith(mockUser.id);
    });
  });

  describe('switchOrganization', () => {
    it('should switch organization and return new token', async () => {
      const userContext = {
        id: 'user-123',
        auth0UserId: 'auth0|123',
        email: 'test@example.com',
        organizationId: 'org-old',
        role: 'admin',
        isActive: true,
      };

      const switchDto = {
        organizationId: 'org-new',
      };

      mockUsersService.getUserOrganizationContext.mockResolvedValue({
        organizationId: 'org-new',
        role: 'manager',
        isActive: true,
      });

      const result = await service.switchOrganization(userContext, switchDto);

      expect(result).toMatchObject({
        accessToken: 'mocked-jwt-token',
        expiresIn: expect.any(Number),
      });

      expect(mockJwtService.sign).toHaveBeenCalledWith({
        sub: 'auth0|123',
        email: 'test@example.com',
        organizationId: 'org-new',
        role: 'manager',
      });
    });

    it('should throw UnauthorizedException if user does not belong to organization', async () => {
      const userContext = {
        id: 'user-123',
        auth0UserId: 'auth0|123',
        email: 'test@example.com',
        organizationId: 'org-old',
        role: 'admin',
        isActive: true,
      };

      const switchDto = {
        organizationId: 'org-invalid',
      };

      mockUsersService.getUserOrganizationContext.mockResolvedValue(null);

      await expect(service.switchOrganization(userContext, switchDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('refreshToken', () => {
    it('should refresh token successfully', async () => {
      const payload = {
        sub: 'auth0|123',
        email: 'test@example.com',
        organizationId: 'org-123',
        role: 'admin',
      };

      mockJwtService.verify.mockReturnValue(payload);
      mockUsersService.findByAuth0Id.mockResolvedValue(mockUser);

      const result = await service.refreshToken('valid-token');

      expect(result).toMatchObject({
        accessToken: 'mocked-jwt-token',
        expiresIn: expect.any(Number),
      });

      expect(mockJwtService.verify).toHaveBeenCalledWith('valid-token');
      expect(mockUsersService.findByAuth0Id).toHaveBeenCalledWith('auth0|123');
    });

    it('should throw UnauthorizedException for invalid token', async () => {
      mockJwtService.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(service.refreshToken('invalid-token')).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('logout', () => {
    it('should return success message', async () => {
      const result = await service.logout();

      expect(result).toEqual({
        message: 'Logged out successfully',
      });
    });
  });
});

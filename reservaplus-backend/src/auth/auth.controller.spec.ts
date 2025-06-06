import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UserContext } from './strategies/jwt.strategy';

const mockAuthService = {
  getAuth0LoginUrl: jest.fn(),
  getProfile: jest.fn(),
  switchOrganization: jest.fn(),
  refreshToken: jest.fn(),
  logout: jest.fn(),
};

const mockUserContext: UserContext = {
  id: 'user-123',
  auth0UserId: 'auth0|test123',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  organizationId: 'org-123',
  role: 'admin',
  isActive: true,
};

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getLoginUrl', () => {
    it('should return login URL', async () => {
      const mockResult = {
        loginUrl: 'https://test-domain.auth0.com/authorize?...',
      };

      mockAuthService.getAuth0LoginUrl.mockResolvedValue(mockResult);

      const result = await controller.getLoginUrl();

      expect(result).toMatchObject({
        success: true,
        data: mockResult,
        timestamp: expect.any(String),
        requestId: expect.any(String),
      });

      expect(mockAuthService.getAuth0LoginUrl).toHaveBeenCalledWith(undefined);
    });

    it('should pass returnTo parameter', async () => {
      const returnTo = 'http://localhost:4200/dashboard';
      const mockResult = {
        loginUrl: 'https://test-domain.auth0.com/authorize?...',
      };

      mockAuthService.getAuth0LoginUrl.mockResolvedValue(mockResult);

      const result = await controller.getLoginUrl(returnTo);

      expect(result.success).toBe(true);
      expect(mockAuthService.getAuth0LoginUrl).toHaveBeenCalledWith(returnTo);
    });
  });

  describe('handleCallback', () => {
    it('should handle callback with code', async () => {
      const code = 'test-auth-code';
      const state = 'test-state';

      const result = await controller.handleCallback(code, state);

      expect(result).toMatchObject({
        success: true,
        message: expect.stringContaining('Auth0 callback'),
        timestamp: expect.any(String),
      });
    });

    it('should handle callback without state', async () => {
      const code = 'test-auth-code';

      const result = await controller.handleCallback(code);

      expect(result.success).toBe(true);
    });
  });

  describe('getProfile', () => {
    it('should return user profile', async () => {
      const mockProfile = {
        id: 'user-123',
        email: 'test@example.com',
        fullName: 'Test User',
        organizations: [],
      };

      mockAuthService.getProfile.mockResolvedValue(mockProfile);

      const result = await controller.getProfile(mockUserContext);

      expect(result).toMatchObject({
        success: true,
        data: mockProfile,
        timestamp: expect.any(String),
        requestId: expect.any(String),
      });

      expect(mockAuthService.getProfile).toHaveBeenCalledWith(mockUserContext);
    });
  });

  describe('switchOrganization', () => {
    it('should switch organization successfully', async () => {
      const switchDto = {
        organizationId: 'org-new-123',
      };

      const mockResult = {
        accessToken: 'new-token',
        expiresIn: 3600,
      };

      mockAuthService.switchOrganization.mockResolvedValue(mockResult);

      const result = await controller.switchOrganization(mockUserContext, switchDto);

      expect(result).toMatchObject({
        success: true,
        data: mockResult,
        message: 'Organization switched successfully',
        timestamp: expect.any(String),
        requestId: expect.any(String),
      });

      expect(mockAuthService.switchOrganization).toHaveBeenCalledWith(mockUserContext, switchDto);
    });
  });

  describe('refreshToken', () => {
    it('should refresh token successfully', async () => {
      const refreshDto = {
        refreshToken: 'valid-refresh-token',
      };

      const mockResult = {
        accessToken: 'new-access-token',
        expiresIn: 3600,
      };

      mockAuthService.refreshToken.mockResolvedValue(mockResult);

      const result = await controller.refreshToken(refreshDto);

      expect(result).toMatchObject({
        success: true,
        data: mockResult,
        timestamp: expect.any(String),
        requestId: expect.any(String),
      });

      expect(mockAuthService.refreshToken).toHaveBeenCalledWith('valid-refresh-token');
    });
  });

  describe('logout', () => {
    it('should logout successfully', async () => {
      const mockResult = {
        message: 'Logged out successfully',
      };

      mockAuthService.logout.mockResolvedValue(mockResult);

      const result = await controller.logout();

      expect(result).toMatchObject({
        success: true,
        message: 'Logged out successfully',
        timestamp: expect.any(String),
        requestId: expect.any(String),
      });

      expect(mockAuthService.logout).toHaveBeenCalled();
    });
  });

  describe('getCurrentUser', () => {
    it('should return current user info (alias for getProfile)', async () => {
      const mockProfile = {
        id: 'user-123',
        email: 'test@example.com',
        fullName: 'Test User',
        organizations: [],
      };

      mockAuthService.getProfile.mockResolvedValue(mockProfile);

      const result = await controller.getCurrentUser(mockUserContext);

      expect(result).toMatchObject({
        success: true,
        data: mockProfile,
      });

      expect(mockAuthService.getProfile).toHaveBeenCalledWith(mockUserContext);
    });
  });
});

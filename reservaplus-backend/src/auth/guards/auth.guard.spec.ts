import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from './auth.guard';
import { RolesGuard } from './roles.guard';

// Mock ExecutionContext
const createMockExecutionContext = (
  isPublic = false,
  allowWithoutOrganization = false,
  user: any = null,
  requiredRoles: string[] = [],
): ExecutionContext => {
  const mockRequest = {
    user,
  };

  const mockContext = {
    switchToHttp: () => ({
      getRequest: () => mockRequest,
    }),
    getHandler: () => ({}),
    getClass: () => ({}),
  } as ExecutionContext;

  return mockContext;
};

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let reflector: Reflector;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthGuard,
        {
          provide: Reflector,
          useValue: {
            getAllAndOverride: jest.fn(),
          },
        },
      ],
    }).compile();

    guard = module.get<AuthGuard>(AuthGuard);
    reflector = module.get<Reflector>(Reflector);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    it('should return true for public routes', () => {
      const context = createMockExecutionContext(true);

      (reflector.getAllAndOverride as jest.Mock).mockReturnValueOnce(true); // isPublic

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should call super.canActivate for protected routes', () => {
      const context = createMockExecutionContext(false);

      (reflector.getAllAndOverride as jest.Mock).mockReturnValueOnce(false); // isPublic

      // Mock the parent class method
      const mockSuperCanActivate = jest.fn().mockReturnValue(true);
      Object.setPrototypeOf(guard, { canActivate: mockSuperCanActivate });

      const result = guard.canActivate(context);

      expect(mockSuperCanActivate).toHaveBeenCalledWith(context);
    });
  });

  describe('handleRequest', () => {
    it('should throw UnauthorizedException when error occurs', () => {
      const context = createMockExecutionContext();
      const error = new Error('Auth error');

      expect(() => guard.handleRequest(error, null, null, context)).toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when user is null', () => {
      const context = createMockExecutionContext();

      expect(() => guard.handleRequest(null, null, null, context)).toThrow(UnauthorizedException);
    });

    it('should return user when authentication is successful and organization context exists', () => {
      const context = createMockExecutionContext();
      const user = {
        id: 'user-123',
        organizationId: 'org-123',
        role: 'admin',
      };

      (reflector.getAllAndOverride as jest.Mock).mockReturnValueOnce(false); // allowWithoutOrganization

      const result = guard.handleRequest(null, user, null, context);

      expect(result).toEqual(user);
    });

    it('should return user when allowWithoutOrganization is true', () => {
      const context = createMockExecutionContext();
      const user = {
        id: 'user-123',
        // No organizationId
      };

      (reflector.getAllAndOverride as jest.Mock).mockReturnValueOnce(true); // allowWithoutOrganization

      const result = guard.handleRequest(null, user, null, context);

      expect(result).toEqual(user);
    });

    it('should throw UnauthorizedException when user has no organization context and it is required', () => {
      const context = createMockExecutionContext();
      const user = {
        id: 'user-123',
        // No organizationId
      };

      (reflector.getAllAndOverride as jest.Mock).mockReturnValueOnce(false); // allowWithoutOrganization

      expect(() => guard.handleRequest(null, user, null, context)).toThrow(UnauthorizedException);
    });
  });
});

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesGuard,
        {
          provide: Reflector,
          useValue: {
            getAllAndOverride: jest.fn(),
          },
        },
      ],
    }).compile();

    guard = module.get<RolesGuard>(RolesGuard);
    reflector = module.get<Reflector>(Reflector);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    it('should return true when no roles are required', () => {
      const user = { id: 'user-123', role: 'admin' };
      const context = createMockExecutionContext(false, false, user);

      (reflector.getAllAndOverride as jest.Mock).mockReturnValueOnce(undefined); // No required roles

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should return true when user has required role', () => {
      const user = { id: 'user-123', role: 'admin' };
      const context = createMockExecutionContext(false, false, user);

      (reflector.getAllAndOverride as jest.Mock).mockReturnValueOnce(['admin', 'manager']); // Required roles

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should throw ForbiddenException when user role is missing', () => {
      const user = { id: 'user-123' }; // No role
      const context = createMockExecutionContext(false, false, user);

      (reflector.getAllAndOverride as jest.Mock).mockReturnValueOnce(['admin']); // Required roles

      expect(() => guard.canActivate(context)).toThrow('User role not found');
    });

    it('should throw ForbiddenException when user is missing', () => {
      const context = createMockExecutionContext(false, false, null);

      (reflector.getAllAndOverride as jest.Mock).mockReturnValueOnce(['admin']); // Required roles

      expect(() => guard.canActivate(context)).toThrow('User role not found');
    });

    it('should throw ForbiddenException when user does not have required role', () => {
      const user = { id: 'user-123', role: 'staff' };
      const context = createMockExecutionContext(false, false, user);

      (reflector.getAllAndOverride as jest.Mock).mockReturnValueOnce(['admin', 'manager']); // Required roles

      expect(() => guard.canActivate(context)).toThrow(
        'Access denied. Required roles: admin, manager. Current role: staff',
      );
    });

    it('should handle multiple roles correctly', () => {
      const user = { id: 'user-123', role: 'manager' };
      const context = createMockExecutionContext(false, false, user);

      (reflector.getAllAndOverride as jest.Mock).mockReturnValueOnce(['admin', 'manager', 'staff']); // Required roles

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });
  });
});

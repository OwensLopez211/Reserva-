import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException, ConflictException } from '@nestjs/common';

import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { OrganizationUser } from '../organizations/entities/organization-user.entity';
import { JwtPayload } from '../auth/strategies/jwt.strategy';

const mockUser = {
  id: 'user-123',
  auth0UserId: 'auth0|test123',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  organizationUsers: [
    {
      id: 'orguser-123',
      organizationId: 'org-123',
      userId: 'user-123',
      role: 'admin',
      isActive: true,
    },
  ],
};

const mockUserRepository = {
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
};

const mockOrgUserRepository = {
  find: jest.fn(),
  findOne: jest.fn(),
  createQueryBuilder: jest.fn(() => ({
    innerJoin: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    getOne: jest.fn(),
  })),
};

describe('UsersService', () => {
  let service: UsersService;
  let userRepository: Repository<User>;
  let orgUserRepository: Repository<OrganizationUser>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: getRepositoryToken(OrganizationUser),
          useValue: mockOrgUserRepository,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    orgUserRepository = module.get<Repository<OrganizationUser>>(
      getRepositoryToken(OrganizationUser),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findByAuth0Id', () => {
    it('should find user by Auth0 ID', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.findByAuth0Id('auth0|test123');

      expect(result).toEqual(mockUser);
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { auth0UserId: 'auth0|test123' },
        relations: ['organizationUsers', 'organizationUsers.organization'],
      });
    });

    it('should return null if user not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      const result = await service.findByAuth0Id('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('findByEmail', () => {
    it('should find user by email', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.findByEmail('test@example.com');

      expect(result).toEqual(mockUser);
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
        relations: ['organizationUsers', 'organizationUsers.organization'],
      });
    });

    it('should return null if user not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      const result = await service.findByEmail('nonexistent@example.com');

      expect(result).toBeNull();
    });
  });

  describe('findById', () => {
    it('should find user by ID', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.findById('user-123');

      expect(result).toEqual(mockUser);
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        relations: ['organizationUsers', 'organizationUsers.organization'],
      });
    });

    it('should throw NotFoundException if user not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.findById('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('createFromAuth0', () => {
    it('should create user from Auth0 payload', async () => {
      const payload: JwtPayload = {
        sub: 'auth0|new123',
        email: 'new@example.com',
        name: 'New User',
        picture: 'https://example.com/avatar.jpg',
        iss: 'test',
        aud: ['test'],
        iat: 123,
        exp: 456,
        azp: 'test',
        scope: 'test',
      };

      const createdUser = { ...mockUser, auth0UserId: 'auth0|new123', email: 'new@example.com' };

      mockUserRepository.findOne.mockResolvedValue(null); // User doesn't exist
      mockUserRepository.create.mockReturnValue(createdUser);
      mockUserRepository.save.mockResolvedValue(createdUser);

      const result = await service.createFromAuth0(payload);

      expect(result).toEqual(createdUser);
      expect(mockUserRepository.create).toHaveBeenCalledWith({
        auth0UserId: 'auth0|new123',
        email: 'new@example.com',
        firstName: 'New',
        lastName: 'User',
        avatarUrl: 'https://example.com/avatar.jpg',
      });
      expect(result.lastLoginAt).toBeDefined();
    });

    it('should throw ConflictException if user already exists', async () => {
      const payload: JwtPayload = {
        sub: 'auth0|existing123',
        email: 'existing@example.com',
        iss: 'test',
        aud: ['test'],
        iat: 123,
        exp: 456,
        azp: 'test',
        scope: 'test',
      };

      mockUserRepository.findOne.mockResolvedValue(mockUser); // User exists

      await expect(service.createFromAuth0(payload)).rejects.toThrow(ConflictException);
    });
  });

  describe('updateFromAuth0', () => {
    it('should update user from Auth0 payload', async () => {
      const payload: JwtPayload = {
        sub: 'auth0|test123',
        email: 'updated@example.com',
        name: 'Updated User',
        picture: 'https://example.com/new-avatar.jpg',
        iss: 'test',
        aud: ['test'],
        iat: 123,
        exp: 456,
        azp: 'test',
        scope: 'test',
      };

      const updatedUser = {
        ...mockUser,
        email: 'updated@example.com',
        firstName: 'Updated',
        lastName: 'User',
      };

      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockUserRepository.save.mockResolvedValue(updatedUser);

      const result = await service.updateFromAuth0('user-123', payload);

      expect(result.email).toBe('updated@example.com');
      expect(result.firstName).toBe('Updated');
      expect(result.lastName).toBe('User');
      expect(result.lastLoginAt).toBeDefined();
    });
  });

  describe('getUserOrganizationContext', () => {
    it('should get organization context for user', async () => {
      const mockOrgUser = {
        organizationId: 'org-123',
        role: 'admin',
        isActive: true,
      };

      const mockQueryBuilder = {
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(mockOrgUser),
      };

      mockOrgUserRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.getUserOrganizationContext('user-123', 'org-123');

      expect(result).toEqual({
        organizationId: 'org-123',
        role: 'admin',
        isActive: true,
      });
    });

    it('should return null if no organization context found', async () => {
      const mockQueryBuilder = {
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      };

      mockOrgUserRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.getUserOrganizationContext('user-123', 'org-invalid');

      expect(result).toBeNull();
    });
  });

  describe('getUserOrganizations', () => {
    it('should get all organizations for user', async () => {
      const mockOrgUsers = [
        {
          organizationId: 'org-123',
          role: 'admin',
          isActive: true,
        },
        {
          organizationId: 'org-456',
          role: 'manager',
          isActive: true,
        },
      ];

      mockOrgUserRepository.find.mockResolvedValue(mockOrgUsers);

      const result = await service.getUserOrganizations('user-123');

      expect(result).toEqual([
        {
          organizationId: 'org-123',
          role: 'admin',
          isActive: true,
        },
        {
          organizationId: 'org-456',
          role: 'manager',
          isActive: true,
        },
      ]);
    });
  });

  describe('update', () => {
    it('should update user', async () => {
      const updateDto = {
        firstName: 'Updated',
        lastName: 'Name',
        isActive: false,
      };

      const updatedUser = { ...mockUser, ...updateDto };

      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockUserRepository.save.mockResolvedValue(updatedUser);

      const result = await service.update('user-123', updateDto);

      expect(result.firstName).toBe('Updated');
      expect(result.lastName).toBe('Name');
      expect(result.isActive).toBe(false);
    });
  });

  describe('findByOrganization', () => {
    it('should find users by organization with pagination', async () => {
      const mockUsers = [mockUser];
      const mockTotal = 1;

      const mockQueryBuilder = {
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([mockUsers, mockTotal]),
      };

      mockUserRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.findByOrganization('org-123', 1, 10);

      expect(result).toEqual({
        users: mockUsers,
        total: mockTotal,
      });
    });
  });

  describe('utility methods', () => {
    it('should extract first name correctly', async () => {
      const payload: JwtPayload = {
        sub: 'auth0|test',
        email: 'test@example.com',
        name: 'John Doe Smith',
        iss: 'test',
        aud: ['test'],
        iat: 123,
        exp: 456,
        azp: 'test',
        scope: 'test',
      };

      mockUserRepository.findOne.mockResolvedValue(null);
      mockUserRepository.create.mockReturnValue(mockUser);
      mockUserRepository.save.mockResolvedValue(mockUser);

      await service.createFromAuth0(payload);

      expect(mockUserRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          firstName: 'John',
          lastName: 'Doe Smith',
        }),
      );
    });

    it('should handle single name correctly', async () => {
      const payload: JwtPayload = {
        sub: 'auth0|test',
        email: 'test@example.com',
        name: 'John',
        iss: 'test',
        aud: ['test'],
        iat: 123,
        exp: 456,
        azp: 'test',
        scope: 'test',
      };

      mockUserRepository.findOne.mockResolvedValue(null);
      mockUserRepository.create.mockReturnValue(mockUser);
      mockUserRepository.save.mockResolvedValue(mockUser);

      await service.createFromAuth0(payload);

      expect(mockUserRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          firstName: 'John',
          lastName: undefined,
        }),
      );
    });
  });
});

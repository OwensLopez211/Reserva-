import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { OrganizationUser } from '../organizations/entities/organization-user.entity';
import { CreateUserFromAuth0Dto, UpdateUserDto, UserOrganizationContextDto } from './dto/user.dto';
import { JwtPayload } from '../auth/strategies/jwt.strategy';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(OrganizationUser)
    private organizationUsersRepository: Repository<OrganizationUser>,
  ) {}

  /**
   * Buscar usuario por Auth0 ID
   */
  async findByAuth0Id(auth0UserId: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { auth0UserId },
      relations: ['organizationUsers', 'organizationUsers.organization'],
    });
  }

  /**
   * Buscar usuario por email
   */
  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { email },
      relations: ['organizationUsers', 'organizationUsers.organization'],
    });
  }

  /**
   * Buscar usuario por ID
   */
  async findById(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: ['organizationUsers', 'organizationUsers.organization'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  /**
   * Crear usuario desde Auth0
   */
  async createFromAuth0(payload: JwtPayload): Promise<User> {
    // Verificar que no exista ya
    const existingUser = await this.findByAuth0Id(payload.sub);
    if (existingUser) {
      throw new ConflictException('User already exists');
    }

    const userData: CreateUserFromAuth0Dto = {
      auth0UserId: payload.sub,
      email: payload.email || '',
      firstName: this.extractFirstName(payload.name),
      lastName: this.extractLastName(payload.name),
      avatarUrl: payload.picture,
    };

    const user = this.usersRepository.create(userData);
    user.lastLoginAt = new Date();

    return this.usersRepository.save(user);
  }

  /**
   * Actualizar usuario desde Auth0
   */
  async updateFromAuth0(userId: string, payload: JwtPayload): Promise<User> {
    const user = await this.findById(userId);

    // Actualizar información que puede haber cambiado en Auth0
    user.email = payload.email || user.email;
    user.firstName = this.extractFirstName(payload.name) || user.firstName;
    user.lastName = this.extractLastName(payload.name) || user.lastName;
    user.avatarUrl = payload.picture || user.avatarUrl;
    user.lastLoginAt = new Date();

    return this.usersRepository.save(user);
  }

  /**
   * Obtener contexto de organización del usuario
   */
  async getUserOrganizationContext(
    userId: string,
    preferredOrganizationId?: string,
  ): Promise<UserOrganizationContextDto | null> {
    const queryBuilder = this.organizationUsersRepository
      .createQueryBuilder('ou')
      .innerJoin('ou.organization', 'org')
      .where('ou.userId = :userId', { userId })
      .andWhere('ou.isActive = true')
      .andWhere('org.deletedAt IS NULL');

    // Si se especifica una organización preferida, priorizarla
    if (preferredOrganizationId) {
      queryBuilder.andWhere('ou.organizationId = :orgId', {
        orgId: preferredOrganizationId,
      });
    }

    queryBuilder.orderBy('ou.joinedAt', 'DESC');

    const organizationUser = await queryBuilder.getOne();

    if (!organizationUser) {
      return null;
    }

    return {
      organizationId: organizationUser.organizationId,
      role: organizationUser.role,
      isActive: organizationUser.isActive,
    };
  }

  /**
   * Obtener todas las organizaciones del usuario
   */
  async getUserOrganizations(userId: string): Promise<UserOrganizationContextDto[]> {
    const organizationUsers = await this.organizationUsersRepository.find({
      where: {
        userId,
        isActive: true,
      },
      relations: ['organization'],
      order: { joinedAt: 'DESC' },
    });

    return organizationUsers.map((ou) => ({
      organizationId: ou.organizationId,
      role: ou.role,
      isActive: ou.isActive,
    }));
  }

  /**
   * Actualizar usuario
   */
  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findById(id);

    Object.assign(user, updateUserDto);

    return this.usersRepository.save(user);
  }

  /**
   * Obtener usuarios de una organización
   */
  async findByOrganization(
    organizationId: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<{ users: User[]; total: number }> {
    const [users, total] = await this.usersRepository
      .createQueryBuilder('user')
      .innerJoin('user.organizationUsers', 'ou')
      .where('ou.organizationId = :organizationId', { organizationId })
      .andWhere('ou.isActive = true')
      .andWhere('user.deletedAt IS NULL')
      .orderBy('user.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { users, total };
  }

  /**
   * Métodos auxiliares
   */
  private extractFirstName(fullName?: string): string | undefined {
    if (!fullName) return undefined;
    return fullName.split(' ')[0];
  }

  private extractLastName(fullName?: string): string | undefined {
    if (!fullName) return undefined;
    const parts = fullName.split(' ');
    return parts.length > 1 ? parts.slice(1).join(' ') : undefined;
  }
}

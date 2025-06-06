import { Entity, Column, OneToMany } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from '../../common/entities/base.entity';
import { OrganizationUser } from '../../organizations/entities/organization-user.entity';

@Entity('users')
export class User extends BaseEntity {
  @ApiProperty({
    description: 'ID único del usuario en Auth0',
    example: 'auth0|123abc456def',
  })
  @Column({ name: 'auth0_user_id', unique: true })
  auth0UserId: string;

  @ApiProperty({
    description: 'Email del usuario',
    example: 'juan.perez@clinica.com',
  })
  @Column({ unique: true })
  email: string;

  @ApiProperty({
    description: 'Nombre',
    example: 'Juan',
  })
  @Column({ name: 'first_name', length: 100, nullable: true })
  firstName?: string;

  @ApiProperty({
    description: 'Apellido',
    example: 'Pérez',
  })
  @Column({ name: 'last_name', length: 100, nullable: true })
  lastName?: string;

  @ApiProperty({
    description: 'URL del avatar',
    example: 'https://example.com/avatar.jpg',
    required: false,
  })
  @Column({ name: 'avatar_url', length: 500, nullable: true })
  avatarUrl?: string;

  @ApiProperty({
    description: 'Usuario activo',
    example: true,
  })
  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @ApiProperty({
    description: 'Última fecha de login',
    required: false,
  })
  @Column({ name: 'last_login_at', nullable: true })
  lastLoginAt?: Date;

  // Relaciones
  @OneToMany(() => OrganizationUser, (orgUser) => orgUser.user)
  organizationUsers: OrganizationUser[];
}

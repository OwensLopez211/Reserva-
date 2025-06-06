import { Entity, Column, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from '../../common/entities/base.entity';
import { Organization } from './organization.entity';
import { User } from '../../users/entities/user.entity';

@Entity('organization_users')
@Unique(['organizationId', 'userId'])
export class OrganizationUser extends BaseEntity {
  @ApiProperty({
    description: 'ID de la organización',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @Column({ name: 'organization_id' })
  organizationId: string;

  @ApiProperty({
    description: 'ID del usuario',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @Column({ name: 'user_id' })
  userId: string;

  @ApiProperty({
    description: 'Rol del usuario en la organización',
    example: 'admin',
    enum: ['owner', 'admin', 'manager', 'staff', 'professional', 'receptionist'],
  })
  @Column({ length: 50 })
  role: string;

  @ApiProperty({
    description: 'Usuario activo en la organización',
    example: true,
  })
  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @ApiProperty({
    description: 'ID del usuario que invitó',
    required: false,
  })
  @Column({ name: 'invited_by', nullable: true })
  invitedBy?: string;

  @ApiProperty({
    description: 'Fecha de unión a la organización',
  })
  @Column({ name: 'joined_at', default: () => 'CURRENT_TIMESTAMP' })
  joinedAt: Date;

  // Relaciones
  @ManyToOne(() => Organization, (organization) => organization.organizationUsers, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @ManyToOne(() => User, (user) => user.organizationUsers, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user: User;
}

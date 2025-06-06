import { Entity, Column, OneToMany } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from '../../common/entities/base.entity';
import { OrganizationUser } from './organization-user.entity';

@Entity('organizations')
export class Organization extends BaseEntity {
  @ApiProperty({
    description: 'Nombre de la organización',
    example: 'Clínica Dental Sonrisa',
  })
  @Column({ length: 255 })
  name: string;

  @ApiProperty({
    description: 'Slug único para URLs amigables',
    example: 'clinica-dental-sonrisa',
  })
  @Column({ length: 100, unique: true })
  slug: string;

  @ApiProperty({
    description: 'ID de organización en Auth0 (opcional)',
    example: 'org_123abc456def',
    required: false,
  })
  @Column({ name: 'auth0_organization_id', nullable: true })
  auth0OrganizationId?: string;

  @ApiProperty({
    description: 'Tipo de industria',
    example: 'clinic',
    enum: ['salon', 'clinic', 'fitness', 'spa', 'consulting'],
  })
  @Column({ name: 'industry_type', length: 50 })
  industryType: string;

  @ApiProperty({
    description: 'Email principal de la organización',
    example: 'info@clinica.com',
  })
  @Column({ length: 255 })
  email: string;

  @ApiProperty({
    description: 'Teléfono de contacto',
    example: '+56912345678',
    required: false,
  })
  @Column({ nullable: true })
  phone?: string;

  @ApiProperty({
    description: 'Dirección física',
    example: 'Av. Providencia 123, Santiago',
    required: false,
  })
  @Column({ type: 'text', nullable: true })
  address?: string;

  @ApiProperty({
    description: 'Zona horaria',
    example: 'America/Santiago',
  })
  @Column({ default: 'America/Santiago' })
  timezone: string;

  @ApiProperty({
    description: 'Estado de suscripción',
    example: 'active',
    enum: ['trial', 'active', 'suspended', 'canceled'],
  })
  @Column({ name: 'subscription_status', default: 'trial' })
  subscriptionStatus: string;

  // Relaciones
  @OneToMany(() => OrganizationUser, (orgUser) => orgUser.organization)
  organizationUsers: OrganizationUser[];
}

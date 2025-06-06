import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsString, IsUUID, IsOptional } from 'class-validator';

// DTO para login request
export class LoginDto {
  @ApiProperty({
    description: 'Email del usuario',
    example: 'admin@clinicaejemplo.com',
  })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({
    description: 'Slug de la organización (opcional)',
    example: 'clinica-ejemplo',
  })
  @IsOptional()
  @IsString()
  organizationSlug?: string;
}

// DTO para respuesta de login
export class LoginResponseDto {
  @ApiProperty({
    description: 'Token de acceso JWT',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken: string;

  @ApiProperty({
    description: 'Token de refresh',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  refreshToken: string;

  @ApiProperty({
    description: 'Tiempo de expiración en segundos',
    example: 3600,
  })
  expiresIn: number;

  @ApiProperty({
    description: 'Información del usuario',
  })
  user: UserProfileDto;
}

// DTO para el perfil del usuario
export class UserProfileDto {
  @ApiProperty({ description: 'ID del usuario' })
  id: string;

  @ApiProperty({ description: 'Email del usuario' })
  email: string;

  @ApiProperty({ description: 'Nombre' })
  firstName?: string;

  @ApiProperty({ description: 'Apellido' })
  lastName?: string;

  @ApiProperty({ description: 'Nombre completo' })
  fullName: string;

  @ApiProperty({ description: 'URL del avatar' })
  avatarUrl?: string;

  @ApiProperty({ description: 'Rol en la organización actual' })
  role?: string;

  @ApiProperty({ description: 'Organización actual' })
  organization?: OrganizationDto;

  @ApiProperty({ description: 'Todas las organizaciones del usuario' })
  organizations: OrganizationDto[];

  @ApiProperty({ description: 'Última fecha de login' })
  lastLoginAt?: Date;
}

// DTO para organización
export class OrganizationDto {
  @ApiProperty({ description: 'ID de la organización' })
  id: string;

  @ApiProperty({ description: 'Nombre de la organización' })
  name: string;

  @ApiProperty({ description: 'Slug de la organización' })
  slug: string;

  @ApiProperty({ description: 'Tipo de industria' })
  industryType: string;

  @ApiProperty({ description: 'Rol del usuario en esta organización' })
  role: string;

  @ApiProperty({ description: 'Usuario activo en esta organización' })
  isActive: boolean;
}

// DTO para cambiar de organización
export class SwitchOrganizationDto {
  @ApiProperty({
    description: 'ID de la organización a la que cambiar',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  organizationId: string;
}

// DTO para refresh token
export class RefreshTokenDto {
  @ApiProperty({
    description: 'Token de refresh',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @IsString()
  refreshToken: string;
}

// DTO para respuesta de refresh
export class RefreshResponseDto {
  @ApiProperty({
    description: 'Nuevo token de acceso',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken: string;

  @ApiProperty({
    description: 'Tiempo de expiración en segundos',
    example: 3600,
  })
  expiresIn: number;
}

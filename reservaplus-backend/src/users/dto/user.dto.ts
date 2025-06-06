import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsString, IsBoolean, IsOptional, IsUUID, IsEnum } from 'class-validator';

// DTO para crear usuario desde Auth0
export class CreateUserFromAuth0Dto {
  @ApiProperty({ description: 'Auth0 User ID', example: 'auth0|123abc456def' })
  @IsString()
  auth0UserId: string;

  @ApiProperty({ description: 'Email del usuario', example: 'juan@example.com' })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ description: 'Nombre', example: 'Juan' })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional({ description: 'Apellido', example: 'Pérez' })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiPropertyOptional({ description: 'URL del avatar' })
  @IsOptional()
  @IsString()
  avatarUrl?: string;
}

// DTO para actualizar usuario
export class UpdateUserDto {
  @ApiPropertyOptional({ description: 'Nombre', example: 'Juan' })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional({ description: 'Apellido', example: 'Pérez' })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiPropertyOptional({ description: 'URL del avatar' })
  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @ApiPropertyOptional({ description: 'Usuario activo', example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

// DTO para respuesta de usuario
export class UserResponseDto {
  @ApiProperty({ description: 'ID del usuario' })
  id: string;

  @ApiProperty({ description: 'Email del usuario' })
  email: string;

  @ApiProperty({ description: 'Nombre completo' })
  fullName: string;

  @ApiPropertyOptional({ description: 'Nombre' })
  firstName?: string;

  @ApiPropertyOptional({ description: 'Apellido' })
  lastName?: string;

  @ApiPropertyOptional({ description: 'URL del avatar' })
  avatarUrl?: string;

  @ApiProperty({ description: 'Usuario activo' })
  isActive: boolean;

  @ApiProperty({ description: 'Última fecha de login' })
  lastLoginAt?: Date;

  @ApiProperty({ description: 'Fecha de creación' })
  createdAt: Date;
}

// DTO para contexto de organización
export class UserOrganizationContextDto {
  @ApiProperty({ description: 'ID de la organización' })
  @IsUUID()
  organizationId: string;

  @ApiProperty({
    description: 'Rol del usuario en la organización',
    enum: ['owner', 'admin', 'manager', 'staff', 'professional', 'receptionist'],
  })
  @IsEnum(['owner', 'admin', 'manager', 'staff', 'professional', 'receptionist'])
  role: string;

  @ApiProperty({ description: 'Usuario activo en la organización' })
  @IsBoolean()
  isActive: boolean;
}

import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';

import { UsersService } from './users.service';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser, CurrentOrganization, Roles } from '../auth/decorators/auth.decorators';
import { UserContext } from '../auth/strategies/jwt.strategy';
import { UpdateUserDto, UserResponseDto } from './dto/user.dto';
import { PaginationQueryDto } from '../common/dto/base-response.dto';
import {
  ApiSuccessResponse,
  ApiCommonErrorResponses,
  ApiAuth,
} from '../common/decorators/api-response.decorator';

@ApiTags('Users')
@Controller('users')
@UseGuards(AuthGuard, RolesGuard)
@ApiAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles('owner', 'admin', 'manager')
  @ApiOperation({
    summary: 'Listar usuarios de la organización',
    description: 'Obtiene una lista paginada de usuarios de la organización actual',
  })
  @ApiQuery({ name: 'page', required: false, description: 'Número de página', example: 1 })
  @ApiQuery({ name: 'limit', required: false, description: 'Elementos por página', example: 10 })
  @ApiQuery({ name: 'search', required: false, description: 'Buscar por nombre o email' })
  @ApiResponse({
    status: 200,
    description: 'Lista de usuarios obtenida exitosamente',
    schema: {
      example: {
        success: true,
        data: [
          {
            id: '123e4567-e89b-12d3-a456-426614174000',
            email: 'juan.perez@clinica.com',
            fullName: 'Juan Pérez',
            firstName: 'Juan',
            lastName: 'Pérez',
            isActive: true,
            lastLoginAt: '2024-01-15T10:30:00Z',
            createdAt: '2024-01-01T00:00:00Z',
          },
        ],
        pagination: {
          page: 1,
          limit: 10,
          total: 25,
          totalPages: 3,
          hasNext: true,
          hasPrev: false,
        },
      },
    },
  })
  @ApiCommonErrorResponses()
  async findAll(@CurrentOrganization() organizationId: string, @Query() query: PaginationQueryDto) {
    // Asegurar valores por defecto
    const page = query.page || 1;
    const limit = query.limit || 10;

    const { users, total } = await this.usersService.findByOrganization(
      organizationId,
      page,
      limit,
    );

    const userDtos = users.map((user) => this.mapToUserResponse(user));

    const pagination = {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1,
    };

    return {
      success: true,
      data: userDtos,
      pagination,
      timestamp: new Date().toISOString(),
      requestId: 'req_' + Math.random().toString(36).substr(2, 9),
    };
  }

  @Get('me')
  @ApiOperation({
    summary: 'Obtener perfil del usuario actual',
    description: 'Obtiene la información del usuario autenticado',
  })
  @ApiSuccessResponse(UserResponseDto, 'Perfil del usuario actual')
  @ApiCommonErrorResponses()
  async getCurrentUser(@CurrentUser() user: UserContext) {
    const userData = await this.usersService.findById(user.id);
    const userDto = this.mapToUserResponse(userData);

    return {
      success: true,
      data: userDto,
      timestamp: new Date().toISOString(),
      requestId: 'req_' + Math.random().toString(36).substr(2, 9),
    };
  }

  @Get(':id')
  @Roles('owner', 'admin', 'manager')
  @ApiOperation({
    summary: 'Obtener usuario por ID',
    description: 'Obtiene la información de un usuario específico',
  })
  @ApiParam({ name: 'id', description: 'ID del usuario' })
  @ApiSuccessResponse(UserResponseDto, 'Usuario encontrado')
  @ApiCommonErrorResponses()
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentOrganization() organizationId: string,
  ) {
    const user = await this.usersService.findById(id);

    // Verificar que el usuario pertenece a la organización
    const belongsToOrg = user.organizationUsers.some(
      (ou) => ou.organizationId === organizationId && ou.isActive,
    );

    if (!belongsToOrg) {
      return {
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'Usuario no encontrado en esta organización',
        },
        timestamp: new Date().toISOString(),
      };
    }

    const userDto = this.mapToUserResponse(user);

    return {
      success: true,
      data: userDto,
      timestamp: new Date().toISOString(),
      requestId: 'req_' + Math.random().toString(36).substr(2, 9),
    };
  }

  @Put('me')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Actualizar perfil del usuario actual',
    description: 'Permite al usuario actualizar su propia información',
  })
  @ApiSuccessResponse(UserResponseDto, 'Perfil actualizado exitosamente')
  @ApiCommonErrorResponses()
  async updateCurrentUser(@CurrentUser() user: UserContext, @Body() updateUserDto: UpdateUserDto) {
    // Remover campos que el usuario no puede modificar por sí mismo
    const { isActive, ...allowedUpdates } = updateUserDto;

    const updatedUser = await this.usersService.update(user.id, allowedUpdates);
    const userDto = this.mapToUserResponse(updatedUser);

    return {
      success: true,
      data: userDto,
      message: 'Perfil actualizado exitosamente',
      timestamp: new Date().toISOString(),
      requestId: 'req_' + Math.random().toString(36).substr(2, 9),
    };
  }

  @Put(':id')
  @Roles('owner', 'admin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Actualizar usuario',
    description: 'Permite a administradores actualizar cualquier usuario de la organización',
  })
  @ApiParam({ name: 'id', description: 'ID del usuario' })
  @ApiSuccessResponse(UserResponseDto, 'Usuario actualizado exitosamente')
  @ApiCommonErrorResponses()
  async updateUser(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateUserDto: UpdateUserDto,
    @CurrentOrganization() organizationId: string,
  ) {
    const user = await this.usersService.findById(id);

    // Verificar que el usuario pertenece a la organización
    const belongsToOrg = user.organizationUsers.some(
      (ou) => ou.organizationId === organizationId && ou.isActive,
    );

    if (!belongsToOrg) {
      return {
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'Usuario no encontrado en esta organización',
        },
        timestamp: new Date().toISOString(),
      };
    }

    const updatedUser = await this.usersService.update(id, updateUserDto);
    const userDto = this.mapToUserResponse(updatedUser);

    return {
      success: true,
      data: userDto,
      message: 'Usuario actualizado exitosamente',
      timestamp: new Date().toISOString(),
      requestId: 'req_' + Math.random().toString(36).substr(2, 9),
    };
  }

  @Get(':id/organizations')
  @Roles('owner', 'admin')
  @ApiOperation({
    summary: 'Obtener organizaciones del usuario',
    description: 'Lista todas las organizaciones a las que pertenece un usuario',
  })
  @ApiParam({ name: 'id', description: 'ID del usuario' })
  @ApiResponse({
    status: 200,
    description: 'Organizaciones del usuario',
    schema: {
      example: {
        success: true,
        data: [
          {
            organizationId: '123e4567-e89b-12d3-a456-426614174000',
            role: 'admin',
            isActive: true,
          },
        ],
      },
    },
  })
  @ApiCommonErrorResponses()
  async getUserOrganizations(@Param('id', ParseUUIDPipe) id: string) {
    const organizations = await this.usersService.getUserOrganizations(id);

    return {
      success: true,
      data: organizations,
      timestamp: new Date().toISOString(),
      requestId: 'req_' + Math.random().toString(36).substr(2, 9),
    };
  }

  /**
   * Método auxiliar para mapear User entity a UserResponseDto
   */
  private mapToUserResponse(user: any): UserResponseDto {
    return {
      id: user.id,
      email: user.email,
      fullName: this.getFullName(user.firstName, user.lastName),
      firstName: user.firstName,
      lastName: user.lastName,
      avatarUrl: user.avatarUrl,
      isActive: user.isActive,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
    };
  }

  private getFullName(firstName?: string, lastName?: string): string {
    if (firstName && lastName) {
      return `${firstName} ${lastName}`;
    }
    return firstName || lastName || 'Usuario';
  }
}

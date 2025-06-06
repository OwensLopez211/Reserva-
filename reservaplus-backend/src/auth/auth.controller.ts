import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';

import { AuthService } from './auth.service';
import { AuthGuard } from './guards/auth.guard';
import { Public, CurrentUser, AllowWithoutOrganization } from './decorators/auth.decorators';
import { UserContext } from './strategies/jwt.strategy';
import {
  UserProfileDto,
  SwitchOrganizationDto,
  RefreshTokenDto,
  RefreshResponseDto,
} from './dto/auth.dto';
import {
  ApiSuccessResponse,
  ApiCommonErrorResponses,
  ApiAuth,
} from '../common/decorators/api-response.decorator';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Get('login')
  @ApiOperation({
    summary: 'Obtener URL de login de Auth0',
    description: 'Genera la URL para redirigir al usuario a Auth0 para autenticación',
  })
  @ApiQuery({
    name: 'returnTo',
    required: false,
    description: 'URL de retorno después del login',
  })
  @ApiResponse({
    status: 200,
    description: 'URL de login generada exitosamente',
    schema: {
      example: {
        success: true,
        data: {
          loginUrl: 'https://your-tenant.auth0.com/authorize?response_type=code&client_id=...',
        },
        timestamp: '2024-01-16T10:30:00Z',
        requestId: 'req_123abc456def',
      },
    },
  })
  @ApiCommonErrorResponses()
  async getLoginUrl(@Query('returnTo') returnTo?: string) {
    const result = await this.authService.getAuth0LoginUrl(returnTo);
    return {
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
      requestId: 'req_' + Math.random().toString(36).substr(2, 9),
    };
  }

  @Public()
  @Post('callback')
  @ApiOperation({
    summary: 'Callback de Auth0',
    description: 'Procesa el callback de Auth0 después de la autenticación',
  })
  @ApiResponse({
    status: 200,
    description: 'Autenticación procesada exitosamente',
  })
  @ApiCommonErrorResponses()
  async handleCallback(@Body('code') code: string, @Body('state') state?: string) {
    // TODO: Implementar cuando tengamos Auth0 configurado
    return {
      success: true,
      message: 'Auth0 callback endpoint - to be implemented',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('profile')
  @UseGuards(AuthGuard)
  @AllowWithoutOrganization()
  @ApiAuth()
  @ApiOperation({
    summary: 'Obtener perfil del usuario',
    description: 'Obtiene la información completa del usuario autenticado',
  })
  @ApiSuccessResponse(UserProfileDto, 'Perfil del usuario obtenido exitosamente')
  @ApiCommonErrorResponses()
  async getProfile(@CurrentUser() user: UserContext) {
    const profile = await this.authService.getProfile(user);
    return {
      success: true,
      data: profile,
      timestamp: new Date().toISOString(),
      requestId: 'req_' + Math.random().toString(36).substr(2, 9),
    };
  }

  @Post('switch-organization')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiAuth()
  @ApiOperation({
    summary: 'Cambiar de organización',
    description: 'Cambia el contexto del usuario a otra organización',
  })
  @ApiResponse({
    status: 200,
    description: 'Organización cambiada exitosamente',
    type: RefreshResponseDto,
  })
  @ApiCommonErrorResponses()
  async switchOrganization(
    @CurrentUser() user: UserContext,
    @Body() switchDto: SwitchOrganizationDto,
  ) {
    const result = await this.authService.switchOrganization(user, switchDto);
    return {
      success: true,
      data: result,
      message: 'Organization switched successfully',
      timestamp: new Date().toISOString(),
      requestId: 'req_' + Math.random().toString(36).substr(2, 9),
    };
  }

  @Post('refresh')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Refrescar token de acceso',
    description: 'Genera un nuevo token de acceso usando el refresh token',
  })
  @ApiResponse({
    status: 200,
    description: 'Token refrescado exitosamente',
    type: RefreshResponseDto,
  })
  @ApiCommonErrorResponses()
  async refreshToken(@Body() refreshDto: RefreshTokenDto) {
    const result = await this.authService.refreshToken(refreshDto.refreshToken);
    return {
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
      requestId: 'req_' + Math.random().toString(36).substr(2, 9),
    };
  }

  @Post('logout')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiAuth()
  @ApiOperation({
    summary: 'Cerrar sesión',
    description: 'Cierra la sesión del usuario actual',
  })
  @ApiResponse({
    status: 200,
    description: 'Sesión cerrada exitosamente',
    schema: {
      example: {
        success: true,
        message: 'Logged out successfully',
        timestamp: '2024-01-16T10:30:00Z',
        requestId: 'req_123abc456def',
      },
    },
  })
  @ApiCommonErrorResponses()
  async logout() {
    const result = await this.authService.logout();
    return {
      success: true,
      ...result,
      timestamp: new Date().toISOString(),
      requestId: 'req_' + Math.random().toString(36).substr(2, 9),
    };
  }

  @Get('me')
  @UseGuards(AuthGuard)
  @AllowWithoutOrganization()
  @ApiAuth()
  @ApiOperation({
    summary: 'Información básica del usuario actual',
    description: 'Obtiene información básica del usuario autenticado (alias de /profile)',
  })
  @ApiSuccessResponse(UserProfileDto, 'Información del usuario')
  @ApiCommonErrorResponses()
  async getCurrentUser(@CurrentUser() user: UserContext) {
    // Alias para getProfile - endpoint más corto
    return this.getProfile(user);
  }
}

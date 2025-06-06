// src/test/test.controller.ts
import { Controller, Get, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtService } from '@nestjs/jwt';
import { Public } from '../auth/decorators/auth.decorators';

@ApiTags('Test')
@Controller('test')
export class TestController {
  constructor(private jwtService: JwtService) {}

  @Public()
  @Get()
  @ApiOperation({
    summary: 'Endpoint de prueba',
    description: 'Endpoint simple para verificar que Swagger funciona',
  })
  @ApiResponse({
    status: 200,
    description: 'Respuesta exitosa',
    schema: {
      example: {
        success: true,
        message: 'Test endpoint working!',
        timestamp: '2024-01-16T10:30:00Z',
      },
    },
  })
  getTest() {
    return {
      success: true,
      message: 'Test endpoint working!',
      timestamp: new Date().toISOString(),
    };
  }

  @Public()
  @Get('users')
  @ApiOperation({
    summary: 'Test de usuarios',
    description: 'Endpoint de prueba para usuarios',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de usuarios de prueba',
  })
  getTestUsers() {
    return {
      success: true,
      data: [
        { id: 1, name: 'Usuario 1', email: 'user1@test.com' },
        { id: 2, name: 'Usuario 2', email: 'user2@test.com' },
      ],
      timestamp: new Date().toISOString(),
    };
  }

  @Public()
  @Post('generate-token')
  @ApiOperation({
    summary: 'Generar token JWT para testing',
    description: 'Genera un token JWT válido para pruebas de endpoints protegidos',
  })
  @ApiResponse({
    status: 200,
    description: 'Token generado exitosamente',
    schema: {
      example: {
        success: true,
        data: {
          token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          expiresIn: 3600,
        },
      },
    },
  })
  generateTestToken(@Body() payload: any = {}) {
    const defaultPayload = {
      sub: 'auth0|test123456789',
      email: 'test@example.com',
      organizationId: 'org-123456789',
      role: 'admin',
      name: 'Test User',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
      ...payload,
    };

    const token = this.jwtService.sign(defaultPayload);

    return {
      success: true,
      data: {
        token,
        expiresIn: 3600,
        payload: defaultPayload,
      },
      message: 'Test token generated successfully',
      timestamp: new Date().toISOString(),
    };
  }

  @Public()
  @Post('decode-token')
  @ApiOperation({
    summary: 'Decodificar token JWT',
    description: 'Decodifica un token JWT para verificar su contenido',
  })
  @ApiResponse({
    status: 200,
    description: 'Token decodificado exitosamente',
  })
  decodeToken(@Body('token') token: string) {
    try {
      const decoded = this.jwtService.decode(token);
      return {
        success: true,
        data: {
          payload: decoded,
          isValid: true,
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        error: {
          message: 'Invalid token format',
          details: error.message,
        },
        timestamp: new Date().toISOString(),
      };
    }
  }
}

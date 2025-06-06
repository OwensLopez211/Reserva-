import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AppService } from './app.service';
import { Public } from './auth/decorators/auth.decorators';

@ApiTags('Health')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Public() // Marcar como público
  @Get()
  @ApiOperation({
    summary: 'Health check',
    description: 'Verificar que la API esté funcionando correctamente',
  })
  @ApiResponse({
    status: 200,
    description: 'API funcionando correctamente',
    schema: {
      example: {
        success: true,
        message: 'ReservaPlus API is running!',
        version: '1.0.0',
        timestamp: '2024-01-16T10:30:00Z',
      },
    },
  })
  getHealth(): object {
    return this.appService.getHealth();
  }

  @Public() // Marcar como público
  @Get('status')
  @ApiOperation({
    summary: 'System status',
    description: 'Información detallada del estado del sistema',
  })
  @ApiResponse({
    status: 200,
    description: 'Estado del sistema',
    schema: {
      example: {
        success: true,
        data: {
          uptime: 3600,
          environment: 'development',
          database: 'connected',
          cache: 'connected',
          version: '1.0.0',
        },
        timestamp: '2024-01-16T10:30:00Z',
      },
    },
  })
  getStatus(): object {
    return this.appService.getSystemStatus();
  }
}

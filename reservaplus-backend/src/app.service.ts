import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHealth(): object {
    return {
      success: true,
      message: 'ReservaPlus API is running!',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    };
  }

  getSystemStatus(): object {
    return {
      success: true,
      data: {
        uptime: Math.floor(process.uptime()),
        environment: process.env.NODE_ENV || 'development',
        database: 'connected', // TODO: Add real database health check
        cache: 'connected', // TODO: Add real cache health check
        version: '1.0.0',
        node: process.version,
      },
      timestamp: new Date().toISOString(),
    };
  }
}

// src/routes/routes.controller.ts
import { Controller, Get } from '@nestjs/common';
import { DiscoveryService, MetadataScanner, Reflector } from '@nestjs/core';
import { InstanceWrapper } from '@nestjs/core/injector/instance-wrapper';

@Controller('routes')
export class RoutesController {
  constructor(
    private readonly discoveryService: DiscoveryService,
    private readonly metadataScanner: MetadataScanner,
    private readonly reflector: Reflector,
  ) {}

  @Get()
  getAllRoutes() {
    const controllers = this.discoveryService.getControllers();
    const routes = [];

    controllers.forEach((wrapper: InstanceWrapper) => {
      const { instance } = wrapper;
      const prototype = Object.getPrototypeOf(instance);

      // Get controller path
      const controllerPath = this.reflector.get('path', wrapper.metatype) || '';

      // Get all methods
      const methodNames = this.metadataScanner.getAllMethodNames(prototype);

      methodNames.forEach((methodName) => {
        const method = prototype[methodName];

        // Get HTTP method and path
        const httpMethod = this.reflector.get('method', method) || 'GET';
        const methodPath = this.reflector.get('path', method) || '';

        const fullPath = `/${controllerPath}${methodPath}`.replace(/\/+/g, '/');

        routes.push({
          controller: wrapper.name,
          method: httpMethod,
          path: fullPath,
          handler: methodName,
        });
      });
    });

    return {
      success: true,
      data: routes,
      total: routes.length,
    };
  }
}

import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard as PassportAuthGuard } from '@nestjs/passport';

@Injectable()
export class AuthGuard extends PassportAuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    // Verificar si la ruta es pública
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    // Ejecutar autenticación normal
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    // Verificar si se permite acceso sin organización
    const allowWithoutOrganization = this.reflector.getAllAndOverride<boolean>(
      'allowWithoutOrganization',
      [context.getHandler(), context.getClass()],
    );

    if (err || !user) {
      throw err || new UnauthorizedException('Authentication required');
    }

    // Verificar que el usuario tenga contexto de organización (excepto para rutas especiales)
    if (!allowWithoutOrganization && !user.organizationId) {
      throw new UnauthorizedException('Organization context required');
    }

    return user;
  }
}

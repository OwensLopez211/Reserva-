import { createParamDecorator, ExecutionContext, SetMetadata } from '@nestjs/common';
import { UserContext } from '../strategies/jwt.strategy';

// Decorador para obtener el usuario actual
export const CurrentUser = createParamDecorator(
  (data: keyof UserContext | undefined, ctx: ExecutionContext): UserContext | any => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as UserContext;

    return data ? user[data] : user;
  },
);

// Decorador para obtener la organización actual
export const CurrentOrganization = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as UserContext;

    if (!user.organizationId) {
      throw new Error('User has no organization context');
    }

    return user.organizationId;
  },
);

// Decorador para verificar roles
export const Roles = (...roles: string[]) => SetMetadata('roles', roles);

// Decorador para marcar rutas como públicas (sin autenticación)
export const Public = () => SetMetadata('isPublic', true);

// Decorador para permitir acceso sin organización
export const AllowWithoutOrganization = () => SetMetadata('allowWithoutOrganization', true);

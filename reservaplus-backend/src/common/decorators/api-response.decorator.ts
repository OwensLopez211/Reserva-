import { applyDecorators, Type } from '@nestjs/common';
import {
  ApiResponse,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiInternalServerErrorResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';

// Respuesta exitosa con datos
export const ApiSuccessResponse = <TModel extends Type<any>>(
  model: TModel,
  description?: string,
) => {
  return applyDecorators(
    ApiOkResponse({
      description: description || 'Operación exitosa',
      type: model,
    }),
  );
};

// Respuesta de creación exitosa
export const ApiCreatedResponseCustom = <TModel extends Type<any>>(
  model: TModel,
  description?: string,
) => {
  return applyDecorators(
    ApiCreatedResponse({
      description: description || 'Recurso creado exitosamente',
      type: model,
    }),
  );
};

// Decorador para respuestas de error comunes
export const ApiCommonErrorResponses = () => {
  return applyDecorators(
    ApiBadRequestResponse({
      description: 'Datos de entrada inválidos',
      schema: {
        example: {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Los datos enviados no son válidos',
          },
          timestamp: '2024-01-16T10:30:00Z',
          requestId: 'req_123abc456def',
        },
      },
    }),
    ApiUnauthorizedResponse({
      description: 'Token de autenticación inválido o ausente',
      schema: {
        example: {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Token de acceso requerido',
          },
          timestamp: '2024-01-16T10:30:00Z',
          requestId: 'req_123abc456def',
        },
      },
    }),
    ApiForbiddenResponse({
      description: 'Sin permisos para realizar esta operación',
      schema: {
        example: {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'No tienes permisos para realizar esta acción',
          },
          timestamp: '2024-01-16T10:30:00Z',
          requestId: 'req_123abc456def',
        },
      },
    }),
    ApiInternalServerErrorResponse({
      description: 'Error interno del servidor',
      schema: {
        example: {
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Error interno del servidor',
          },
          timestamp: '2024-01-16T10:30:00Z',
          requestId: 'req_123abc456def',
        },
      },
    }),
  );
};

// Decorador para autenticación
export const ApiAuth = () => {
  return applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiUnauthorizedResponse({
      description: 'Token JWT requerido',
      schema: {
        example: {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Token de acceso requerido',
          },
          timestamp: '2024-01-16T10:30:00Z',
          requestId: 'req_123abc456def',
        },
      },
    }),
  );
};

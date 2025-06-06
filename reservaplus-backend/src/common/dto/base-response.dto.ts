// src/common/dto/base-response.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsInt, Min, Max, IsString } from 'class-validator';

export class BaseResponseDto<T> {
  @ApiProperty({
    description: 'Indica si la operación fue exitosa',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Datos de respuesta',
  })
  data: T;

  @ApiProperty({
    description: 'Mensaje descriptivo de la operación',
    example: 'Operación completada exitosamente',
    required: false,
  })
  message?: string;

  @ApiProperty({
    description: 'Timestamp de la respuesta',
    example: '2024-01-16T10:30:00Z',
  })
  timestamp: string;

  @ApiProperty({
    description: 'ID único de la petición para rastreo',
    example: 'req_123abc456def',
  })
  requestId: string;
}

export class PaginationMetaDto {
  @ApiProperty({
    description: 'Página actual',
    example: 1,
    minimum: 1,
  })
  page: number;

  @ApiProperty({
    description: 'Elementos por página',
    example: 10,
    minimum: 1,
    maximum: 100,
  })
  limit: number;

  @ApiProperty({
    description: 'Total de elementos',
    example: 150,
  })
  total: number;

  @ApiProperty({
    description: 'Total de páginas',
    example: 15,
  })
  totalPages: number;

  @ApiProperty({
    description: 'Indica si hay página siguiente',
    example: true,
  })
  hasNext: boolean;

  @ApiProperty({
    description: 'Indica si hay página anterior',
    example: false,
  })
  hasPrev: boolean;
}

export class PaginatedResponseDto<T> extends BaseResponseDto<T[]> {
  @ApiProperty({
    description: 'Metadatos de paginación',
    type: PaginationMetaDto,
  })
  pagination: PaginationMetaDto;
}

// Query params para paginación
export class PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Número de página',
    example: 1,
    minimum: 1,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Elementos por página',
    example: 10,
    minimum: 1,
    maximum: 100,
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiPropertyOptional({
    description: 'Término de búsqueda',
    example: 'juan',
  })
  @IsOptional()
  @IsString()
  search?: string;
}

import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class ListUsersQueryDto {
  @ApiPropertyOptional({
    description: 'Texto para busca em campos do usuário',
    example: 'Maria Silva',
  })
  @IsOptional()
  @IsString()
  searchValue?: string;

  @ApiPropertyOptional({
    description: 'Campo específico para realizar a busca',
    example: 'name',
    enum: ['name', 'email', 'document', 'phoneNumber'],
  })
  @IsOptional()
  @IsString()
  @IsIn(['name', 'email', 'document', 'phoneNumber'])
  searchField?: string;

  @ApiPropertyOptional({
    description: 'Operador de comparação para busca',
    example: 'contains',
    enum: ['contains', 'startsWith', 'endsWith', 'equals'],
  })
  @IsOptional()
  @IsString()
  @IsIn(['contains', 'startsWith', 'endsWith', 'equals'])
  searchOperator?: string;

  @ApiPropertyOptional({
    description: 'Número máximo de resultados retornados',
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
  limit?: number;

  @ApiPropertyOptional({
    description: 'Número de registros a pular (paginação)',
    example: 0,
    minimum: 0,
    default: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number;

  @ApiPropertyOptional({
    description: 'Campo para ordenação dos resultados',
    example: 'createdAt',
    enum: ['name', 'email', 'createdAt', 'updatedAt'],
  })
  @IsOptional()
  @IsString()
  @IsIn(['name', 'email', 'createdAt', 'updatedAt'])
  sortBy?: string;

  @ApiPropertyOptional({
    description: 'Direção da ordenação',
    example: 'desc',
    enum: ['asc', 'desc'],
    default: 'desc',
  })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortDirection?: 'asc' | 'desc';

  @ApiPropertyOptional({
    description: 'Campo para aplicar filtro adicional',
    example: 'email',
    enum: ['email', 'banned', 'emailVerified', 'role'],
  })
  @IsOptional()
  @IsString()
  @IsIn(['email', 'banned', 'emailVerified', 'role'])
  filterField?: string;

  @ApiPropertyOptional({
    description: 'Valor do filtro a ser aplicado',
    example: 'maria@example.com',
  })
  @IsOptional()
  @IsString()
  filterValue?: string;

  @ApiPropertyOptional({
    description: 'Operador de comparação do filtro',
    example: 'eq',
    enum: ['contains', 'lt', 'eq', 'ne', 'lte', 'gt', 'gte'],
    default: 'eq',
  })
  @IsOptional()
  @IsString()
  @IsIn(['contains', 'lt', 'eq', 'ne', 'lte', 'gt', 'gte'])
  filterOperator?: 'contains' | 'lt' | 'eq' | 'ne' | 'lte' | 'gt' | 'gte';
}

export class CreateUserQueryDto {
  @ApiPropertyOptional({
    description: 'Papel/função do novo usuário no sistema',
    example: 'user',
    enum: ['admin', 'user'],
    default: 'user',
  })
  @IsOptional()
  @IsString()
  @IsIn(['admin', 'user'])
  role?: 'admin' | 'user';
}

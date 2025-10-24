import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ApiResponse<T = any> {
  @ApiProperty({
    description: 'Status da operação',
    enum: ['success', 'error'],
    example: 'success',
  })
  status: 'success' | 'error';

  @ApiProperty({
    description: 'Mensagem descritiva da operação',
    example: 'Operação realizada com sucesso',
  })
  message: string;

  @ApiPropertyOptional({
    description: 'Dados da resposta',
  })
  data?: T;

  constructor(status: 'success' | 'error', message: string, data?: T) {
    this.status = status;
    this.message = message;
    this.data = data;
  }

  /**
   * Cria uma resposta de sucesso
   */
  static success<T>(message: string, data?: T): ApiResponse<T> {
    return new ApiResponse<T>('success', message, data);
  }

  /**
   * Cria uma resposta de erro
   */
  static error<T>(message: string, data?: T): ApiResponse<T> {
    return new ApiResponse<T>('error', message, data);
  }
}

export class ApiListResponse<T = any> {
  @ApiProperty({
    description: 'Status da operação',
    enum: ['success', 'error'],
    example: 'success',
  })
  status: 'success' | 'error';

  @ApiProperty({
    description: 'Mensagem descritiva da operação',
    example: 'Lista recuperada com sucesso',
  })
  message: string;

  @ApiProperty({
    description: 'Quantidade total de registros',
    example: 10,
  })
  count: number;

  @ApiPropertyOptional({
    description: 'Lista de dados',
    type: 'array',
  })
  data?: T[];

  constructor(
    status: 'success' | 'error',
    message: string,
    count: number,
    data?: T[],
  ) {
    this.status = status;
    this.message = message;
    this.count = count;
    this.data = data;
  }

  static success<T>(message: string, data: T[]): ApiListResponse<T> {
    return new ApiListResponse<T>('success', message, data?.length || 0, data);
  }

  static error<T>(message: string): ApiListResponse<T> {
    return new ApiListResponse<T>('error', message, 0, []);
  }
}

export class ErrorDetail {
  @ApiProperty({
    description: 'Campo que contém o erro',
    example: 'email',
  })
  field?: string;

  @ApiProperty({
    description: 'Mensagem de erro específica',
    example: 'E-mail já está em uso',
  })
  message: string;

  @ApiPropertyOptional({
    description: 'Código de erro',
    example: 'EMAIL_ALREADY_EXISTS',
  })
  code?: string;
}

export class ApiErrorResponse {
  @ApiProperty({
    description: 'Status da operação',
    enum: ['error'],
    example: 'error',
  })
  status: 'error';

  @ApiProperty({
    description: 'Mensagem principal do erro',
    example: 'Erro ao processar requisição',
  })
  message: string;

  @ApiProperty({
    description: 'Código de status HTTP',
    example: 400,
  })
  statusCode: number;

  @ApiPropertyOptional({
    description: 'Timestamp do erro',
    example: '2025-10-21T10:30:00.000Z',
  })
  timestamp?: string;

  @ApiPropertyOptional({
    description: 'Caminho da requisição',
    example: '/users/register',
  })
  path?: string;

  @ApiPropertyOptional({
    description: 'Lista de erros detalhados',
    type: [ErrorDetail],
  })
  errors?: ErrorDetail[];

  constructor(
    message: string,
    statusCode: number,
    errors?: ErrorDetail[],
    path?: string,
  ) {
    this.status = 'error';
    this.message = message;
    this.statusCode = statusCode;
    this.timestamp = new Date().toISOString();
    this.path = path;
    this.errors = errors;
  }
}

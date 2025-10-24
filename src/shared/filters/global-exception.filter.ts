import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ApiErrorResponse, ErrorDetail } from '../dto/api-response.dto';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Erro interno do servidor';
    let errors: ErrorDetail[] | undefined;

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'object') {
        const response = exceptionResponse as any;
        message = response.message || exception.message;

        if (Array.isArray(response.message)) {
          message = 'Erro de validação';
          errors = this.formatValidationErrors(response.message);
        }

        if (response.message && typeof response.message === 'string') {
          message = response.message;
        }
      } else {
        message = exceptionResponse as string;
      }
    } else if (this.isBetterAuthError(exception)) {
      const authError = this.handleBetterAuthError(exception as any);
      statusCode = authError.statusCode;
      message = authError.message;
      errors = authError.errors;
    } else if (this.isPrismaError(exception)) {
      const prismaError = this.handlePrismaError(exception as any);
      statusCode = prismaError.statusCode;
      message = prismaError.message;
      errors = prismaError.errors;
    } else if (exception instanceof Error) {
      message = exception.message;
      this.logger.error(
        `Erro não tratado: ${exception.message}`,
        exception.stack,
      );
    }

    const errorResponse = new ApiErrorResponse(
      message,
      statusCode,
      errors,
      request.url,
    );

    this.logger.error(
      `${request.method} ${request.url} - Status: ${statusCode} - ${message}`,
    );

    response.status(statusCode).json(errorResponse);
  }

  private formatValidationErrors(messages: any[]): ErrorDetail[] {
    return messages.map((msg) => {
      if (typeof msg === 'string') {
        return { message: msg };
      }

      if (msg.constraints) {
        const field = msg.property;
        const message = Object.values(msg.constraints)[0] as string;
        return { field, message };
      }

      return { message: String(msg) };
    });
  }

  private isPrismaError(exception: unknown): boolean {
    return (
      exception !== null &&
      typeof exception === 'object' &&
      'code' in exception &&
      'meta' in exception
    );
  }

  private isBetterAuthError(exception: unknown): boolean {
    return (
      exception !== null &&
      typeof exception === 'object' &&
      exception.constructor.name === 'APIError'
    );
  }

  private handleBetterAuthError(exception: any): {
    statusCode: number;
    message: string;
    errors?: ErrorDetail[];
  } {
    const errorMessage = exception.message || 'Erro de autenticação';

    const statusMap: Record<string, number> = {
      Unauthorized: HttpStatus.UNAUTHORIZED,
      'Invalid credentials': HttpStatus.UNAUTHORIZED,
      'User not found': HttpStatus.NOT_FOUND,
      'Email already exists': HttpStatus.CONFLICT,
      'Invalid token': HttpStatus.UNAUTHORIZED,
      Forbidden: HttpStatus.FORBIDDEN,
    };

    let statusCode = HttpStatus.UNAUTHORIZED;
    for (const [key, status] of Object.entries(statusMap)) {
      if (errorMessage.includes(key)) {
        statusCode = status;
        break;
      }
    }

    const messageMap: Record<string, string> = {
      Unauthorized: 'Não autorizado. Faça login para continuar.',
      'Invalid credentials': 'Credenciais inválidas',
      'User not found': 'Usuário não encontrado',
      'Email already exists': 'Email já está em uso',
      'Invalid token': 'Token inválido ou expirado',
      Forbidden: 'Acesso negado',
    };

    let friendlyMessage = errorMessage;
    for (const [key, msg] of Object.entries(messageMap)) {
      if (errorMessage.includes(key)) {
        friendlyMessage = msg;
        break;
      }
    }

    return {
      statusCode,
      message: friendlyMessage,
    };
  }

  private handlePrismaError(exception: any): {
    statusCode: number;
    message: string;
    errors?: ErrorDetail[];
  } {
    const code = exception.code;
    const meta = exception.meta;

    switch (code) {
      case 'P2025':
        return {
          statusCode: HttpStatus.NOT_FOUND,
          message: 'Registro não encontrado',
          errors: [{ message: meta?.cause || 'Registro não encontrado' }],
        };

      case 'P2002':
        const field = meta?.target?.[0] || 'campo';
        return {
          statusCode: HttpStatus.CONFLICT,
          message: 'Violação de unicidade',
          errors: [
            {
              field,
              message: `${field} já está em uso`,
              code: 'UNIQUE_CONSTRAINT_VIOLATION',
            },
          ],
        };

      case 'P2003':
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Referência inválida',
          errors: [
            {
              field: meta?.field_name,
              message: 'O registro referenciado não existe',
              code: 'FOREIGN_KEY_VIOLATION',
            },
          ],
        };

      case 'P2000':
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Valor muito longo',
          errors: [
            {
              field: meta?.column_name,
              message: `Valor muito longo para o campo ${meta?.column_name}`,
            },
          ],
        };

      default:
        this.logger.error(`Erro Prisma não tratado: ${code}`, exception);
        return {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Erro ao processar operação no banco de dados',
          errors: [{ message: exception.message, code }],
        };
    }
  }
}

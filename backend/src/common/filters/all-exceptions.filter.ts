import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: any = 'Internal server error';
    let errors: any = null;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      
      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object') {
        // Handle validation errors and other structured responses
        message = (exceptionResponse as any).message || 'Error';
        errors = (exceptionResponse as any).errors || (exceptionResponse as any).message;
        
        // For validation errors, extract the error details
        if (Array.isArray(errors)) {
          errors = errors;
        } else if (typeof errors === 'string') {
          errors = [errors];
        }
      }
    }

    const errorResponse = {
      success: false,
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message: Array.isArray(message) ? message[0] : message,
      errors: errors,
    };

    // Log error with appropriate level
    if (status >= 500) {
      this.logger.error(
        `${request.method} ${request.url} - ${status}`,
        exception instanceof Error ? exception.stack : JSON.stringify(exception),
      );
    } else if (status >= 400) {
      this.logger.warn(
        `${request.method} ${request.url} - ${status}: ${errorResponse.message}`,
      );
    }

    response.status(status).json(errorResponse);
  }
}


import { ExceptionFilter, Catch, ArgumentsHost, HttpStatus, Inject } from '@nestjs/common';
import { Response } from 'express';
import { DomainException } from '../../domain/shared/exceptions/domain.exception';
import { AppLoggerPort } from '../../application/ports/logger.port';
import { APP_LOGGER_TOKEN } from '../constants/tokens';

@Catch(DomainException)
export class DomainExceptionFilter implements ExceptionFilter {
  constructor(
    @Inject(APP_LOGGER_TOKEN) private readonly logger: AppLoggerPort,
  ) {}

  catch(exception: DomainException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    this.logger.warn(`Domain exception: ${exception.message}`);

    response.status(HttpStatus.UNPROCESSABLE_ENTITY).json({
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      error: 'Unprocessable Entity',
      message: exception.message,
    });
  }
}

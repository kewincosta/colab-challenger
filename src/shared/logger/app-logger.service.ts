import { Injectable, LoggerService as NestLoggerService, Logger } from '@nestjs/common';
import { AppLoggerPort } from '../../application/ports/logger.port';

@Injectable()
export class AppLogger implements NestLoggerService, AppLoggerPort {
  private readonly logger = new Logger('App');

  log(message: string): void {
    this.logger.log(message);
  }

  error(message: string, trace?: string): void {
    this.logger.error(message, trace);
  }

  warn(message: string): void {
    this.logger.warn(message);
  }

  debug(message: string): void {
    this.logger.debug(message);
  }

  verbose(message: string): void {
    this.logger.verbose(message);
  }
}

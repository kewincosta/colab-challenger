/**
 * Global Logger Module — single registration point for APP_LOGGER_TOKEN.
 *
 * Import this module once in AppModule. Because it is @Global(),
 * APP_LOGGER_TOKEN becomes available to every module without re-registration.
 */

import { Module, Global } from '@nestjs/common';
import { AppLogger } from './app-logger.service';
import { APP_LOGGER_TOKEN } from '../constants/tokens';

@Global()
@Module({
  providers: [
    {
      provide: APP_LOGGER_TOKEN,
      useClass: AppLogger,
    },
  ],
  exports: [APP_LOGGER_TOKEN],
})
export class LoggerModule {}

/**
 * AI Module – NestJS module wiring for AI enrichment services.
 *
 * Registers GeminiClient (as AiClientPort), MemoryLruCache (as AiCache),
 * and ClassifyReportUseCase. Requires ConfigModule to be imported at the app root.
 *
 * Usage:
 *   @Module({ imports: [AiModule] })
 *   export class AppModule {}
 */

import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { GeminiClient } from './gemini.client';
import { MemoryLruCache } from './cache/memory-lru.cache';
import { ClassifyReportUseCase } from '../../application/ai/use-cases/classify-report.use-case';
import { AppLogger } from '../../shared/logger/app-logger.service';
import type { AppLoggerPort } from '../../application/ports/logger.port';
import type { AiClientPort } from '../../application/ports/ai-client.port';
import type { AiCache } from '../../application/ports/ai-cache.port';
import type { AiClassificationResult } from '../../application/ai/types';
import {
  APP_LOGGER_TOKEN,
  AI_CLIENT_TOKEN,
  AI_CACHE_TOKEN,
  AI_ENRICHMENT_SERVICE_TOKEN,
} from '../../shared/constants/tokens';

const CACHE_MAX_SIZE = 500;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: APP_LOGGER_TOKEN,
      useClass: AppLogger,
    },
    {
      provide: AI_CLIENT_TOKEN,
      useFactory: (config: ConfigService, logger: AppLoggerPort): AiClientPort =>
        new GeminiClient(config, logger),
      inject: [ConfigService, APP_LOGGER_TOKEN],
    },
    {
      provide: AI_CACHE_TOKEN,
      useFactory: (): AiCache<AiClassificationResult> =>
        new MemoryLruCache<AiClassificationResult>(CACHE_MAX_SIZE, CACHE_TTL_MS),
    },
    {
      provide: AI_ENRICHMENT_SERVICE_TOKEN,
      useFactory: (
        aiClient: AiClientPort,
        cache: AiCache<AiClassificationResult>,
        logger: AppLoggerPort,
      ) => new ClassifyReportUseCase(aiClient, cache, logger),
      inject: [AI_CLIENT_TOKEN, AI_CACHE_TOKEN, APP_LOGGER_TOKEN],
    },
  ],
  exports: [AI_ENRICHMENT_SERVICE_TOKEN],
})
export class AiModule {}

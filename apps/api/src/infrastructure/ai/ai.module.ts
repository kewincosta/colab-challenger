/**
 * AI Module – NestJS module wiring for AI classification services.
 *
 * Registers GeminiClient (as AiClientPort), RedisCacheAdapter (as AiCache),
 * and ClassifyReportUseCase. Requires ConfigModule to be imported at the app root.
 *
 * Usage:
 *   @Module({ imports: [AiModule] })
 *   export class AppModule {}
 */

import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

import { GeminiClient } from './gemini.client';
import { RedisCacheAdapter } from './cache/redis.cache';
import { ClassifyReportUseCase } from '../../application/ai/use-cases/classify-report.use-case';
import type { AppLoggerPort } from '../../application/ports/logger.port';
import type { AiClientPort } from '../../application/ports/ai-client.port';
import type { AiCache } from '../../application/ports/ai-cache.port';
import type { AiClassificationResult } from '../../application/ai/types';
import type { EnvConfig } from '../../shared/config/env.validation';
import {
  APP_LOGGER_TOKEN,
  AI_CLIENT_TOKEN,
  AI_CACHE_TOKEN,
  AI_CLASSIFICATION_SERVICE_TOKEN,
} from '../../shared/constants/tokens';

const CACHE_TTL_SECONDS = 24 * 60 * 60; // 24 hours
const CACHE_PREFIX = 'ai-cache:';

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: AI_CLIENT_TOKEN,
      useFactory: (config: ConfigService<EnvConfig, true>, logger: AppLoggerPort): AiClientPort =>
        new GeminiClient(config, logger),
      inject: [ConfigService, APP_LOGGER_TOKEN],
    },
    {
      provide: AI_CACHE_TOKEN,
      useFactory: (config: ConfigService<EnvConfig, true>): AiCache<AiClassificationResult> => {
        const redis = new Redis({
          host: config.get('REDIS_HOST', { infer: true }),
          port: config.get('REDIS_PORT', { infer: true }),
          maxRetriesPerRequest: null, // required by BullMQ compatibility
        });
        return new RedisCacheAdapter<AiClassificationResult>(redis, {
          prefix: CACHE_PREFIX,
          ttlSeconds: CACHE_TTL_SECONDS,
        });
      },
      inject: [ConfigService],
    },
    {
      provide: AI_CLASSIFICATION_SERVICE_TOKEN,
      useFactory: (
        aiClient: AiClientPort,
        cache: AiCache<AiClassificationResult>,
        logger: AppLoggerPort,
      ) => new ClassifyReportUseCase(aiClient, cache, logger),
      inject: [AI_CLIENT_TOKEN, AI_CACHE_TOKEN, APP_LOGGER_TOKEN],
    },
  ],
  exports: [AI_CLASSIFICATION_SERVICE_TOKEN],
})
export class AiModule {}

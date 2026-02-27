import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportsModule } from './presentation/http/reports/reports.module';
import { LoggerModule } from './shared/logger/logger.module';
import { validateEnv, EnvConfig } from './shared/config/env.validation';
import { buildTypeOrmConfig } from './shared/config/typeorm.config';
import { DomainExceptionFilter } from './shared/filters/domain-exception.filter';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<EnvConfig, true>) =>
        buildTypeOrmConfig(config),
    }),
    LoggerModule,
    ReportsModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: DomainExceptionFilter,
    },
  ],
})
export class AppModule {}

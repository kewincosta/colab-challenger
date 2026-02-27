import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportsModule } from './presentation/http/reports/reports.module';
import { validateEnv, EnvConfig } from './shared/config/env.validation';
import { buildTypeOrmConfig } from './shared/config/typeorm.config';

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
    ReportsModule,
  ],
})
export class AppModule {}

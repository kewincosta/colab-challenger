import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { ReportOrmEntity } from '../../infrastructure/database/typeorm/entities/report.orm-entity';
import type { EnvConfig } from './env.validation';

/**
 * Build TypeORM config from the validated environment.
 * Receives ConfigService so all defaults come from the Zod schema.
 */
export function buildTypeOrmConfig(
  config: ConfigService<EnvConfig, true>,
): TypeOrmModuleOptions {
  return {
    type: 'postgres',
    host: config.get('DB_HOST', { infer: true }),
    port: config.get('DB_PORT', { infer: true }),
    username: config.get('DB_USER', { infer: true }),
    password: config.get('DB_PASSWORD', { infer: true }),
    database: config.get('DB_NAME', { infer: true }),
    entities: [ReportOrmEntity],
    synchronize: config.get('NODE_ENV', { infer: true }) !== 'production',
  };
}

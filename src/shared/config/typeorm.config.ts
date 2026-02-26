import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ReportOrmEntity } from '../../infrastructure/database/typeorm/entities/report.orm-entity';

export const ormConfig: TypeOrmModuleOptions = {
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 5432,
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'urban_triage',
  entities: [ReportOrmEntity],
  synchronize: true,
};

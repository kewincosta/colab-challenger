import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportsModule } from './presentation/http/reports/reports.module';
import { ormConfig } from './shared/config/typeorm.config';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: () => ormConfig,
    }),
    ReportsModule,
  ],
})
export class AppModule {}

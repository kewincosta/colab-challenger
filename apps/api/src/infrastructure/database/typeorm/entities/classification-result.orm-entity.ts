import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ReportOrmEntity } from './report.orm-entity';

@Entity({ name: 'classification_results' })
export class ClassificationResultOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'report_id', type: 'uuid', unique: true })
  reportId!: string;

  @OneToOne(() => ReportOrmEntity)
  @JoinColumn({ name: 'report_id' })
  report!: ReportOrmEntity;

  @Column({ type: 'varchar', length: 50 })
  category!: string;

  @Column({ type: 'varchar', length: 50 })
  priority!: string;

  @Column({ name: 'technical_summary', type: 'text' })
  technicalSummary!: string;

  @Column({ name: 'triage_status', type: 'varchar', length: 20, default: 'PENDING' })
  triageStatus!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}

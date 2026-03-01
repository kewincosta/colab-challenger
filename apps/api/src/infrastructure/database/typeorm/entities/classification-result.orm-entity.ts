import {
  Column,
  CreateDateColumn,
  Entity,
  Generated,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ReportOrmEntity } from './report.orm-entity';

@Entity({ name: 'classification_results' })
export class ClassificationResultOrmEntity {
  @PrimaryGeneratedColumn('increment')
  id!: number;

  @Column({ name: 'external_id', type: 'uuid', unique: true })
  @Generated('uuid')
  externalId!: string;

  @Column({ name: 'report_external_id', type: 'uuid', unique: true })
  reportExternalId!: string;

  @OneToOne(() => ReportOrmEntity)
  @JoinColumn({ name: 'report_external_id', referencedColumnName: 'externalId' })
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

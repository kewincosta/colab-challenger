import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'reports' })
export class ReportOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255 })
  title!: string;

  @Column({ type: 'text' })
  description!: string;

  @Column({ type: 'jsonb' })
  location!: string | Record<string, unknown>;

  @Column({ type: 'varchar', length: 50, nullable: true })
  category!: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  priority!: string | null;

  @Column({ name: 'technical_summary', type: 'text', nullable: true })
  technicalSummary!: string | null;

  @Column({ name: 'classification_status', type: 'varchar', length: 20, default: 'PENDING' })
  classificationStatus!: string;

  @Column({ name: 'classification_attempts', type: 'int', default: 0 })
  classificationAttempts!: number;

  @Column({ name: 'last_classification_error', type: 'text', nullable: true })
  lastClassificationError!: string | null;

  @Column({ name: 'classified_at', type: 'timestamp', nullable: true })
  classifiedAt!: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}

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

  @Column({ name: 'classification_status', type: 'varchar', length: 20, default: 'PENDING' })
  classificationStatus!: string;

  @Column({ name: 'classification_attempts', type: 'int', default: 0 })
  classificationAttempts!: number;

  @Column({ name: 'last_classification_error', type: 'text', nullable: true })
  lastClassificationError!: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}

import { Column, CreateDateColumn, Entity, Generated, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'reports' })
export class ReportOrmEntity {
  @PrimaryGeneratedColumn('increment')
  id!: number;

  @Column({ name: 'external_id', type: 'uuid', unique: true })
  @Generated('uuid')
  externalId!: string;

  @Column({ type: 'varchar', length: 255 })
  title!: string;

  @Column({ type: 'text' })
  description!: string;

  @Column({ type: 'jsonb' })
  location!: Record<string, unknown>;

  @Column({ name: 'classification_status', type: 'varchar', length: 20, default: 'PENDING' })
  classificationStatus!: string;

  @Column({ name: 'classification_attempts', type: 'int', default: 0 })
  classificationAttempts!: number;

  @Column({ name: 'last_classification_error', type: 'text', nullable: true })
  lastClassificationError!: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}

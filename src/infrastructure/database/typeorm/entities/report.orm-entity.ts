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

  @Column({ name: 'new_category_suggestion', type: 'varchar', length: 255, nullable: true })
  newCategorySuggestion!: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}

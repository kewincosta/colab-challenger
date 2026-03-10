import { ApiProperty } from '@nestjs/swagger';
import type { StructuredLocation } from '../../../domain/reports/value-objects/location.value-object';
import { StructuredLocationDto } from './create-report.dto';

/**
 * Swagger documentation class for report response.
 * Read-only DTO — no validation needed (outbound only).
 */

export class ReportResponseDto {
  @ApiProperty({
    description: 'Unique identifier of the report (UUID v4)',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    format: 'uuid',
  })
  id!: string;

  @ApiProperty({
    description: 'Timestamp when the report was created (ISO 8601)',
    example: '2026-01-15T10:30:00.000Z',
    format: 'date-time',
  })
  createdAt!: Date;

  @ApiProperty({
    description: 'Short title summarizing the urban issue',
    example: 'Buraco na Rua Principal',
    minLength: 1,
    maxLength: 255,
  })
  title!: string;

  @ApiProperty({
    description: 'Detailed description of the issue',
    example: 'Buraco grande próximo ao cruzamento causando congestionamento.',
    minLength: 1,
  })
  description!: string;

  @ApiProperty({
    description: 'Structured address of the issue.',
    type: StructuredLocationDto,
    example: {
      street: 'Praça da Sé',
      number: '123',
      neighborhood: 'Sé',
      city: 'São Paulo',
      state: 'SP',
      postcode: '01001-000',
    },
  })
  location!: StructuredLocation;

  @ApiProperty({
    description:
      'Current status of AI classification.\n\n' +
      '- `PENDING`: Report created, waiting to be picked up by the classifier\n' +
      '- `PROCESSING`: AI classification is in progress\n' +
      '- `DONE`: Classification completed successfully\n' +
      '- `FAILED`: Classification failed (will be retried)',
    example: 'PENDING',
    enum: ['PENDING', 'PROCESSING', 'DONE', 'FAILED'],
  })
  classificationStatus!: string;
}

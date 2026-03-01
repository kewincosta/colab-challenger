import { ApiProperty } from '@nestjs/swagger';
import type { StructuredLocation } from '../../../domain/reports/value-objects/location.value-object';
import { StructuredLocationDto } from './create-report.dto';

export class ReportResponseDto {
  @ApiProperty({
    description: 'Unique identifier of the report',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  id!: string;

  @ApiProperty({
    description: 'Timestamp when the report was created',
    example: '2026-01-15T10:30:00.000Z',
  })
  createdAt!: Date;

  @ApiProperty({
    description: 'Short title summarizing the urban issue',
    example: 'Pothole on Main Street',
  })
  title!: string;

  @ApiProperty({
    description: 'Detailed description of the issue',
    example: 'Large pothole near the intersection causing traffic delays.',
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
    description: 'Current status of AI classification',
    example: 'PENDING',
    enum: ['PENDING', 'PROCESSING', 'DONE', 'FAILED'],
  })
  classificationStatus!: string;
}

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

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
    description: 'Location of the issue, either a human-readable string or a structured object',
    example: 'Main St & 3rd Ave, Springfield',
    oneOf: [
      { type: 'string' },
      {
        type: 'object',
        example: { latitude: -23.55052, longitude: -46.633308, address: 'Main St & 3rd Ave' },
      },
    ],
  })
  location!: string | Record<string, unknown>;

  @ApiProperty({
    description: 'Current status of AI classification',
    example: 'PENDING',
    enum: ['PENDING', 'PROCESSING', 'DONE', 'FAILED'],
  })
  classificationStatus!: string;

  @ApiPropertyOptional({
    description: 'AI-assigned category for the urban issue',
    example: 'Infraestrutura Urbana',
    nullable: true,
  })
  category!: string | null;

  @ApiPropertyOptional({
    description: 'AI-assigned priority level',
    example: 'Alta',
    nullable: true,
  })
  priority!: string | null;

  @ApiPropertyOptional({
    description: 'AI-generated technical summary of the issue',
    example:
      'Degradação da superfície viária requerendo reparo imediato para prevenir danos veiculares.',
    nullable: true,
  })
  technicalSummary!: string | null;
}

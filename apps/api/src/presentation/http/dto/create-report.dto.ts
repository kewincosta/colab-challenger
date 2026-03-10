import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { CreateReportInput, StructuredLocationInput } from './create-report.schema';

/**
 * Swagger documentation class for structured location.
 *
 * Validation is handled by the Zod schema (create-report.schema.ts).
 * This class exists solely for OpenAPI spec generation via @nestjs/swagger.
 */
export class StructuredLocationDto implements StructuredLocationInput {
  @ApiProperty({
    description: 'Street or avenue name',
    example: 'Praça da Sé',
    minLength: 1,
  })
  street!: string;

  @ApiPropertyOptional({
    description: 'Street number (optional — some locations have no number)',
    example: '123',
    nullable: true,
  })
  number?: string;

  @ApiPropertyOptional({
    description: 'Address complement (apartment, block, etc.)',
    example: 'Bloco B',
    nullable: true,
  })
  complement?: string;

  @ApiProperty({
    description: 'Neighborhood / district name',
    example: 'Sé',
    minLength: 1,
  })
  neighborhood!: string;

  @ApiProperty({
    description: 'City name',
    example: 'São Paulo',
    minLength: 1,
  })
  city!: string;

  @ApiProperty({
    description: 'State abbreviation (2 uppercase letters)',
    example: 'SP',
    minLength: 2,
    maxLength: 2,
    pattern: '^[A-Z]{2}$',
  })
  state!: string;

  @ApiProperty({
    description: 'Postal code in Brazilian format (XXXXX-XXX or XXXXXXXX)',
    example: '01001-000',
    pattern: '^\\d{5}-?\\d{3}$',
  })
  postcode!: string;
}

/**
 * Swagger documentation class for report creation.
 *
 * Validation is handled by the Zod schema (create-report.schema.ts).
 * This class exists solely for OpenAPI spec generation via @nestjs/swagger.
 */
export class CreateReportDto implements CreateReportInput {
  @ApiProperty({
    description: 'Short title summarizing the urban issue',
    example: 'Buraco na Rua Principal',
    minLength: 1,
    maxLength: 255,
  })
  title!: string;

  @ApiProperty({
    description:
      'Detailed description of the issue. Provide as much context as possible to help AI classification.',
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
  location!: StructuredLocationDto;
}

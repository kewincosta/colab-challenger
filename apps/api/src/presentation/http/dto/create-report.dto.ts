import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

/** Structured address — the only accepted location format. */
export class StructuredLocationDto {
  @ApiProperty({
    description: 'Street or avenue name',
    example: 'Praça da Sé',
    minLength: 1,
  })
  @IsString()
  @IsNotEmpty()
  street!: string;

  @ApiProperty({
    description: 'Street number',
    example: '123',
    minLength: 1,
  })
  @IsString()
  @IsNotEmpty()
  number!: string;

  @ApiPropertyOptional({
    description: 'Address complement (apartment, block, etc.)',
    example: 'Bloco B',
    nullable: true,
  })
  @IsString()
  @IsOptional()
  complement?: string;

  @ApiProperty({
    description: 'Neighborhood / district name',
    example: 'Sé',
    minLength: 1,
  })
  @IsString()
  @IsNotEmpty()
  neighborhood!: string;

  @ApiProperty({
    description: 'City name',
    example: 'São Paulo',
    minLength: 1,
  })
  @IsString()
  @IsNotEmpty()
  city!: string;

  @ApiProperty({
    description: 'State abbreviation (2 uppercase letters)',
    example: 'SP',
    minLength: 2,
    maxLength: 2,
    pattern: '^[A-Z]{2}$',
  })
  @IsString()
  @IsNotEmpty()
  state!: string;

  @ApiProperty({
    description: 'Postal code in Brazilian format (XXXXX-XXX or XXXXXXXX)',
    example: '01001-000',
    pattern: '^\\d{5}-?\\d{3}$',
  })
  @IsString()
  @IsNotEmpty()
  postcode!: string;
}

export class CreateReportDto {
  @ApiProperty({
    description: 'Short title summarizing the urban issue',
    example: 'Buraco na Rua Principal',
    minLength: 1,
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiProperty({
    description: 'Detailed description of the issue. Provide as much context as possible to help AI classification.',
    example: 'Buraco grande próximo ao cruzamento causando congestionamento.',
    minLength: 1,
  })
  @IsString()
  @IsNotEmpty()
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
  @ValidateNested()
  @Type(() => StructuredLocationDto)
  location!: StructuredLocationDto;
}

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

/** Structured address — the only accepted location format. */
export class StructuredLocationDto {
  @ApiProperty({ example: 'Praça da Sé' })
  @IsString()
  @IsNotEmpty()
  street!: string;

  @ApiProperty({ example: '123' })
  @IsString()
  @IsNotEmpty()
  number!: string;

  @ApiPropertyOptional({ example: 'Bloco B' })
  @IsString()
  @IsOptional()
  complement?: string;

  @ApiProperty({ example: 'Sé' })
  @IsString()
  @IsNotEmpty()
  neighborhood!: string;

  @ApiProperty({ example: 'São Paulo' })
  @IsString()
  @IsNotEmpty()
  city!: string;

  @ApiProperty({ example: 'SP' })
  @IsString()
  @IsNotEmpty()
  state!: string;

  @ApiProperty({ example: '01001-000' })
  @IsString()
  @IsNotEmpty()
  postcode!: string;
}

export class CreateReportDto {
  @ApiProperty({
    description: 'Short title summarizing the urban issue',
    example: 'Pothole on Main Street',
  })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiProperty({
    description: 'Detailed description of the issue',
    example: 'Large pothole near the intersection causing traffic delays.',
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

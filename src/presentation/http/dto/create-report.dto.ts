import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Validate } from 'class-validator';
import { Type } from 'class-transformer';
import { LocationFormatConstraint } from '../validators/location-format.validator';

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
  @Type(() => Object)
  @Validate(LocationFormatConstraint)
  location!: unknown;
}

import { Body, Controller, HttpCode, HttpStatus, Post, UsePipes } from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiOperation,
  ApiTags,
  ApiBadRequestResponse,
  ApiUnprocessableEntityResponse,
  ApiInternalServerErrorResponse,
  ApiBody,
} from '@nestjs/swagger';
import { CreateReportUseCase } from '../../../application/reports/use-cases/create-report.use-case';
import { CreateReportDto } from '../dto/create-report.dto';
import type { CreateReportInput } from '../dto/create-report.schema';
import { createReportSchema } from '../dto/create-report.schema';
import { ReportResponseDto } from '../dto/report-response.dto';
import { ZodValidationPipe } from '../../../shared/pipes/zod-validation.pipe';

@ApiTags('Reports')
@Controller('reports')
export class ReportsController {
  constructor(private readonly createReportUseCase: CreateReportUseCase) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new citizen report',
    description:
      'Receives a citizen report about an urban issue and queues it for AI classification.\n\n' +
      '**Flow:**\n' +
      '1. The request payload is validated (title, description, and structured location are required)\n' +
      '2. A new report entity is created and persisted in the database\n' +
      '3. The report is enqueued for asynchronous AI classification\n' +
      '4. The API returns the created report with `classificationStatus: PENDING`\n\n' +
      '**Validations Applied:**\n' +
      '- `title`: non-empty string (400 if missing)\n' +
      '- `description`: non-empty string (400 if missing)\n' +
      '- `location`: must be a valid structured address with street, neighborhood, city, state, and postcode (400 if invalid)\n' +
      '- `location.number`: optional string\n' +
      '- `location.complement`: optional string\n' +
      '- Unknown/extra fields are rejected (`forbidNonWhitelisted`)\n\n' +
      '**Example Usage:**\n' +
      '```\n' +
      'POST /api/reports\n' +
      'Content-Type: application/json\n\n' +
      '{\n' +
      '  "title": "Buraco na Rua Principal",\n' +
      '  "description": "Buraco grande próximo ao cruzamento causando congestionamento.",\n' +
      '  "location": {\n' +
      '    "street": "Praça da Sé",\n' +
      '    "number": "123",\n' +
      '    "neighborhood": "Sé",\n' +
      '    "city": "São Paulo",\n' +
      '    "state": "SP",\n' +
      '    "postcode": "01001-000"\n' +
      '  }\n' +
      '}\n' +
      '```',
  })
  @ApiCreatedResponse({
    description: 'The report has been successfully created and queued for AI classification.',
    type: ReportResponseDto,
  })
  @ApiBadRequestResponse({
    description:
      'Invalid request payload.\n\n' +
      '**Possible causes:**\n' +
      '- Required field missing (`title`, `description`, or `location`)\n' +
      '- Field with wrong type (e.g., number instead of string)\n' +
      '- Unknown/extra fields in the body\n' +
      '- Invalid nested location object (missing street, neighborhood, city, state, or postcode)',
    content: {
      'application/json': {
        examples: {
          missingTitle: {
            summary: 'Missing title',
            value: {
              statusCode: 400,
              message: ['title should not be empty', 'title must be a string'],
              error: 'Bad Request',
            },
          },
          missingLocation: {
            summary: 'Missing location fields',
            value: {
              statusCode: 400,
              message: [
                'location.street should not be empty',
                'location.number should not be empty',
                'location.city should not be empty',
              ],
              error: 'Bad Request',
            },
          },
          extraFields: {
            summary: 'Unknown property',
            value: {
              statusCode: 400,
              message: ['property unknownField should not exist'],
              error: 'Bad Request',
            },
          },
        },
      },
    },
  })
  @ApiUnprocessableEntityResponse({
    description:
      'Domain validation error.\n\n' +
      '**Possible causes:**\n' +
      '- Business rule violation detected during report creation',
    content: {
      'application/json': {
        examples: {
          domainError: {
            summary: 'Domain exception',
            value: {
              statusCode: 422,
              error: 'Unprocessable Entity',
              message: 'Invalid location: could not resolve structured address.',
            },
          },
        },
      },
    },
  })
  @ApiInternalServerErrorResponse({
    description:
      'Internal server error.\n\n' +
      'An unexpected error occurred while processing the request. Try again later.',
    content: {
      'application/json': {
        examples: {
          serverError: {
            summary: 'Unexpected error',
            value: {
              statusCode: 500,
              message: 'Internal server error',
              error: 'Internal Server Error',
            },
          },
        },
      },
    },
  })
  @ApiBody({ type: CreateReportDto })
  @UsePipes(new ZodValidationPipe(createReportSchema))
  async createReport(@Body() body: CreateReportInput): Promise<ReportResponseDto> {
    const result = await this.createReportUseCase.execute({
      title: body.title,
      description: body.description,
      location: body.location as unknown as Record<string, unknown>,
    });

    return {
      id: result.id,
      createdAt: result.createdAt,
      title: result.title,
      description: result.description,
      location: result.location,
      classificationStatus: result.classificationStatus,
    };
  }
}

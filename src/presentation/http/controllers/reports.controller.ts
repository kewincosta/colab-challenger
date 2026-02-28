import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiCreatedResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateReportUseCase } from '../../../application/reports/use-cases/create-report.use-case';
import { CreateReportDto } from '../dto/create-report.dto';
import { ReportResponseDto } from '../dto/report-response.dto';

@ApiTags('Reports')
@Controller('reports')
export class ReportsController {
  constructor(private readonly createReportUseCase: CreateReportUseCase) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new citizen report' })
  @ApiCreatedResponse({
    description: 'The report has been successfully created.',
    type: ReportResponseDto,
  })
  async createReport(@Body() body: CreateReportDto): Promise<ReportResponseDto> {
    const result = await this.createReportUseCase.execute({
      title: body.title,
      description: body.description,
      location: body.location,
    });

    return {
      id: result.id,
      createdAt: result.createdAt,
      title: result.title,
      description: result.description,
      location: result.location,
      classificationStatus: result.classificationStatus,
      category: result.category,
      subcategory: result.subcategory,
      priority: result.priority,
      technicalSummary: result.technicalSummary,
      newCategorySuggestion: result.newCategorySuggestion,
    };
  }
}

import { Controller, Post, Body, BadRequestException } from '@nestjs/common';
import { HrPrepService } from './hr-prep.service';
import { GenerateDto } from './dto/generate.dto';
import { EvaluateDto } from './dto/evaluate.dto';

@Controller('hr-prep')
export class HrPrepController {
  constructor(private hrPrepService: HrPrepService) {}

  @Post('generate')
  async generate(@Body() body: GenerateDto) {
    const { company } = body;
    if (!company) {
      throw new BadRequestException('Company name is required');
    }
    const questions = await this.hrPrepService.generateQuestions(company);
    return { success: true, questions };
  }

  @Post('evaluate')
  async evaluate(@Body() body: EvaluateDto) {
    const { company, answers } = body;
    if (!company || !Array.isArray(answers)) {
      throw new BadRequestException('Company and answers are required');
    }
    const evaluations = await this.hrPrepService.evaluateAnswers(company, answers);
    return { success: true, evaluations };
  }
}

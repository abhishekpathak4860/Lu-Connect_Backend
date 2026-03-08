import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { JobsService } from './jobs.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateJobDto } from './dto/create-job.dto';

@Controller('jobs')
export class JobsController {
  constructor(private jobsService: JobsService) {}

  @Get()
  async getAll() {
    return { jobs: await this.jobsService.findAll() };
  }

  @Get(':id')
  async getOne(@Param('id') id: string) {
    const job = await this.jobsService.findOne(id);
    if (!job) {
      throw new HttpException('Job not found', HttpStatus.NOT_FOUND);
    }
    return { job };
  }

  // only admin/TPC
  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Body() body: CreateJobDto) {
    const job = await this.jobsService.create(body as any);
    return { success: true, job };
  }
}

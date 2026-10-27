
import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  HttpException,
  HttpStatus,
  UseGuards,
  Query,
  DefaultValuePipe,
  ParseIntPipe,
} from "@nestjs/common";
import { JobsService } from "./jobs.service";

import { CreateJobDto } from "./dto/create-job.dto";
import { JwtAuthGuard } from "src/auth/jwt-auth.guard";

@Controller("jobs")
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Get()
  async getAll(
    @Query("page", new DefaultValuePipe(1), ParseIntPipe)
    page: number,
    @Query("limit", new DefaultValuePipe(10), ParseIntPipe)
    limit: number,
  ) {
    return this.jobsService.findAll(page, limit);
  }

  @Get(":id")
  async getOne(@Param("id") id: string) {
    const job = await this.jobsService.findOne(id);

    if (!job) {
      throw new HttpException("Job not found", HttpStatus.NOT_FOUND);
    }

    return { job };
  }

  // Only authenticated users with the appropriate authorization should create jobs.
  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Body() body: CreateJobDto) {
    const job = await this.jobsService.create(body as any);
    return { success: true, job };
  }
}

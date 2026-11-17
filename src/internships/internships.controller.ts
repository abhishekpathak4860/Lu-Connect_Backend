
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
  Patch,
  Delete,
} from '@nestjs/common';

import { InternshipsService } from './internships.service';
import { CreateInternshipDto } from './dto/create-internship.dto';
import { UpdateInternshipDto } from './dto/update-internship.dto';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentStudent } from 'src/student-auth/decorators/current-student.decorator';
import type { User } from '@prisma/client';
import { StudentAuthGuard } from 'src/student-auth/student-auth/student-auth.guard';

@Controller('internships')
export class InternshipsController {
  constructor(private readonly internshipsService: InternshipsService) {}

  // Public internship listing
  @Get()
  async getAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.internshipsService.findAll(page, limit);
  }

  // Logged-in student internship listing
  @UseGuards(StudentAuthGuard)
  @Get('student')
  async getStudentInternships(
    @CurrentStudent() student: User,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.internshipsService.findAllForStudent(
      student.id,
      page,
      limit,
    );
  }

  // Get one internship
  @Get(':id')
  async getOne(@Param('id') id: string) {
    const internship = await this.internshipsService.findOne(id);

    if (!internship) {
      throw new HttpException(
        'Internship not found',
        HttpStatus.NOT_FOUND,
      );
    }

    return { internship };
  }

  // TPC: Create internship
  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Body() body: CreateInternshipDto) {
    const internship = await this.internshipsService.create(body);
    return { success: true, internship };
  }

  // TPC: Update internship
  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() body: UpdateInternshipDto,
  ) {
    const internship = await this.internshipsService.update(id, body);
    return { success: true, internship };
  }

  // TPC: Delete internship
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async delete(@Param('id') id: string) {
    await this.internshipsService.delete(id);

    return {
      success: true,
      message: 'Internship deleted successfully',
    };
  }
}

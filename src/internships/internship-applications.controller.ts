
import {
  BadRequestException,
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  HttpException,
  HttpStatus,
  Param,
  ParseEnumPipe,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { createClient } from '@supabase/supabase-js';
import { Request } from 'express';
import type { Express } from 'express';
import ws from 'ws';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { StudentAuthGuard } from 'src/student-auth/student-auth/student-auth.guard';
import { InternshipApplicationsService } from './internship-applications.service';
import { UpdateInternshipApplicationStatusDto } from './dto/update-internship-application-status.dto';
import { ApplicationStatus } from '@prisma/client';

@Controller('internships/applications')
export class InternshipApplicationsController {
  private readonly supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      realtime: {
        transport: ws,
      },
    },
  );

  constructor(
    private readonly internshipApplicationsService: InternshipApplicationsService,
  ) {}

  // Student: submit internship application
  @Post()
  @UseGuards(StudentAuthGuard)
  @UseInterceptors(FileInterceptor('resume'))
  async submit(
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body()
    body: {
      internshipId: string;
      name: string;
      email: string;
      phone: string;
    },
    @Req() req: Request & { student: { id: string } },
  ) {
    const { internshipId, name, email, phone } = body;

    if (
      !internshipId ||
      !name?.trim() ||
      !email?.trim() ||
      !phone?.trim()
    ) {
      throw new BadRequestException(
        'Internship ID, name, email, and phone are required',
      );
    }

    if (file) {
      if (file.mimetype !== 'application/pdf') {
        throw new BadRequestException('Only PDF resumes are allowed');
      }

      if (file.size > 5 * 1024 * 1024) {
        throw new BadRequestException('Resume must be 5MB or smaller');
      }
    }

    let resumeUrl: string | null = null;
    let uploadedFilePath: string | null = null;

    if (file) {
      const fileName = `${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}.pdf`;

      uploadedFilePath =
        `internship-applications/${req.student.id}/${internshipId}/${fileName}`;

      const { error: uploadError } = await this.supabase.storage
        .from('resumes')
        .upload(uploadedFilePath, file.buffer, {
          contentType: 'application/pdf',
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        console.error('Resume upload failed:', uploadError.message);

        throw new HttpException(
          'Failed to upload resume',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      const { data } = this.supabase.storage
        .from('resumes')
        .getPublicUrl(uploadedFilePath);

      resumeUrl = data.publicUrl;
    } else {
      resumeUrl =
        await this.internshipApplicationsService.getStudentResumeUrl(
          req.student.id,
        );
    }

    if (!resumeUrl) {
      throw new BadRequestException(
        'Please upload a PDF resume before applying.',
      );
    }

    try {
      const application =
        await this.internshipApplicationsService.create({
          internship_id: internshipId,
          user_id: req.student.id,
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          resume_url: resumeUrl,
        });

      return { success: true, application };
    } catch (error) {
      if (uploadedFilePath) {
        await this.supabase.storage
          .from('resumes')
          .remove([uploadedFilePath]);
      }

      throw error;
    }
  }

  // TPC: view all internship applications
  @UseGuards(JwtAuthGuard)
  @Get()
  async getAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query(
      'status',
      new ParseEnumPipe(ApplicationStatus, { optional: true }),
    )
    status?: ApplicationStatus,
  ) {
    return this.internshipApplicationsService.findAllWithInternship(
      page,
      limit,
      status,
    );
  }

  // TPC: update application status
  @UseGuards(JwtAuthGuard)
  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateInternshipApplicationStatusDto,
  ) {
    return this.internshipApplicationsService.updateStatus(
      id,
      dto.status,
    );
  }

  // Student: view own internship applications
  @UseGuards(StudentAuthGuard)
  @Get('me')
  async getMyApplications(
    @Req() req: Request & { student: { id: string } },
    @Query('page') pageParam = '1',
    @Query('limit') limitParam = '10',
  ) {
    const page = Number(pageParam);
    const limit = Number(limitParam);

    if (
      !Number.isInteger(page) ||
      page < 1 ||
      !Number.isInteger(limit) ||
      limit < 1 ||
      limit > 20
    ) {
      throw new BadRequestException(
        'Page must be positive and limit must be between 1 and 20',
      );
    }

    return this.internshipApplicationsService.findMyApplications(
      req.student.id,
      page,
      limit,
    );
  }
}

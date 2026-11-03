import {
  BadRequestException,
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  HttpException,
  HttpStatus,
  Param,
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
import { ApplicationsService } from './applications.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { StudentAuthGuard } from 'src/student-auth/student-auth/student-auth.guard';
import ws from 'ws';
import { UpdateApplicationStatusDto } from './dto/update-application-status.dto';
import { ApplicationStatus } from "@prisma/client";
import { ParseEnumPipe } from "@nestjs/common";
import { AiResumeAnalyzerService } from './ai-resume-analyzer.service';

@Controller('applications')
export class ApplicationsController {
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
    private readonly applicationsService: ApplicationsService,
     private readonly aiResumeAnalyzerService: AiResumeAnalyzerService,
  ) {}

  @Post()
  @UseGuards(StudentAuthGuard)
  @UseInterceptors(FileInterceptor('resume'))
  async submit(
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body()
    body: {
      jobId: string;
      name: string;
      email: string;
      phone: string;
      compatibilityScore?: string;
      matchingSkills?: string;
      missingSkills?: string;
    },
    @Req() req: Request & { student: { id: string } },
  ) {
    const { jobId, name, email, phone } = body;

    if (!jobId || !name?.trim() || !email?.trim() || !phone?.trim()) {
      throw new BadRequestException(
        'Job ID, name, email, and phone are required',
      );
    }

    // A replacement resume is optional if the student already has one saved.
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
        `applications/${req.student.id}/${jobId}/${fileName}`;

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
      // Never accept a saved resume URL from the client.
      resumeUrl = await this.applicationsService.getStudentResumeUrl(
        req.student.id,
      );
    }

    if (!resumeUrl) {
      throw new BadRequestException(
        'Please upload a PDF resume before applying.',
      );
    }

    let matchingSkills: string[] | undefined;
    let missingSkills: string[] | undefined;
    let compatibilityScore: number | undefined;

    try {
      if (body.compatibilityScore) {
        const score = Number(body.compatibilityScore);

        if (!Number.isInteger(score) || score < 0 || score > 100) {
          throw new BadRequestException('Invalid compatibility score');
        }

        compatibilityScore = score;
      }

      if (body.matchingSkills) {
        matchingSkills = JSON.parse(body.matchingSkills);
        if (!Array.isArray(matchingSkills)) {
          throw new BadRequestException('Invalid matching skills');
        }
      }

      if (body.missingSkills) {
        missingSkills = JSON.parse(body.missingSkills);
        if (!Array.isArray(missingSkills)) {
          throw new BadRequestException('Invalid missing skills');
        }
      }

      const application = await this.applicationsService.create({
        job_id: jobId,
        user_id: req.student.id,
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        resume_url: resumeUrl,
        ...(compatibilityScore !== undefined && {
          compatibility_score: compatibilityScore,
        }),
        ...(matchingSkills !== undefined && {
          matching_skills: matchingSkills,
        }),
        ...(missingSkills !== undefined && {
          missing_skills: missingSkills,
        }),
      });

      return { success: true, application };
    } catch (error) {
      // Remove the newly uploaded file if the database operation fails.
      if (uploadedFilePath) {
        await this.supabase.storage
          .from('resumes')
          .remove([uploadedFilePath]);
      }

      if (error instanceof BadRequestException) {
        throw error;
      }

      throw error;
    }
  }
@UseGuards(JwtAuthGuard)
@Get()
async getAll(
  @Query("page", new DefaultValuePipe(1), ParseIntPipe) page: number,
  @Query("limit", new DefaultValuePipe(10), ParseIntPipe) limit: number,
  @Query(
    "status",
    new ParseEnumPipe(ApplicationStatus, { optional: true }),
  )
  status?: ApplicationStatus,
) {
  return this.applicationsService.findAllWithJob(page, limit, status);
}

@UseGuards(JwtAuthGuard)
@Patch(":id/status")
async updateStatus(
  @Param("id") id: string,
  @Body() dto: UpdateApplicationStatusDto,
) {
  return this.applicationsService.updateStatus(id, dto.status);
}

@UseGuards(JwtAuthGuard)
@Post(':id/analyze-resume')
async analyzeResume(@Param('id') id: string) {
  return this.aiResumeAnalyzerService.analyzeResumeForJob(id);
}
  @Get('me')
@UseGuards(StudentAuthGuard)
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

  return this.applicationsService.findMyApplications(
    req.student.id,
    page,
    limit,
  );
}
}
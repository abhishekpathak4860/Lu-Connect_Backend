import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  Body,
  UseGuards,
  Req,
  InternalServerErrorException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ResumeService } from './resume.service';
import { CheckCompatibilityDto } from './dto/check-compatibility.dto';
import { StudentAuthGuard } from 'src/student-auth/student-auth/student-auth.guard';
import { PrismaService } from 'src/prisma/prisma.service';
import type { Express, Request } from 'express';

type StudentRequest = Request & {
  student: { id: string };
};

@Controller('resume')
export class ResumeController {
  constructor(
    private readonly resumeService: ResumeService,
    private readonly prisma: PrismaService,
  ) {}

  // Public endpoint for landing page resume analysis
  @Post('analyze')
  @UseInterceptors(FileInterceptor('resume'))
  async analyze(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No resume file provided');
    }

    if (file.mimetype !== 'application/pdf') {
      throw new BadRequestException('Only PDF resumes are allowed');
    }

    if (file.size > 5 * 1024 * 1024) {
      throw new BadRequestException('Resume must be 5MB or smaller');
    }

    const result = await this.resumeService.analyze(file.buffer);
    return { success: true, analysis: result };
  }

  // Student-authenticated endpoint for job compatibility
  @Post('check-compatibility')
  @UseGuards(StudentAuthGuard)
  @UseInterceptors(FileInterceptor('resume'))
  async compatibility(
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body() body: CheckCompatibilityDto,
    @Req() req: StudentRequest,
  ) {
    let { job } = body;

    if (typeof job === 'string') {
      try {
        job = JSON.parse(job);
      } catch {
        throw new BadRequestException('Invalid job information');
      }
    }

    if (!job || typeof job !== 'object') {
      throw new BadRequestException('Missing or invalid job information');
    }

    let resumeBuffer: Buffer;

    if (file) {
      // Use the newly uploaded resume when provided
      if (file.mimetype !== 'application/pdf') {
        throw new BadRequestException('Only PDF resumes are allowed');
      }

      if (file.size > 5 * 1024 * 1024) {
        throw new BadRequestException('Resume must be 5MB or smaller');
      }

      resumeBuffer = file.buffer;
    } else {
      
      // Otherwise, retrieve the logged-in student's saved resume
      const student = await this.prisma.user.findFirst({
        where: {
          id: req.student.id,
          role: 'STUDENT',
        },
        select: {
          resumeUrl: true,
        },
      });

      if (!student?.resumeUrl) {
        throw new BadRequestException(
          'No saved resume found. Please upload a PDF resume first.',
        );
      }

      let resumeUrl: URL;
      let supabaseUrl: URL;

      try {
        resumeUrl = new URL(student.resumeUrl);

        if (!process.env.SUPABASE_URL) {
          throw new Error('SUPABASE_URL is not configured');
        }

        supabaseUrl = new URL(process.env.SUPABASE_URL);
      } catch {
        throw new InternalServerErrorException(
          'Unable to validate the saved resume URL',
        );
      }

      // Only allow files stored in your Supabase "resumes" bucket.
      if (
        resumeUrl.origin !== supabaseUrl.origin ||
        !resumeUrl.pathname.startsWith(
          '/storage/v1/object/public/resumes/',
        )
      ) {
        throw new BadRequestException(
          'The saved resume URL is invalid. Please upload your PDF again.',
        );
      }

      try {
        const response = await fetch(resumeUrl.toString(), {
          signal: AbortSignal.timeout(15000),
        });

        if (!response.ok) {
          throw new Error('Resume download failed');
        }

        const contentType = response.headers.get('content-type') || '';
        const contentLength = Number(
          response.headers.get('content-length') || 0,
        );

        if (
          !contentType.toLowerCase().includes('application/pdf') ||
          (contentLength > 0 && contentLength > 5 * 1024 * 1024)
        ) {
          throw new BadRequestException(
            'Saved resume must be a PDF of 5MB or smaller. Please upload it again.',
          );
        }

        const arrayBuffer = await response.arrayBuffer();

        if (arrayBuffer.byteLength > 5 * 1024 * 1024) {
          throw new BadRequestException(
            'Saved resume must be 5MB or smaller.',
          );
        }

        resumeBuffer = Buffer.from(arrayBuffer);
      } catch (error) {
        if (error instanceof BadRequestException) {
          throw error;
        }

        throw new BadRequestException(
          'Unable to access your saved resume. Please upload your PDF again.',
        );
      }
    }

    const result = await this.resumeService.checkCompatibility(
      resumeBuffer,
      job,
    );

    return { success: true, analysis: result };
  }
}
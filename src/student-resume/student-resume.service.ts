
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';
import type { Express } from 'express';
import ws from 'ws';

@Injectable()
export class StudentResumeService {
  private readonly supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      realtime: {
        transport: ws,
      },
    },
  );

  constructor(private readonly prisma: PrismaService) {}

  async getMyResume(studentId: string) {
    const student = await this.prisma.user.findFirst({
      where: {
        id: studentId,
        role: 'STUDENT',
      },
      select: {
        resumeUrl: true,
      },
    });

    if (!student) {
      throw new NotFoundException('Student account not found');
    }

    return { resumeUrl: student.resumeUrl };
  }

  async uploadResume(
    studentId: string,
    file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('Please upload a PDF resume');
    }

    if (
      file.mimetype !== 'application/pdf' ||
      !file.originalname.toLowerCase().endsWith('.pdf'
      )
    ) {
      throw new BadRequestException('Only PDF resumes are allowed');
    }

    if (file.size > 5 * 1024 * 1024) {
      throw new BadRequestException(
        'Resume must be 5MB or smaller',
      );
    }

    const student = await this.prisma.user.findFirst({
      where: {
        id: studentId,
        role: 'STUDENT',
      },
      select: {
        id: true,
      },
    });

    if (!student) {
      throw new NotFoundException('Student account not found');
    }

    const filePath = `${studentId}/${randomUUID()}.pdf`;

    const { error } = await this.supabase.storage
      .from('resumes')
      .upload(filePath, file.buffer, {
        contentType: 'application/pdf',
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      throw new InternalServerErrorException(
        'Failed to upload resume',
      );
    }

    const resumeUrl = this.supabase.storage
      .from('resumes')
      .getPublicUrl(filePath).data.publicUrl;

    try {
      await this.prisma.user.update({
        where: { id: studentId },
        data: { resumeUrl },
      });
    } catch {
      await this.supabase.storage
        .from('resumes')
        .remove([filePath]);

      throw new InternalServerErrorException(
        'Resume uploaded but failed to update student record',
      );
    }

    return {
      success: true,
      message: 'Resume updated successfully',
      resumeUrl,
    };
  }
}

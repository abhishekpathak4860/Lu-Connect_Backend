
import {
  BadRequestException,
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateStudentProfileDto } from './profile-dto/update-student-profile.dto';
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

import ws from 'ws';
@Injectable()
export class StudentProfileService {
  private readonly supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,{
       realtime: {
      transport: ws,
    },
    }
  );

  constructor(private readonly prisma: PrismaService) {}

  async getProfile(studentId: string) {
    const student = await this.prisma.user.findFirst({
      where: {
        id: studentId,
        role: 'STUDENT',
      },
      select: {
        id: true,
        email: true,
        role: true,
        firstName: true,
        middleName: true,
        lastName: true,
        location: true,
        primaryRole: true,
        experienceYears: true,
        openToRoles: true,
        bio: true,
        website: true,
        linkedin: true,
        github: true,
        twitter: true,
        workExperience: true,
        education: true,
        skills: true,
        achievements: true,
        pronouns: true,
        genderIdentity: true,
        resumeUrl: true,
      },
    });

    if (!student) {
      throw new NotFoundException('Student profile not found');
    }

    return student;
  }

  async updateProfile(
    studentId: string,
    dto: UpdateStudentProfileDto,
    file?: Express.Multer.File,
  ) {
    await this.getProfile(studentId);

    let resumeUrl: string | undefined;

    if (file) {
      if (
        file.mimetype !== 'application/pdf' ||
        !file.originalname.toLowerCase().endsWith('.pdf')
      ) {
        throw new BadRequestException(
          'Only PDF resumes are allowed',
        );
      }

      const filePath = `${studentId}/${randomUUID()}.pdf`;

      const { error } = await this.supabase.storage
        .from('resumes')
        .upload(filePath, file.buffer, {
          contentType: 'application/pdf',
          upsert: false,
        });

      if (error) {
        throw new InternalServerErrorException(
          `Resume upload failed: ${error.message}`,
        );
      }

      resumeUrl = this.supabase.storage
        .from('resumes')
        .getPublicUrl(filePath)
        .data.publicUrl;
    }

    const {
      workExperience,
      education,
      ...profileFields
    } = dto;

    return this.prisma.user.update({
      where: { id: studentId },
      data: {
        ...profileFields,
        ...(workExperience !== undefined
          ? {
              workExperience:
                workExperience as Prisma.InputJsonValue,
            }
          : {}),
        ...(education !== undefined
          ? {
              education: education as Prisma.InputJsonValue,
            }
          : {}),
        ...(resumeUrl ? { resumeUrl } : {}),
      },
      select: {
        id: true,
        email: true,
        role: true,
        firstName: true,
        middleName: true,
        lastName: true,
        location: true,
        primaryRole: true,
        experienceYears: true,
        openToRoles: true,
        bio: true,
        website: true,
        linkedin: true,
        github: true,
        twitter: true,
        workExperience: true,
        education: true,
        skills: true,
        achievements: true,
        pronouns: true,
        genderIdentity: true,
        resumeUrl: true,
      },
    });
  }
}

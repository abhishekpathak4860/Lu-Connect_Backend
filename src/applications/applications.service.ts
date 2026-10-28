import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Application } from '@prisma/client';

@Injectable()
export class ApplicationsService {
  constructor(private readonly prisma: PrismaService) {}

  async getStudentResumeUrl(studentId: string): Promise<string | null> {
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

    return student.resumeUrl;
  }

  async create(data: {
    job_id: string;
    user_id: string;
    name: string;
    email: string;
    phone: string;
    resume_url: string;
    compatibility_score?: number;
    matching_skills?: string[];
    missing_skills?: string[];
  }): Promise<Application> {
    return this.prisma.application.create({
      data: data as any,
    });
  }

  async findAllWithJob() {
    return this.prisma.application.findMany({
      orderBy: { created_at: 'desc' },
      include: {
        job: {
          select: {
            id: true,
            role: true,
            company_name: true,
          },
        },
      },
    });
  }

  async findMyApplications(
  studentId: string,
  page: number,
  limit: number,
) {
  const where = { user_id: studentId };

  const [applications, total] = await this.prisma.$transaction([
    this.prisma.application.findMany({
      where,
      orderBy: { created_at: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        created_at: true,
        status: true,
        compatibility_score: true,
        job: {
          select: {
            id: true,
            company_name: true,
            role: true,
            location: true,
            package: true,
          },
        },
      },
    }),
    this.prisma.application.count({ where }),
  ]);

  return {
    applications,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}
}
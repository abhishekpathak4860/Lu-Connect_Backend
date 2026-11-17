
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InternshipEmailService } from './internship-email.service';
import {
  ApplicationStatus,
  InternshipApplication,
} from '@prisma/client';

@Injectable()
export class InternshipApplicationsService {
  constructor(private readonly prisma: PrismaService, 
    private readonly internshipEmailService: InternshipEmailService,) {}

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
    internship_id: string;
    user_id: string;
    name: string;
    email: string;
    phone: string;
    resume_url: string;
  }): Promise<InternshipApplication> {
    return this.prisma.internshipApplication.create({
      data,
    });
  }

  async findAllWithInternship(
    page = 1,
    limit = 10,
    status?: ApplicationStatus,
  ) {
    const currentPage = Math.max(1, page);
    const pageSize = Math.min(Math.max(1, limit), 50);
    const statusFilter = status ? { status } : undefined;

    const [
      applications,
      filteredTotalApplications,
      totalApplications,
      appliedCount,
      underReviewCount,
      shortlistedCount,
      rejectedCount,
    ] = await this.prisma.$transaction([
      this.prisma.internshipApplication.findMany({
        where: statusFilter,
        orderBy: { created_at: 'desc' },
        skip: (currentPage - 1) * pageSize,
        take: pageSize,
        include: {
          internship: {
            select: {
              id: true,
              role: true,
              company_name: true,
              stipend: true,
              location: true,
            },
          },
        },
      }),

      this.prisma.internshipApplication.count({
        where: statusFilter,
      }),
      this.prisma.internshipApplication.count(),
      this.prisma.internshipApplication.count({
        where: { status: ApplicationStatus.APPLIED },
      }),
      this.prisma.internshipApplication.count({
        where: { status: ApplicationStatus.UNDER_REVIEW },
      }),
      this.prisma.internshipApplication.count({
        where: { status: ApplicationStatus.SHORTLISTED },
      }),
      this.prisma.internshipApplication.count({
        where: { status: ApplicationStatus.REJECTED },
      }),
    ]);

    return {
      applications,
      stats: {
        totalApplications,
        appliedCount,
        underReviewCount,
        shortlistedCount,
        rejectedCount,
      },
      pagination: {
        currentPage,
        limit: pageSize,
        totalApplications: filteredTotalApplications,
        totalPages: Math.ceil(filteredTotalApplications / pageSize),
        hasNextPage: currentPage * pageSize < filteredTotalApplications,
        hasPreviousPage: currentPage > 1,
      },
    };
  }

async updateStatus(id: string, status: ApplicationStatus) {
  const existingApplication =
    await this.prisma.internshipApplication.findUnique({
      where: { id },
    });

  if (!existingApplication) {
    throw new NotFoundException('Internship application not found');
  }

  const updatedApplication =
    await this.prisma.internshipApplication.update({
      where: { id },
      data: { status },
    });

  // Send email only when the application is newly shortlisted.
  if (
    status === ApplicationStatus.SHORTLISTED &&
    existingApplication.status !== ApplicationStatus.SHORTLISTED
  ) {
    try {
      await this.internshipEmailService.sendShortlistEmail(id);
    } catch (error) {
      console.error(
        'Failed to send internship shortlist email:',
        error,
      );
    }
  }

  return updatedApplication;
}

  async findMyApplications(
    studentId: string,
    page: number,
    limit: number,
  ) {
    const where = { user_id: studentId };

    const [applications, total] = await this.prisma.$transaction([
      this.prisma.internshipApplication.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          created_at: true,
          status: true,
          internship: {
            select: {
              id: true,
              company_name: true,
              role: true,
              location: true,
              stipend: true,
              duration: true,
              work_mode: true,
            },
          },
        },
      }),
      this.prisma.internshipApplication.count({ where }),
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


import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { Job } from "@prisma/client";

@Injectable()
export class JobsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(page = 1, limit = 10) {
    // Normalize pagination values.
    page = Number.isFinite(page) ? Math.max(1, Math.floor(page)) : 1;
    limit = Number.isFinite(limit)
      ? Math.min(100, Math.max(1, Math.floor(limit)))
      : 10;

    const skip = (page - 1) * limit;

    const [jobs, totalJobs] = await this.prisma.$transaction([
      this.prisma.job.findMany({
        orderBy: { created_at: "desc" },
        skip,
        take: limit,
      }),
      this.prisma.job.count(),
    ]);

    const totalPages = Math.ceil(totalJobs / limit);

    return {
      jobs,
      pagination: {
        currentPage: page,
        limit,
        totalJobs,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  async findOne(id: string): Promise<Job | null> {
    return this.prisma.job.findUnique({
      where: { id },
    });
  }

  async create(data: any): Promise<Job> {
    return this.prisma.job.create({ data });
  }
}

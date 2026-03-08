import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Job } from '@prisma/client';

@Injectable()
export class JobsService {
  constructor(private prisma: PrismaService) {}

  async findAll(): Promise<Job[]> {
    return this.prisma.job.findMany({ orderBy: { created_at: 'desc' } });
  }

  async findOne(id: string): Promise<Job | null> {
    return this.prisma.job.findUnique({ where: { id } });
  }

  async create(data: any): Promise<Job> {
    // 'data' is usually validated via DTO in controller
    return this.prisma.job.create({ data });
  }
}

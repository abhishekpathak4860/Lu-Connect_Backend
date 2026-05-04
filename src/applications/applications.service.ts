import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Application }from '@prisma/client';

@Injectable()
export class ApplicationsService {
  constructor(private prisma: PrismaService) {}

  async create(data: any): Promise<Application> {
    // data fields are validated earlier by controller
    return this.prisma.application.create({ data });
  }

  async findAllWithJob() {
    return this.prisma.application.findMany({
      orderBy: { created_at: 'desc' },
      include: { job: { select: { role: true, company_name: true } } },
    });
  }
}

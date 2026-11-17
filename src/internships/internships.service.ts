
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Internship } from '@prisma/client';
import { CreateInternshipDto } from './dto/create-internship.dto';
import { UpdateInternshipDto } from './dto/update-internship.dto';

@Injectable()
export class InternshipsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(page = 1, limit = 10) {
    page = Number.isFinite(page) ? Math.max(1, Math.floor(page)) : 1;
    limit = Number.isFinite(limit)
      ? Math.min(100, Math.max(1, Math.floor(limit)))
      : 10;

    const skip = (page - 1) * limit;

    const [internships, totalInternships] = await this.prisma.$transaction([
      this.prisma.internship.findMany({
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.internship.count(),
    ]);

    const totalPages = Math.ceil(totalInternships / limit);

    return {
      internships,
      pagination: {
        currentPage: page,
        limit,
        totalInternships,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  async findAllForStudent(studentId: string, page = 1, limit = 10) {
    page = Number.isFinite(page) ? Math.max(1, Math.floor(page)) : 1;
    limit = Number.isFinite(limit)
      ? Math.min(100, Math.max(1, Math.floor(limit)))
      : 10;

    const skip = (page - 1) * limit;

    const [internships, totalInternships] = await this.prisma.$transaction([
      this.prisma.internship.findMany({
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
        include: {
          applications: {
            where: { user_id: studentId },
            select: { id: true },
            take: 1,
          },
        },
      }),
      this.prisma.internship.count(),
    ]);

    const internshipsWithApplicationStatus = internships.map(
      ({ applications, ...internship }) => ({
        ...internship,
        alreadyApplied: applications.length > 0,
      }),
    );

    const totalPages = Math.ceil(totalInternships / limit);

    return {
      internships: internshipsWithApplicationStatus,
      pagination: {
        currentPage: page,
        limit,
        totalInternships,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  async findOne(id: string): Promise<Internship | null> {
    return this.prisma.internship.findUnique({
      where: { id },
    });
  }

  async create(data: CreateInternshipDto): Promise<Internship> {
    return this.prisma.internship.create({ data });
  }

  async update(id: string, data: UpdateInternshipDto) {
    return this.prisma.internship.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    return this.prisma.$transaction(async (tx) => {
      return tx.internship.delete({
        where: { id },
      });
    });
  }
}

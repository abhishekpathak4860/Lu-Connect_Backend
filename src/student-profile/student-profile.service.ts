
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateStudentProfileDto } from './profile-dto/update-student-profile.dto';


@Injectable()
export class StudentProfileService {
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
  ) {
    await this.getProfile(studentId);

    return this.prisma.user.update({
      where: { id: studentId },
      data: dto,
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


import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Patch,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

import { StudentProfileService } from './student-profile.service';
import { CurrentStudent } from '../student-auth/decorators/current-student.decorator';
import { StudentAuthGuard } from 'src/student-auth/student-auth/student-auth.guard';
import { UpdateStudentProfileDto } from './profile-dto/update-student-profile.dto';

@Controller('student-profile')
@UseGuards(StudentAuthGuard)
export class StudentProfileController {
  constructor(
    private readonly studentProfileService: StudentProfileService,
  ) {}

  @Get('me')
  getProfile(@CurrentStudent() student: { id: string }) {
    return this.studentProfileService.getProfile(student.id);
  }

  @Patch('me')
  @UseInterceptors(
    FileInterceptor('resume', {
      storage: memoryStorage(),
      limits: {
        fileSize: 5 * 1024 * 1024,
        files: 1,
      },
    }),
  )
  async updateProfile(
    @CurrentStudent() student: { id: string },
    @Body('profile') profileJson: string,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (!profileJson) {
      throw new BadRequestException('Profile data is required');
    }

    let parsedProfile: unknown;

    try {
      parsedProfile = JSON.parse(profileJson);
    } catch {
      throw new BadRequestException('Invalid profile JSON');
    }

    if (
      typeof parsedProfile !== 'object' ||
      parsedProfile === null ||
      Array.isArray(parsedProfile)
    ) {
      throw new BadRequestException(
        'Profile must be a JSON object',
      );
    }

    const dto = plainToInstance(
      UpdateStudentProfileDto,
      parsedProfile,
    );

    const errors = await validate(dto, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });

    if (errors.length > 0) {
      throw new BadRequestException(
        errors.flatMap((error) =>
          Object.values(error.constraints ?? {}),
        ),
      );
    }

    return this.studentProfileService.updateProfile(
      student.id,
      dto,
      file,
    );
  }
}

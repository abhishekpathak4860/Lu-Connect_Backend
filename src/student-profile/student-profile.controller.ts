
import {
  Controller,
  Get,
  Patch,
  Body,
  UseGuards,
} from '@nestjs/common';
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
  updateProfile(
    @CurrentStudent() student: { id: string },
    @Body() dto: UpdateStudentProfileDto,
  ) {
    return this.studentProfileService.updateProfile(student.id, dto);
  }
}

import { Controller, Get, Headers, Post, UnauthorizedException, UseGuards } from '@nestjs/common';
import { StudentAuthService } from './student-auth.service';
import { CurrentStudent } from './decorators/current-student.decorator';
import { StudentAuthGuard } from './student-auth/student-auth.guard';

@Controller('student-auth')
export class StudentAuthController {
    constructor(private readonly studentAuthService:StudentAuthService){}
  @Post('verify')
  async verifyStudent(@Headers('authorization') authorization?: string) {
    const [type, token] = authorization?.split(' ') ?? [];

    if (type !== 'Bearer' || !token) {
      throw new UnauthorizedException('Bearer token is required');
    }

    return this.studentAuthService.verifyStudentToken(token);
  }

@Get('me')
@UseGuards(StudentAuthGuard)
getMe(@CurrentStudent() student: { id: string; clerkId: string; email: string; role: string }) {
  return student;
}
}

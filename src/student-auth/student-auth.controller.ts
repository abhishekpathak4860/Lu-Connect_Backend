import { Controller, Headers, Post, UnauthorizedException } from '@nestjs/common';
import { StudentAuthService } from './student-auth.service';

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

}

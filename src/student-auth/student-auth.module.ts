import { Module } from '@nestjs/common';
import { StudentAuthController } from './student-auth.controller';
import { StudentAuthService } from './student-auth.service';
import { StudentAuthGuard } from './student-auth/student-auth.guard';

@Module({
  controllers: [StudentAuthController],
  exports: [StudentAuthService, StudentAuthGuard],
  providers: [StudentAuthService,StudentAuthGuard]
})
export class StudentAuthModule {}

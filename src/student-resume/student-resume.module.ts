
import { Module } from '@nestjs/common';
import { StudentResumeController } from './student-resume.controller';
import { StudentResumeService } from './student-resume.service';
import { StudentAuthModule } from 'src/student-auth/student-auth.module';

@Module({
    imports:[StudentAuthModule],
  controllers: [StudentResumeController],
  providers: [StudentResumeService],
})
export class StudentResumeModule {}

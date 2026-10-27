import { Module } from '@nestjs/common';
import { ResumeService } from './resume.service';
import { ResumeController } from './resume.controller';
import { StudentAuthModule } from 'src/student-auth/student-auth.module';

@Module({
  imports:[StudentAuthModule],
  providers: [ResumeService],
  controllers: [ResumeController],
})
export class ResumeModule {}

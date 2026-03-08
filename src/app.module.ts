import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { JobsModule } from './jobs/jobs.module';
import { ApplicationsModule } from './applications/applications.module';
import { ResumeModule } from './resume/resume.module';
import { HrPrepModule } from './hr-prep/hr-prep.module';

@Module({
  imports: [PrismaModule, AuthModule, JobsModule, ApplicationsModule, ResumeModule, HrPrepModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

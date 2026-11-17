import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { JobsModule } from './jobs/jobs.module';
import { ApplicationsModule } from './applications/applications.module';
import { ResumeModule } from './resume/resume.module';
import { HrPrepModule } from './hr-prep/hr-prep.module';
import { StudentAuthModule } from './student-auth/student-auth.module';
import { StudentProfileModule } from './student-profile/student-profile.module';
import { StudentResumeModule } from './student-resume/student-resume.module';
import { ConfigModule } from '@nestjs/config';
import { InternshipsModule } from './internships/internships.module';
@Module({
  imports: [ ConfigModule.forRoot({ isGlobal: true }),PrismaModule, AuthModule,InternshipsModule, JobsModule, ApplicationsModule, ResumeModule, HrPrepModule, StudentAuthModule, StudentProfileModule, StudentResumeModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

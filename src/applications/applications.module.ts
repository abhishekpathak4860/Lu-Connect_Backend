import { Module } from '@nestjs/common';
import { ApplicationsService } from './applications.service';
import { ApplicationsController } from './applications.controller';
// import { UploadController } from './upload.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { StudentAuthModule } from 'src/student-auth/student-auth.module';
import { AiResumeAnalyzerService } from './ai-resume-analyzer.service';

@Module({
  imports: [PrismaModule,StudentAuthModule],
  providers: [ApplicationsService,AiResumeAnalyzerService],
  controllers: [ ApplicationsController],
})
export class ApplicationsModule {}

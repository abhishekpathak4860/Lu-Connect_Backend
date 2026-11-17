import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { StudentAuthModule } from 'src/student-auth/student-auth.module';

import { InternshipsService } from './internships.service';
import { InternshipsController } from './internships.controller';
import { InternshipApplicationsService } from './internship-applications.service';
import { InternshipEmailService } from './internship-email.service';
import { InternshipApplicationsController } from './internship-applications.controller';


@Module({
  imports: [PrismaModule, StudentAuthModule],
  providers: [InternshipsService, InternshipApplicationsService,
    InternshipEmailService],
  controllers: [InternshipApplicationsController,InternshipsController],
})
export class InternshipsModule {}
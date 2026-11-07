import { Module } from '@nestjs/common';
import { JobsService } from './jobs.service';
import { JobsController } from './jobs.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { StudentAuthModule } from 'src/student-auth/student-auth.module';

@Module({
  imports: [PrismaModule,StudentAuthModule],
  providers: [JobsService],
  controllers: [JobsController],
})
export class JobsModule {}

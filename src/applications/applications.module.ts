import { Module } from '@nestjs/common';
import { ApplicationsService } from './applications.service';
import { ApplicationsController } from './applications.controller';
// import { UploadController } from './upload.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { StudentAuthModule } from 'src/student-auth/student-auth.module';

@Module({
  imports: [PrismaModule,StudentAuthModule],
  providers: [ApplicationsService],
  controllers: [ ApplicationsController],
})
export class ApplicationsModule {}

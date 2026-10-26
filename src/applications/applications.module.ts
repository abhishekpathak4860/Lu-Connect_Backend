import { Module } from '@nestjs/common';
import { ApplicationsService } from './applications.service';
import { ApplicationsController } from './applications.controller';
import { UploadController } from './upload.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [ApplicationsService],
  controllers: [ ApplicationsController,UploadController],
})
export class ApplicationsModule {}

import { Controller, Get, Post, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Post('analyse-resume')
  @UseInterceptors(FileInterceptor('resume', {
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
      if (file.mimetype !== 'application/pdf') {
        return cb(new BadRequestException('Only PDF files allowed'), false);
      }
      cb(null, true);
    }
  }))
  async analyseResume(@UploadedFile() file: Express.Multer.File) {
    const analysis = await this.appService.analyseResume(file);
    return { success: true, analysis };
  }
}


import {
  Controller,
  Get,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { Request } from 'express';
import type { Express } from 'express';
import { StudentAuthGuard } from 'src/student-auth/student-auth/student-auth.guard';
import { StudentResumeService } from './student-resume.service';

@Controller('student-resume')
@UseGuards(StudentAuthGuard)
export class StudentResumeController {
  constructor(
    private readonly studentResumeService: StudentResumeService,
  ) {}

  @Get('me')
  getMyResume(@Req() req: Request & { student: { id: string } }) {
    return this.studentResumeService.getMyResume(req.student.id);
  }

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('resume', {
      storage: memoryStorage(),
      limits: {
        fileSize: 5 * 1024 * 1024,
        files: 1,
      },
    }),
  )
  uploadResume(
    @Req() req: Request & { student: { id: string } },
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('Please upload a PDF resume');
    }

    return this.studentResumeService.uploadResume(
      req.student.id,
      file,
    );
  }

  @Post('analyze')
@UseInterceptors(
  FileInterceptor('resume', {
    storage: memoryStorage(),
    limits: {
      fileSize: 5 * 1024 * 1024,
      files: 1,
    },
  }),
)
analyzeResume(
  @Req() req: Request & { student: { id: string } },
  @UploadedFile() file?: Express.Multer.File,
) {
  return this.studentResumeService.analyzeResume(
    req.student.id,
    file,
  );
}
}

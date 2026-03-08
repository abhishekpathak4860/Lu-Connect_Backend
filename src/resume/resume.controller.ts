import { Controller, Post, UploadedFile, UseInterceptors, BadRequestException, Body } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ResumeService } from './resume.service';
import { CheckCompatibilityDto } from './dto/check-compatibility.dto';

@Controller('resume')
export class ResumeController {
  constructor(private resumeService: ResumeService) {}

  @Post('analyze')
  @UseInterceptors(FileInterceptor('resume'))
  async analyze(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No resume file provided');
    }
    const result = await this.resumeService.analyze(file.buffer);
    return { success: true, analysis: result };
  }

  @Post('check-compatibility')
  @UseInterceptors(FileInterceptor('resume'))
  async compatibility(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: CheckCompatibilityDto,
  ) {
    let { job } = body;
    if (typeof job === 'string') {
      try {
        job = JSON.parse(job);
      } catch {
        // proceed with string, validation will catch invalid format
      }
    }

    if (!file || !job) {
      throw new BadRequestException('Missing resume or job information');
    }
    const result = await this.resumeService.checkCompatibility(file.buffer, job);
    return { success: true, analysis: result };
  }
}

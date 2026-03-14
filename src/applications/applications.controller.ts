import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  HttpException,
  HttpStatus,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { createClient } from '@supabase/supabase-js';
import { ApplicationsService } from './applications.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SubmitApplicationDto } from './dto/submit-application.dto';
import { UploadResumeDto } from './dto/upload-resume.dto';

@Controller('applications')
export class ApplicationsController {

  // # debug 14f_2 move supabase client here to avoid multiple instances
  private supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY!
    );
  constructor(private applicationsService: ApplicationsService) {}

  @Post()
  @UseInterceptors(FileInterceptor('resume'))
  async submit(
    @UploadedFile() file: Express.Multer.File,
    @Body() body                             // # debug 14f_1 remove dto check ->after this 500 error (supaabse storage error )
    // @Body() body: SubmitApplicationDto,
  ) {
    const { jobId, name, email, phone } = body;
    if (!jobId || !name || !email || !phone || !file) {
      throw new BadRequestException('Missing required fields or resume file');
    }

    // const supabase = createClient(
    //   process.env.SUPABASE_URL || '',
    //   process.env.SUPABASE_ANON_KEY || '',
    // );
    

    // upload resume to supabase
    const fileExt = file.originalname.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `resumes/${jobId}/${fileName}`;

    const { error: uploadError } = await this.supabase.storage
      .from('resumes')
      .upload(filePath, file.buffer, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.error('Upload Error:', uploadError);
      throw new HttpException('Failed to upload resume', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    const { data } = this.supabase.storage
      .from('resumes')
      .getPublicUrl(filePath);

    const application = await this.applicationsService.create({
      job_id: jobId,
      name,
      email,
      phone,
      resume_url: data.publicUrl,
    });
    return { success: true, application };
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async getAll() {
    return { applications: await this.applicationsService.findAllWithJob() };
  }
}

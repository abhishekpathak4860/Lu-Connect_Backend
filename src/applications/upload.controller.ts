import { Controller, Post, UploadedFile, UseInterceptors, BadRequestException, Body } from '@nestjs/common';
import { UploadResumeDto } from './dto/upload-resume.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { createClient } from '@supabase/supabase-js';
import type { Express } from 'express';
import WebSocket from 'ws';

@Controller('upload-resume')
export class UploadController {

  private supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!,
  {
    realtime: {
      transport: WebSocket as any,
    },
  }
);

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async upload(@UploadedFile() file: Express.Multer.File, @Body() body: UploadResumeDto) {
    const userId = body.userId;
    if (!file || !userId) {
      throw new BadRequestException('Missing file or userId');
    }
    // same checks as previous route
    if (file.mimetype !== 'application/pdf') {
      throw new BadRequestException('Only PDF files are allowed');
    }
    if (file.size > 5 * 1024 * 1024) {
      throw new BadRequestException('File size must be less than 5MB');
    }
    const fileName = `resumes/${userId}/${Date.now()}-${file.originalname}`;
    const { data, error } = await this.supabase.storage
      .from('resumes')
      .upload(fileName, file.buffer, { cacheControl: '3600', upsert: false });
    if (error) {
      throw new BadRequestException('Failed to upload file');
    }
    const { data: urlData } = this.supabase.storage
      .from('resumes')
      .getPublicUrl(fileName);
    return { success: true, url: urlData.publicUrl, fileName: file.originalname };
  }
}

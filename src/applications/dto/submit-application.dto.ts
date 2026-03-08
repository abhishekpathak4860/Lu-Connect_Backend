import { IsString, IsNotEmpty, IsEmail } from 'class-validator';

export class SubmitApplicationDto {
  @IsString()
  @IsNotEmpty()
  jobId: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  // resume_url is set after upload, not supplied by client directly
  @IsString()
  resume_url: string;
}

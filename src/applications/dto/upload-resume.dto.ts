import { IsString, IsNotEmpty } from 'class-validator';

export class UploadResumeDto {
  @IsString()
  @IsNotEmpty()
  userId: string;
}

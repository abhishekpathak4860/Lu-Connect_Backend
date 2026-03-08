import { IsString, IsNotEmpty } from 'class-validator';

export class GenerateDto {
  @IsString()
  @IsNotEmpty()
  company: string;
}

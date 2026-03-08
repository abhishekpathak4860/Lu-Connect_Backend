import { IsString, IsNotEmpty, IsArray } from 'class-validator';

export class EvaluateDto {
  @IsString()
  @IsNotEmpty()
  company: string;

  @IsArray()
  answers: any[];
}

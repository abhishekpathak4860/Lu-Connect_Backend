import {
  IsString,
  IsNotEmpty,
  IsDateString,
  IsEnum,
  IsArray,
  IsOptional,
  ArrayNotEmpty,
} from 'class-validator';
import { WorkMode } from '@prisma/client';

export class CreateInternshipDto {
  @IsString()
  @IsNotEmpty()
  company_name!: string;

  @IsString()
  @IsNotEmpty()
  role!: string;

  @IsString()
  @IsNotEmpty()
  location!: string;

  @IsEnum(WorkMode)
  work_mode!: WorkMode;

  @IsString()
  @IsNotEmpty()
  stipend!: string;

  @IsString()
  @IsNotEmpty()
  duration!: string;

  @IsString()
  @IsNotEmpty()
  eligibility_criteria!: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  required_skills!: string[];

  @IsString()
  @IsNotEmpty()
  description!: string;

  @IsDateString()
  application_deadline!: string;

  @IsOptional()
  @IsDateString()
  start_date?: string;
}

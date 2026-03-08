import { IsString, IsDateString, IsNotEmpty } from 'class-validator';

export class CreateJobDto {
  @IsString()
  @IsNotEmpty()
  company_name: string;

  @IsString()
  @IsNotEmpty()
  role: string;

  @IsString()
  @IsNotEmpty()
  location: string;

  @IsString()
  @IsNotEmpty()
  package: string;

  @IsString()
  @IsNotEmpty()
  eligibility_criteria: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsDateString()
  application_deadline: string;
}

import { IsEnum } from 'class-validator';
import { ApplicationStatus } from '@prisma/client';

export class UpdateInternshipApplicationStatusDto {
  @IsEnum(ApplicationStatus)
  status!: ApplicationStatus;
}
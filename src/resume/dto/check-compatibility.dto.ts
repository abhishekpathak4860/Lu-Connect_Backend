import { IsNotEmpty } from 'class-validator';

export class CheckCompatibilityDto {
  @IsNotEmpty()
  job: any; // we accept the raw job object from the client
}

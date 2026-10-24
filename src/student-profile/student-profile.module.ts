import { Module } from '@nestjs/common';
import { StudentProfileService } from './student-profile.service';
import { StudentProfileController } from './student-profile.controller';
import { StudentAuthModule } from 'src/student-auth/student-auth.module';

@Module({
  imports: [StudentAuthModule],
  providers: [StudentProfileService],
  exports: [StudentProfileService],
  controllers: [StudentProfileController],
})
export class StudentProfileModule {}
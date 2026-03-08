import { Module } from '@nestjs/common';
import { HrPrepService } from './hr-prep.service';
import { HrPrepController } from './hr-prep.controller';

@Module({
  providers: [HrPrepService],
  controllers: [HrPrepController],
})
export class HrPrepModule {}

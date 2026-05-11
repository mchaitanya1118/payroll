import { Module } from '@nestjs/common';
import { DailyEntriesController } from './daily-entries.controller';
import { DailyEntriesService } from './daily-entries.service';
import { PrismaModule } from '../prisma/prisma.module';
import { PayslipsModule } from '../payslips/payslips.module';
import { RatesModule } from '../rates/rates.module';

@Module({
  imports: [PrismaModule, PayslipsModule, RatesModule],
  controllers: [DailyEntriesController],
  providers: [DailyEntriesService],
})
export class DailyEntriesModule {}

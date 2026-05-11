import { Controller, Get, Post, Body, Query, Request, UseGuards } from '@nestjs/common';
import { DailyEntriesService } from './daily-entries.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('daily-entries')
export class DailyEntriesController {
  constructor(private readonly dailyEntriesService: DailyEntriesService) {}

  @Get()
  async getGrid(
    @Query('month') month: string,
    @Query('year') year: string,
    @Query('companyCode') companyCode: string,
    @Request() req: any,
  ) {
    return this.dailyEntriesService.getMonthlyGrid(
      req.user.tenantId,
      parseInt(month),
      parseInt(year),
      companyCode,
    );
  }

  @Post('bulk')
  async bulkUpdate(
    @Body('updates') updates: any[],
    @Request() req: any,
  ) {
    return this.dailyEntriesService.bulkUpdate(req.user.tenantId, updates);
  }
}

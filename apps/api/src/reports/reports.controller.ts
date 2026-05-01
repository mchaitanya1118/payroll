import {
  Controller,
  Get,
  Query,
  UseGuards,
  Request,
  Res,
} from "@nestjs/common";
import { ReportsService } from "./reports.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../auth/roles.decorator";
import { UserRole } from "@prisma/client";

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("reports")
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get("payroll/export")
  @Roles(UserRole.ADMIN)
  async exportPayroll(
    @Request() req: any,
    @Query("month") month: string,
    @Query("year") year: string,
    @Res() res: any,
  ) {
    const csv = await this.reportsService.exportPayrollCsv(
      req.user.tenantId,
      parseInt(month),
      parseInt(year),
    );

    res.set({
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="payroll_${month}_${year}.csv"`,
    });

    res.send(csv);
  }

  @Get("riders/export")
  @Roles(UserRole.ADMIN)
  async exportRiders(@Request() req: any, @Res() res: any) {
    const csv = await this.reportsService.exportRidersCsv(req.user.tenantId);

    res.set({
      "Content-Type": "text/csv",
      "Content-Disposition": 'attachment; filename="riders_directory.csv"',
    });

    res.send(csv);
  }

  @Get("riders/data")
  async getRidersData(
    @Request() req: any,
    @Query("month") month: string,
    @Query("year") year: string,
  ) {
    return this.reportsService.getRidersReport(
      req.user.tenantId,
      parseInt(month),
      parseInt(year),
    );
  }

  @Get("performance/export")
  @Roles(UserRole.ADMIN)
  async exportPerformance(
    @Request() req: any,
    @Query("month") month: string,
    @Query("year") year: string,
    @Res() res: any,
  ) {
    const csv = await this.reportsService.exportPerformanceCsv(
      req.user.tenantId,
      parseInt(month),
      parseInt(year),
    );

    res.set({
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="performance_${month}_${year}.csv"`,
    });

    res.send(csv);
  }

  @Get("analytics")
  async getAnalytics(@Request() req: any) {
    return this.reportsService.getAnalyticsSummary(req.user.tenantId);
  }
}

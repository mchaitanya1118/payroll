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
    @Query("companyCode") companyCode?: string,
  ) {
    const buffer = await this.reportsService.exportPayrollExcel(
      req.user.tenantId,
      parseInt(month),
      parseInt(year),
      companyCode,
    );

    res.set({
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="payroll_${month}_${year}${companyCode ? `_${companyCode}` : ""}.xlsx"`,
    });

    res.send(buffer);
  }

  @Get("riders/export")
  @Roles(UserRole.ADMIN)
  async exportRiders(
    @Request() req: any, 
    @Res() res: any,
    @Query("companyCode") companyCode?: string,
  ) {
    const buffer = await this.reportsService.exportRidersExcel(req.user.tenantId, companyCode);

    res.set({
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="riders_directory${companyCode ? `_${companyCode}` : ""}.xlsx"`,
    });

    res.send(buffer);
  }

  @Get("riders/data")
  async getRidersData(
    @Request() req: any,
    @Query("month") month: string,
    @Query("year") year: string,
    @Query("companyCode") companyCode?: string,
  ) {
    return this.reportsService.getRidersReport(
      req.user.tenantId,
      parseInt(month),
      parseInt(year),
      companyCode,
    );
  }

  @Get("performance/export")
  @Roles(UserRole.ADMIN)
  async exportPerformance(
    @Request() req: any,
    @Query("month") month: string,
    @Query("year") year: string,
    @Res() res: any,
    @Query("companyCode") companyCode?: string,
  ) {
    const buffer = await this.reportsService.exportPerformanceExcel(
      req.user.tenantId,
      parseInt(month),
      parseInt(year),
      companyCode,
    );

    res.set({
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="performance_${month}_${year}.xlsx"`,
    });

    res.send(buffer);
  }

  @Get("analytics")
  async getAnalytics(
    @Request() req: any,
    @Query("month") month?: string,
    @Query("year") year?: string,
    @Query("companyCode") companyCode?: string,
  ) {
    try {
      return await this.reportsService.getAnalyticsSummary(
        req.user.tenantId,
        month ? parseInt(month) : undefined,
        year ? parseInt(year) : undefined,
        companyCode,
      );
    } catch (error: any) {
      console.error("[ReportsController] Analytics Failure:", error);
      throw new Error(`Analytics Engine Error: ${error.message}`);
    }
  }
}

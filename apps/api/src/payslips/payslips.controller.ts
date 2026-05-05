import {
  Controller,
  Get,
  Param,
  Query,
  Patch,
  Body,
  Post,
  UseGuards,
  Request,
  Res,
  UploadedFile,
  UseInterceptors
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import * as express from "express";
import { PayslipsService } from "./payslips.service";
import { UpdatePayslipDto } from "./dto/update-payslip.dto";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
// Triggering server reload after schema update - Final Kick
// Ensuring all changes are picked up by NestJS watch mode

@UseGuards(JwtAuthGuard)
@Controller("payslips")
export class PayslipsController {
  constructor(private readonly payslipsService: PayslipsService) {}

  @Get("dashboard")
  async getDashboard(
    @Request() req: any,
    @Query("month") month: string,
    @Query("year") year: string,
    @Query("search") search?: string,
    @Query("companyCode") companyCode?: string,
  ) {
    try {
      return await this.payslipsService.getDashboard(
        req.user.tenantId,
        parseInt(month),
        parseInt(year),
        search,
        companyCode,
      );
    } catch (error: any) {
      console.error('[PayslipsController] Dashboard Failure:', error);
      throw new Error(`Dashboard Protocol Error: ${error.message}`);
    }
  }

  @Get()
  async getPayslipsList(
    @Request() req: any,
    @Query("month") month: string,
    @Query("year") year: string,
    @Query("search") search?: string,
    @Query("companyCode") companyCode?: string,
  ) {
    return this.payslipsService.getPayslipsList(
      req.user.tenantId,
      parseInt(month),
      parseInt(year),
      search,
      companyCode,
    );
  }

  @Patch(":id")
  async updatePayslip(@Param("id") id: string, @Body() dto: UpdatePayslipDto) {
    return this.payslipsService.update(id, dto);
  }

  @Post("generate-all")
  async generateAll(
    @Request() req: any,
    @Body("month") month: any,
    @Body("year") year: any,
  ) {
    return this.payslipsService.generateAllPayslips(
      req.user.tenantId,
      parseInt(month),
      parseInt(year),
    );
  }

  @Post(":id/send-email")
  async sendEmail(@Param("id") id: string) {
    return this.payslipsService.sendPayslipEmail(id);
  }

  @Post("send-all-emails")
  async sendAllEmails(
    @Request() req: any,
    @Body("month") month: any,
    @Body("year") year: any,
  ) {
    return this.payslipsService.sendBulkEmails(
      req.user.tenantId,
      parseInt(month),
      parseInt(year),
    );
  }

  @Get("adjustments/export")
  async exportAdjustments(
    @Request() req: any,
    @Query("month") month: string,
    @Query("year") year: string,
    @Res() res: express.Response
  ) {
    const buffer = await this.payslipsService.exportAdjustments(
      req.user.tenantId,
      parseInt(month),
      parseInt(year)
    );
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename=Adjustments_${month}_${year}.xlsx`,
      'Content-Length': buffer.length,
    });
    res.send(buffer);
  }

  @Post("adjustments/import")
  @UseInterceptors(FileInterceptor('file'))
  async importAdjustments(
    @Request() req: any,
    @UploadedFile() file: Express.Multer.File
  ) {
    return this.payslipsService.importAdjustments(req.user.tenantId, file.buffer);
  }

  @Get("adjustments/list")
  async getAdjustedSlips(
    @Request() req: any,
    @Query("month") month: string,
    @Query("year") year: string,
    @Query("companyCode") companyCode?: string
  ) {
    return this.payslipsService.getAdjustedSlips(
      req.user.tenantId,
      parseInt(month),
      parseInt(year),
      companyCode === 'ALL' ? undefined : companyCode
    );
  }

  @Get(":riderId/:month/:year")
  async getPayslip(
    @Request() req: any,
    @Param("riderId") riderId: string,
    @Param("month") month: string,
    @Param("year") year: string,
  ) {
    return this.payslipsService.getPayslip(
      req.user.tenantId,
      riderId,
      parseInt(month),
      parseInt(year),
    );
  }
}

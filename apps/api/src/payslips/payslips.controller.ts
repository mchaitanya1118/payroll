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
} from "@nestjs/common";
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
  ) {
    return this.payslipsService.getDashboard(
      req.user.tenantId,
      parseInt(month),
      parseInt(year),
      search,
    );
  }

  @Get()
  async getPayslipsList(
    @Request() req: any,
    @Query("month") month: string,
    @Query("year") year: string,
    @Query("search") search?: string,
  ) {
    return this.payslipsService.getPayslipsList(
      req.user.tenantId,
      parseInt(month),
      parseInt(year),
      search,
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
}

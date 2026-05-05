import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  Res,
} from "@nestjs/common";
import { AdvancesService } from "./advances.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../auth/roles.decorator";
import { UserRole } from "@prisma/client";

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("advances")
export class AdvancesController {
  constructor(private readonly advancesService: AdvancesService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  async create(@Request() req: any, @Body() body: any) {
    return this.advancesService.create(req.user.tenantId, body);
  }

  @Get()
  async findAll(
    @Request() req: any,
    @Query("search") search?: string,
    @Query("companyCode") companyCode?: string
  ) {
    return this.advancesService.findAll(
      req.user.tenantId,
      search,
      companyCode === 'ALL' ? undefined : companyCode
    );
  }

  @Get("rider/:riderId")
  async findByRider(@Request() req: any, @Param("riderId") riderId: string) {
    return this.advancesService.findByRider(req.user.tenantId, riderId);
  }

  @Get("export")
  @Roles(UserRole.ADMIN)
  async export(@Request() req: any, @Res() res: any, @Query("companyCode") companyCode?: string) {
    const buffer = await this.advancesService.exportLedgerExcel(
      req.user.tenantId,
      companyCode === 'ALL' ? undefined : companyCode
    );

    res.set({
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="advance_ledger_${companyCode || 'all'}.xlsx"`,
    });

    res.send(buffer);
  }

  @Delete(":id")
  @Roles(UserRole.ADMIN)
  async remove(@Request() req: any, @Param("id") id: string) {
    return this.advancesService.remove(req.user.tenantId, id);
  }
}

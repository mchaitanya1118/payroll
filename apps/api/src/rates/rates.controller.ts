import {
  Controller,
  Get,
  Post,
  Body,
  Delete,
  Param,
  UseGuards,
  Request,
  Res,
} from "@nestjs/common";
import { RatesService } from "./rates.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../auth/roles.decorator";
import { UserRole } from "@prisma/client";

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("rates")
export class RatesController {
  constructor(private readonly ratesService: RatesService) {}

  @Get("export")
  async exportRates(@Request() req: any, @Res() res: any) {
    const buffer = await this.ratesService.exportRates(req.user.tenantId);
    res.set({
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="rate_configs.xlsx"`,
      "Content-Length": buffer.length,
    });
    res.send(buffer);
  }

  @Get()
  async findAll(@Request() req: any) {
    return this.ratesService.findAll(req.user.tenantId);
  }

  @Post()
  @Roles(UserRole.ADMIN)
  async upsert(@Request() req: any, @Body() body: any) {
    return this.ratesService.upsert(req.user.tenantId, body);
  }

  @Delete(":id")
  @Roles(UserRole.ADMIN)
  async remove(@Request() req: any, @Param("id") id: string) {
    return this.ratesService.remove(req.user.tenantId, id);
  }
}

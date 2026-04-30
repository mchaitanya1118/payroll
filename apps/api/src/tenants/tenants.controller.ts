import {
  Controller,
  Get,
  Patch,
  Body,
  UseGuards,
  Request,
} from "@nestjs/common";
import { TenantsService } from "./tenants.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../auth/roles.decorator";
import { UserRole } from "@prisma/client";

@Controller("tenants")
@UseGuards(JwtAuthGuard, RolesGuard)
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Get("settings")
  async getSettings(@Request() req: any) {
    return this.tenantsService.getTenantSettings(req.user.tenantId);
  }

  @Patch("settings")
  @Roles(UserRole.ADMIN)
  async updateSettings(@Request() req: any, @Body() data: any) {
    return this.tenantsService.updateTenantSettings(req.user.tenantId, data);
  }
}

import {
  Controller,
  Post,
  Get,
  Delete,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from "@nestjs/common";
import { RidersService } from "./riders.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../auth/roles.decorator";
import { UserRole } from "@prisma/client";

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("riders")
export class RidersController {
  constructor(private readonly ridersService: RidersService) {}

  @Post()
  async createRider(@Request() req: any, @Body() body: any) {
    return this.ridersService.createRider(req.user.tenantId, body);
  }

  @Get()
  async getRiders(
    @Request() req: any,
    @Query("search") search?: string,
    @Query("vehicleType") vehicleType?: string,
    @Query("companyCode") companyCode?: string,
  ) {
    return this.ridersService.getRiders(req.user.tenantId, {
      search,
      vehicleType,
      companyCode,
    });
  }

  @Get("count")
  async getRidersCount(@Request() req: any) {
    return this.ridersService.getRidersCount(req.user.tenantId);
  }

  @Delete(":id")
  @Roles(UserRole.ADMIN)
  async deleteRider(@Request() req: any, @Param("id") id: string) {
    return this.ridersService.deleteRider(req.user.tenantId, id);
  }

  @Patch(":id")
  async updateRider(
    @Request() req: any,
    @Param("id") id: string,
    @Body() body: any,
  ) {
    return this.ridersService.updateRider(req.user.tenantId, id, body);
  }
}

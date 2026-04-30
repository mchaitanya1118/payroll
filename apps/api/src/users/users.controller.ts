import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from "@nestjs/common";
import { UsersService } from "./users.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../auth/roles.decorator";
import { UserRole } from "@prisma/client";

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles(UserRole.ADMIN)
  async findAll(@Request() req: any) {
    return this.usersService.findAll(req.user.tenantId);
  }

  @Post()
  @Roles(UserRole.ADMIN)
  async create(@Request() req: any, @Body() body: any) {
    return this.usersService.create(req.user.tenantId, body);
  }

  @Patch(":id")
  @Roles(UserRole.ADMIN)
  async update(
    @Request() req: any,
    @Param("id") id: string,
    @Body() body: any,
  ) {
    return this.usersService.update(req.user.tenantId, id, body);
  }

  @Delete(":id")
  @Roles(UserRole.ADMIN)
  async remove(@Request() req: any, @Param("id") id: string) {
    return this.usersService.remove(req.user.tenantId, id);
  }
}

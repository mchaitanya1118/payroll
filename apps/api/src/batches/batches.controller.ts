import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Request,
} from "@nestjs/common";
import { BatchesService } from "./batches.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";

@UseGuards(JwtAuthGuard)
@Controller("batches")
export class BatchesController {
  constructor(private readonly batchesService: BatchesService) {}

  @Post()
  async createBatch(@Request() req: any, @Body() body: any) {
    return this.batchesService.createBatch(req.user.tenantId, body);
  }

  @Get()
  async getBatches(@Request() req: any) {
    return this.batchesService.getBatches(req.user.tenantId);
  }
}

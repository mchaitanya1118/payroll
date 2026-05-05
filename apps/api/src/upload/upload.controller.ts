import {
  Controller,
  Post,
  Body,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  UseGuards,
  Request,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { UploadService } from "./upload.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../auth/roles.decorator";
import { UserRole } from "@prisma/client";

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("upload")
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post("preview")
  @UseInterceptors(FileInterceptor("file"))
  async previewExcel(@Request() req: any, @UploadedFile() file: any) {
    console.log("[UploadController] Preview requested. File received:", !!file);
    if (file) {
      console.log(
        "[UploadController] File size:",
        file.size,
        "Mimetype:",
        file.mimetype,
      );
    }
    if (!file) throw new BadRequestException("No file uploaded");
    try {
      return await this.uploadService.getHeaders(file.buffer);
    } catch (err) {
      console.error("[UploadController] Preview failed:", err);
      throw new BadRequestException(
        "Failed to read Excel file: " + err.message,
      );
    }
  }

  @Post("excel")
  @UseInterceptors(FileInterceptor("file"))
  async uploadExcel(
    @Request() req: any,
    @UploadedFile() file: any,
    @Body("mapping") mappingStr?: string,
    @Body("month") monthStr?: string,
    @Body("year") yearStr?: string,
  ) {
    if (!file) {
      throw new BadRequestException("No file uploaded");
    }

    const tenantId = req.user.tenantId;
    let mapping = undefined;

    if (mappingStr) {
      try {
        mapping = JSON.parse(mappingStr);
      } catch (e) {
        console.warn("Failed to parse mapping JSON", mappingStr);
      }
    }

    const month = monthStr ? parseInt(monthStr) : undefined;
    const year = yearStr ? parseInt(yearStr) : undefined;

    return this.uploadService.processExcel(
      file.buffer,
      tenantId,
      mapping,
      month,
      year,
    );
  }

  @Post("riders")
  @UseInterceptors(FileInterceptor("file"))
  async uploadRiders(@Request() req: any, @UploadedFile() file: any) {
    if (!file) {
      throw new BadRequestException("No file uploaded");
    }
    const tenantId = req.user.tenantId;
    return this.uploadService.processExcel(
      file.buffer,
      tenantId,
      undefined,
      undefined,
      undefined,
      true, // ridersOnly
    );
  }

  @Post("reset")
  @Roles(UserRole.ADMIN)
  async resetData(
    @Request() req: any,
    @Body("month") month?: number,
    @Body("year") year?: number
  ) {
    const tenantId = req.user.tenantId;
    return this.uploadService.resetTenantData(tenantId, month, year);
  }
}

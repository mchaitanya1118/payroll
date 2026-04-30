import {
  Controller,
  Get,
  Post,
  Body,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { WhatsappService } from "./whatsapp.service";

@Controller("whatsapp")
export class WhatsappController {
  constructor(private readonly whatsappService: WhatsappService) {}

  @Get("status")
  getStatus() {
    return this.whatsappService.getStatus();
  }

  @Post("send-payslip")
  @UseInterceptors(FileInterceptor("file"))
  async sendPayslip(
    @UploadedFile() file: any,
    @Body("phoneNumber") phoneNumber: string,
    @Body("caption") caption: string,
  ) {
    if (!file) throw new BadRequestException("PDF file is required");
    if (!phoneNumber) throw new BadRequestException("Phone number is required");

    try {
      await this.whatsappService.sendPdf(
        phoneNumber,
        file.buffer,
        file.originalname || "Payslip.pdf",
        caption,
      );
      return { success: true, message: "Payslip sent to WhatsApp" };
    } catch (err) {
      return { success: false, message: err.message };
    }
  }

  @Post("logout")
  async logout() {
    try {
      await this.whatsappService.logout();
      return { success: true, message: "WhatsApp session reset initiated" };
    } catch (err) {
      throw new BadRequestException("Logout failed: " + err.message);
    }
  }
}

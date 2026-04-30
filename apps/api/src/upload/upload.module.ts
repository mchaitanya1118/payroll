import { Module } from "@nestjs/common";
import { UploadController } from "./upload.controller";
import { UploadService } from "./upload.service";

import { PrismaModule } from "../prisma/prisma.module";
import { RatesModule } from "../rates/rates.module";
import { PayslipsModule } from "../payslips/payslips.module";

@Module({
  imports: [PrismaModule, RatesModule, PayslipsModule],
  controllers: [UploadController],
  providers: [UploadService],
})
export class UploadModule {}

import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { PrismaService } from "./prisma/prisma.service";
import { PrismaModule } from "./prisma/prisma.module";
import { AuthModule } from "./auth/auth.module";
import { TenantsModule } from "./tenants/tenants.module";
import { RidersModule } from "./riders/riders.module";
import { BatchesModule } from "./batches/batches.module";
import { PayslipsModule } from "./payslips/payslips.module";
import { UploadModule } from "./upload/upload.module";
import { RatesModule } from "./rates/rates.module";
import { ReportsController } from "./reports/reports.controller";
import { ReportsService } from "./reports/reports.service";
import { MailModule } from "./mail/mail.module";
import { UsersModule } from "./users/users.module";
import { WhatsappModule } from "./whatsapp/whatsapp.module";
import { AdvancesModule } from "./advances/advances.module";
import { DailyEntriesModule } from "./daily-entries/daily-entries.module";
import { RiderGroupsModule } from "./rider-groups/rider-groups.module";

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    TenantsModule,
    RidersModule,
    BatchesModule,
    PayslipsModule,
    UploadModule,
    RatesModule,
    MailModule,
    UsersModule,
    WhatsappModule,
    AdvancesModule,
    DailyEntriesModule,
    RiderGroupsModule,
  ],
  controllers: [AppController, ReportsController],
  providers: [AppService, PrismaService, ReportsService],
})
export class AppModule {}

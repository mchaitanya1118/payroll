"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const prisma_service_1 = require("./prisma/prisma.service");
const prisma_module_1 = require("./prisma/prisma.module");
const auth_module_1 = require("./auth/auth.module");
const tenants_module_1 = require("./tenants/tenants.module");
const riders_module_1 = require("./riders/riders.module");
const batches_module_1 = require("./batches/batches.module");
const payslips_module_1 = require("./payslips/payslips.module");
const upload_module_1 = require("./upload/upload.module");
const rates_module_1 = require("./rates/rates.module");
const reports_controller_1 = require("./reports/reports.controller");
const reports_service_1 = require("./reports/reports.service");
const mail_module_1 = require("./mail/mail.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            prisma_module_1.PrismaModule,
            auth_module_1.AuthModule,
            tenants_module_1.TenantsModule,
            riders_module_1.RidersModule,
            batches_module_1.BatchesModule,
            payslips_module_1.PayslipsModule,
            upload_module_1.UploadModule,
            rates_module_1.RatesModule,
            mail_module_1.MailModule,
        ],
        controllers: [app_controller_1.AppController, reports_controller_1.ReportsController],
        providers: [app_service_1.AppService, prisma_service_1.PrismaService, reports_service_1.ReportsService],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map
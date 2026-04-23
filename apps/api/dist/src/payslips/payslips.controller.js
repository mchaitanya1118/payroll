"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PayslipsController = void 0;
const common_1 = require("@nestjs/common");
const payslips_service_1 = require("./payslips.service");
const update_payslip_dto_1 = require("./dto/update-payslip.dto");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
let PayslipsController = class PayslipsController {
    payslipsService;
    constructor(payslipsService) {
        this.payslipsService = payslipsService;
    }
    async getDashboard(req, month, year, search) {
        return this.payslipsService.getDashboard(req.user.tenantId, parseInt(month), parseInt(year), search);
    }
    async getPayslipsList(req, month, year, search) {
        return this.payslipsService.getPayslipsList(req.user.tenantId, parseInt(month), parseInt(year), search);
    }
    async getPayslip(req, riderId, month, year) {
        return this.payslipsService.getPayslip(req.user.tenantId, riderId, parseInt(month), parseInt(year));
    }
    async updatePayslip(id, dto) {
        return this.payslipsService.update(id, dto);
    }
    async generateAll(req, month, year) {
        return this.payslipsService.generateAllPayslips(req.user.tenantId, parseInt(month), parseInt(year));
    }
    async sendEmail(id) {
        return this.payslipsService.sendPayslipEmail(id);
    }
    async sendAllEmails(req, month, year) {
        return this.payslipsService.sendBulkEmails(req.user.tenantId, parseInt(month), parseInt(year));
    }
};
exports.PayslipsController = PayslipsController;
__decorate([
    (0, common_1.Get)('dashboard'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('month')),
    __param(2, (0, common_1.Query)('year')),
    __param(3, (0, common_1.Query)('search')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String]),
    __metadata("design:returntype", Promise)
], PayslipsController.prototype, "getDashboard", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('month')),
    __param(2, (0, common_1.Query)('year')),
    __param(3, (0, common_1.Query)('search')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String]),
    __metadata("design:returntype", Promise)
], PayslipsController.prototype, "getPayslipsList", null);
__decorate([
    (0, common_1.Get)(':riderId/:month/:year'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('riderId')),
    __param(2, (0, common_1.Param)('month')),
    __param(3, (0, common_1.Param)('year')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String]),
    __metadata("design:returntype", Promise)
], PayslipsController.prototype, "getPayslip", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_payslip_dto_1.UpdatePayslipDto]),
    __metadata("design:returntype", Promise)
], PayslipsController.prototype, "updatePayslip", null);
__decorate([
    (0, common_1.Post)('generate-all'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)('month')),
    __param(2, (0, common_1.Body)('year')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", Promise)
], PayslipsController.prototype, "generateAll", null);
__decorate([
    (0, common_1.Post)(':id/send-email'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PayslipsController.prototype, "sendEmail", null);
__decorate([
    (0, common_1.Post)('send-all-emails'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)('month')),
    __param(2, (0, common_1.Body)('year')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", Promise)
], PayslipsController.prototype, "sendAllEmails", null);
exports.PayslipsController = PayslipsController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('payslips'),
    __metadata("design:paramtypes", [payslips_service_1.PayslipsService])
], PayslipsController);
//# sourceMappingURL=payslips.controller.js.map
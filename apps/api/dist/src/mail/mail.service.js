"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var MailService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MailService = void 0;
const common_1 = require("@nestjs/common");
const nodemailer = __importStar(require("nodemailer"));
let MailService = MailService_1 = class MailService {
    transporter;
    logger = new common_1.Logger(MailService_1.name);
    constructor() {
        this.transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: parseInt(process.env.SMTP_PORT || '587'),
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });
    }
    async sendPayslipEmail(email, riderName, month, year, payslipData) {
        const monthName = new Date(year, month - 1).toLocaleString('default', { month: 'long' });
        const htmlContent = `
      <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
        <h2 style="color: #10b981; border-bottom: 2px solid #10b981; padding-bottom: 10px;">Monthly Payslip - ${monthName} ${year}</h2>
        <p>Dear <strong>${riderName}</strong>,</p>
        <p>Your payslip for ${monthName} ${year} has been generated. Please find the summary below:</p>
        
        <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 5px 0; color: #666;">Gross Payout:</td>
              <td style="padding: 5px 0; text-align: right; font-weight: bold;">SAR ${payslipData.grossAmount.toFixed(2)}</td>
            </tr>
            <tr>
              <td style="padding: 5px 0; color: #666;">Total Deductions:</td>
              <td style="padding: 5px 0; text-align: right; font-weight: bold; color: #ef4444;">SAR ${payslipData.deductions.toFixed(2)}</td>
            </tr>
            <tr style="border-top: 1px solid #ddd;">
              <td style="padding: 10px 0; font-weight: bold; font-size: 1.1em;">Net Payout:</td>
              <td style="padding: 10px 0; text-align: right; font-weight: bold; font-size: 1.1em; color: #10b981;">SAR ${payslipData.netTotal.toFixed(2)}</td>
            </tr>
          </table>
        </div>
        
        <p>You can view your detailed payslip and individual order breakdown by logging into the Neqtra Payroll portal.</p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 0.8em; color: #999;">
          <p>This is an automated email. Please do not reply directly to this message.</p>
          <p>© ${new Date().getFullYear()} Neqtra Payroll System</p>
        </div>
      </div>
    `;
        try {
            await this.transporter.sendMail({
                from: `"Neqtra Payroll" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
                to: email,
                subject: `Payslip for ${monthName} ${year} - ${riderName}`,
                html: htmlContent,
            });
            this.logger.log(`Payslip email sent successfully to ${email}`);
            return { success: true };
        }
        catch (error) {
            this.logger.error(`Failed to send payslip email to ${email}`, error.stack);
            throw error;
        }
    }
};
exports.MailService = MailService;
exports.MailService = MailService = MailService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], MailService);
//# sourceMappingURL=mail.service.js.map
import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;
  private readonly logger = new Logger(MailService.name);

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async sendPayslipEmail(email: string, riderName: string, month: number, year: number, payslipData: any) {
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
    } catch (error) {
      this.logger.error(`Failed to send payslip email to ${email}`, error.stack);
      throw error;
    }
  }
}

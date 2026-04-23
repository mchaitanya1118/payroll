export declare class MailService {
    private transporter;
    private readonly logger;
    constructor();
    sendPayslipEmail(email: string, riderName: string, month: number, year: number, payslipData: any): Promise<{
        success: boolean;
    }>;
}

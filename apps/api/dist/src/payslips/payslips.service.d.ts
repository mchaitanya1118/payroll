import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
export declare class PayslipsService {
    private readonly prisma;
    private readonly mailService;
    constructor(prisma: PrismaService, mailService: MailService);
    sendPayslipEmail(id: string): Promise<{
        success: boolean;
    }>;
    sendBulkEmails(tenantId: string, month: number, year: number): Promise<{
        total: number;
        sent: number;
        failed: number;
        errors: string[];
    }>;
    getDashboard(tenantId: string, month: number, year: number, search?: string): Promise<{
        slips: never[];
        summary: {
            totalPayout?: undefined;
            totalRiders?: undefined;
            completed?: undefined;
            payoutGrowth?: undefined;
        };
        slipsCount?: undefined;
        recentActivity?: undefined;
    } | {
        slipsCount: number;
        summary: {
            totalPayout: number;
            totalRiders: number;
            completed: number;
            payoutGrowth: number;
        };
        recentActivity: {
            id: string;
            type: string;
            title: string;
            description: string;
            timestamp: Date;
        }[];
        slips?: undefined;
    }>;
    getPayslipsList(tenantId: string, month: number, year: number, search?: string): Promise<({
        rider: {
            id: string;
            riderId: string;
            tenantId: string;
            createdAt: Date;
            updatedAt: Date;
            riderName: string;
            vehicleType: import("@prisma/client").$Enums.VehicleType;
            rateType: import("@prisma/client").$Enums.RateType;
            companyCode: string | null;
        };
    } & {
        id: string;
        month: number;
        year: number;
        status: import("@prisma/client").$Enums.SalarySlipStatus;
        riderId: string;
        tenantId: string;
        totalSingleOrders: number;
        totalDoubleOrders: number;
        grossAmount: number;
        salesCash: number;
        carRent: number;
        akama: number;
        fine: number;
        bankDeduction: number;
        deductions: number;
        bonus: number;
        netTotal: number;
        grossRevenue: number;
        createdAt: Date;
        updatedAt: Date;
    })[]>;
    generateAllPayslips(tenantId: string, month: number, year: number): Promise<{
        success: boolean;
        count: number;
        message: string;
    }>;
    getPayslip(tenantId: string, riderId: string, month: number, year: number): Promise<{
        payslip: {
            rider: {
                id: string;
                riderId: string;
                tenantId: string;
                createdAt: Date;
                updatedAt: Date;
                riderName: string;
                vehicleType: import("@prisma/client").$Enums.VehicleType;
                rateType: import("@prisma/client").$Enums.RateType;
                companyCode: string | null;
            };
        } & {
            id: string;
            month: number;
            year: number;
            status: import("@prisma/client").$Enums.SalarySlipStatus;
            riderId: string;
            tenantId: string;
            totalSingleOrders: number;
            totalDoubleOrders: number;
            grossAmount: number;
            salesCash: number;
            carRent: number;
            akama: number;
            fine: number;
            bankDeduction: number;
            deductions: number;
            bonus: number;
            netTotal: number;
            grossRevenue: number;
            createdAt: Date;
            updatedAt: Date;
        };
        entries: ({
            batch: {
                id: string;
                tenantId: string;
                createdAt: Date;
                updatedAt: Date;
                batchNumber: number;
                rateSingleOrder: number;
                rateDoubleOrder: number;
            };
        } & {
            id: string;
            riderId: string;
            createdAt: Date;
            updatedAt: Date;
            date: Date;
            batchId: string;
            singleOrders: number;
            doubleOrders: number;
            autoRateSingle: number;
            autoRateDouble: number;
            dailyAmount: number;
            riderRateSingle: number | null;
            riderRateDouble: number | null;
            companyRateSingle: number | null;
            companyRateDouble: number | null;
            companyAmount: number | null;
            payrollMonth: number | null;
            payrollYear: number | null;
        })[];
    }>;
    update(id: string, dto: any): Promise<{
        rider: {
            id: string;
            riderId: string;
            tenantId: string;
            createdAt: Date;
            updatedAt: Date;
            riderName: string;
            vehicleType: import("@prisma/client").$Enums.VehicleType;
            rateType: import("@prisma/client").$Enums.RateType;
            companyCode: string | null;
        };
    } & {
        id: string;
        month: number;
        year: number;
        status: import("@prisma/client").$Enums.SalarySlipStatus;
        riderId: string;
        tenantId: string;
        totalSingleOrders: number;
        totalDoubleOrders: number;
        grossAmount: number;
        salesCash: number;
        carRent: number;
        akama: number;
        fine: number;
        bankDeduction: number;
        deductions: number;
        bonus: number;
        netTotal: number;
        grossRevenue: number;
        createdAt: Date;
        updatedAt: Date;
    }>;
    syncPayslip(tenantId: string, riderId: string, month: number, year: number): Promise<({
        rider: {
            id: string;
            riderId: string;
            tenantId: string;
            createdAt: Date;
            updatedAt: Date;
            riderName: string;
            vehicleType: import("@prisma/client").$Enums.VehicleType;
            rateType: import("@prisma/client").$Enums.RateType;
            companyCode: string | null;
        };
    } & {
        id: string;
        month: number;
        year: number;
        status: import("@prisma/client").$Enums.SalarySlipStatus;
        riderId: string;
        tenantId: string;
        totalSingleOrders: number;
        totalDoubleOrders: number;
        grossAmount: number;
        salesCash: number;
        carRent: number;
        akama: number;
        fine: number;
        bankDeduction: number;
        deductions: number;
        bonus: number;
        netTotal: number;
        grossRevenue: number;
        createdAt: Date;
        updatedAt: Date;
    }) | null>;
}

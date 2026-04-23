import { PayslipsService } from './payslips.service';
import { UpdatePayslipDto } from './dto/update-payslip.dto';
export declare class PayslipsController {
    private readonly payslipsService;
    constructor(payslipsService: PayslipsService);
    getDashboard(req: any, month: string, year: string, search?: string): Promise<{
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
    getPayslipsList(req: any, month: string, year: string, search?: string): Promise<({
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
        netTotal: number;
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
        grossRevenue: number;
        createdAt: Date;
        updatedAt: Date;
    })[]>;
    getPayslip(req: any, riderId: string, month: string, year: string): Promise<{
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
            netTotal: number;
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
    updatePayslip(id: string, dto: UpdatePayslipDto): Promise<{
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
        netTotal: number;
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
        grossRevenue: number;
        createdAt: Date;
        updatedAt: Date;
    }>;
    generateAll(req: any, month: any, year: any): Promise<{
        success: boolean;
        count: number;
        message: string;
    }>;
    sendEmail(id: string): Promise<{
        success: boolean;
    }>;
    sendAllEmails(req: any, month: any, year: any): Promise<{
        total: number;
        sent: number;
        failed: number;
        errors: string[];
    }>;
}

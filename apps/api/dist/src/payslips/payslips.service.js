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
Object.defineProperty(exports, "__esModule", { value: true });
exports.PayslipsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const mail_service_1 = require("../mail/mail.service");
let PayslipsService = class PayslipsService {
    prisma;
    mailService;
    constructor(prisma, mailService) {
        this.prisma = prisma;
        this.mailService = mailService;
    }
    async sendPayslipEmail(id) {
        const payslip = await this.prisma.payslip.findUnique({
            where: { id },
            include: { rider: true },
        });
        if (!payslip)
            throw new common_1.NotFoundException('Payslip not found');
        if (!payslip.rider.email) {
            throw new common_1.BadRequestException(`Rider ${payslip.rider.riderName} does not have an email associated.`);
        }
        return this.mailService.sendPayslipEmail(payslip.rider.email, payslip.rider.riderName, payslip.month, payslip.year, {
            grossAmount: payslip.grossAmount,
            deductions: payslip.deductions + payslip.salesCash + payslip.carRent + payslip.akama + payslip.fine + payslip.bankDeduction,
            netTotal: payslip.netTotal,
        });
    }
    async sendBulkEmails(tenantId, month, year) {
        const slips = await this.prisma.payslip.findMany({
            where: { tenantId, month, year, rider: { email: { not: null } } },
            include: { rider: true },
        });
        const results = {
            total: slips.length,
            sent: 0,
            failed: 0,
            errors: [],
        };
        for (const slip of slips) {
            try {
                await this.mailService.sendPayslipEmail(slip.rider.email, slip.rider.riderName, slip.month, slip.year, {
                    grossAmount: slip.grossAmount,
                    deductions: slip.deductions + slip.salesCash + slip.carRent + slip.akama + slip.fine + slip.bankDeduction,
                    netTotal: slip.netTotal,
                });
                results.sent++;
            }
            catch (error) {
                results.failed++;
                results.errors.push(`Failed for ${slip.rider.riderName}: ${error.message}`);
            }
        }
        return results;
    }
    async getDashboard(tenantId, month, year, search) {
        console.log(`[PayslipsService] Fetching dashboard for month: ${month}, year: ${year}, search: ${search}`);
        if (!month || !year) {
            console.warn('[PayslipsService] Missing month or year');
            return { slips: [], summary: {} };
        }
        const where = { tenantId, month, year };
        if (search) {
            where.OR = [
                { rider: { riderId: { contains: search, mode: 'insensitive' } } },
                { rider: { riderName: { contains: search, mode: 'insensitive' } } },
            ];
        }
        const [aggregates, recentActivitySlips] = await Promise.all([
            this.prisma.payslip.aggregate({
                where,
                _sum: { netTotal: true },
                _count: { id: true },
            }),
            this.prisma.payslip.findMany({
                where: { tenantId },
                orderBy: { updatedAt: 'desc' },
                take: 5,
                include: { rider: true }
            })
        ]);
        const totalPayroll = aggregates._sum.netTotal || 0;
        const activeSlipsCount = aggregates._count.id || 0;
        const prevMonth = month === 1 ? 12 : month - 1;
        const prevYear = month === 1 ? year - 1 : year;
        const prevAggregates = await this.prisma.payslip.aggregate({
            where: { tenantId, month: prevMonth, year: prevYear },
            _sum: { netTotal: true }
        });
        const prevTotalPayroll = prevAggregates._sum.netTotal || 0;
        const growth = prevTotalPayroll === 0 ? 100 : ((totalPayroll - prevTotalPayroll) / prevTotalPayroll) * 100;
        const recentActivity = recentActivitySlips.map(s => ({
            id: s.id,
            type: 'PAYSLIP_GENERATED',
            title: `Payslip generated for ${s.rider.riderName}`,
            description: `Amount: ${s.netTotal}`,
            timestamp: s.updatedAt,
        }));
        return {
            slipsCount: activeSlipsCount,
            summary: {
                totalPayout: totalPayroll,
                totalRiders: activeSlipsCount,
                completed: 0,
                payoutGrowth: parseFloat(growth.toFixed(1)),
            },
            recentActivity,
        };
    }
    async getPayslipsList(tenantId, month, year, search) {
        const where = { tenantId, month, year };
        if (search) {
            where.OR = [
                { rider: { riderId: { contains: search, mode: 'insensitive' } } },
                { rider: { riderName: { contains: search, mode: 'insensitive' } } },
            ];
        }
        const slips = await this.prisma.payslip.findMany({
            where,
            include: {
                rider: true,
            },
            orderBy: { updatedAt: 'desc' }
        });
        return slips;
    }
    async generateAllPayslips(tenantId, month, year) {
        const riders = await this.prisma.rider.findMany({
            where: { tenantId }
        });
        console.log(`Generating/Syncing slips for ${riders.length} riders for ${month}/${year}`);
        const results = [];
        for (const rider of riders) {
            try {
                const payslip = await this.prisma.payslip.upsert({
                    where: {
                        tenantId_riderId_month_year: { tenantId, riderId: rider.id, month, year }
                    },
                    update: {},
                    create: {
                        tenantId,
                        riderId: rider.id,
                        month,
                        year,
                        status: 'DRAFT'
                    }
                });
                const synced = await this.syncPayslip(tenantId, rider.id, month, year);
                results.push(synced);
            }
            catch (err) {
                console.error(`Error processing rider ${rider.riderId}:`, err.message);
            }
        }
        return {
            success: true,
            count: riders.length,
            message: `Successfully processed ${riders.length} slips.`
        };
    }
    async getPayslip(tenantId, riderId, month, year) {
        const payslip = await this.prisma.payslip.findUnique({
            where: {
                tenantId_riderId_month_year: { tenantId, riderId, month, year },
            },
            include: {
                rider: true,
            },
        });
        if (!payslip) {
            throw new common_1.NotFoundException('Payslip not found');
        }
        const entries = await this.prisma.dailyEntry.findMany({
            where: {
                riderId,
                payrollMonth: month,
                payrollYear: year,
            },
            orderBy: { date: 'asc' },
            include: {
                batch: true,
            },
        });
        return {
            payslip,
            entries,
        };
    }
    async update(id, dto) {
        const payslip = await this.prisma.payslip.findUnique({ where: { id } });
        if (!payslip)
            throw new common_1.NotFoundException('Payslip not found');
        const updated = await this.prisma.payslip.update({
            where: { id },
            data: dto,
        });
        const netTotal = updated.grossAmount + updated.bonus
            - (updated.deductions + updated.salesCash + updated.carRent + updated.akama + updated.fine + updated.bankDeduction);
        return this.prisma.payslip.update({
            where: { id },
            data: { netTotal },
            include: { rider: true },
        });
    }
    async syncPayslip(tenantId, riderId, month, year) {
        const entries = await this.prisma.dailyEntry.findMany({
            where: {
                riderId: riderId,
                payrollMonth: month,
                payrollYear: year,
            },
        });
        let totalSingle = 0;
        let totalDouble = 0;
        let grossTotal = 0;
        let grossRevenue = 0;
        for (const e of entries) {
            totalSingle += e.singleOrders;
            totalDouble += e.doubleOrders;
            grossTotal += e.dailyAmount;
            grossRevenue += e.companyAmount || 0;
        }
        const payslip = await this.prisma.payslip.findUnique({
            where: { tenantId_riderId_month_year: { tenantId, riderId, month, year } },
        });
        if (!payslip)
            return null;
        const bonus = payslip.bonus || 0;
        const deductions = payslip.deductions || 0;
        const salesCash = payslip.salesCash || 0;
        const carRent = payslip.carRent || 0;
        const akama = payslip.akama || 0;
        const fine = payslip.fine || 0;
        const bankDeduction = payslip.bankDeduction || 0;
        const netTotal = grossTotal + bonus
            - (deductions + salesCash + carRent + akama + fine + bankDeduction);
        return this.prisma.payslip.update({
            where: { id: payslip.id },
            data: {
                totalSingleOrders: totalSingle,
                totalDoubleOrders: totalDouble,
                grossAmount: grossTotal,
                grossRevenue: grossRevenue,
                netTotal: netTotal,
            },
            include: { rider: true }
        });
    }
};
exports.PayslipsService = PayslipsService;
exports.PayslipsService = PayslipsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        mail_service_1.MailService])
], PayslipsService);
//# sourceMappingURL=payslips.service.js.map
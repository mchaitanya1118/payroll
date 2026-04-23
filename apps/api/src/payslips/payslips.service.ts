import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';

@Injectable()
export class PayslipsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
  ) {}

  async sendPayslipEmail(id: string) {
    const payslip = await this.prisma.payslip.findUnique({
      where: { id },
      include: { rider: true },
    });

    if (!payslip) throw new NotFoundException('Payslip not found');
    if (!payslip.rider.email) {
      throw new BadRequestException(`Rider ${payslip.rider.riderName} does not have an email associated.`);
    }

    return this.mailService.sendPayslipEmail(
      payslip.rider.email,
      payslip.rider.riderName,
      payslip.month,
      payslip.year,
      {
        grossAmount: payslip.grossAmount,
        deductions: payslip.deductions + payslip.salesCash + payslip.carRent + payslip.akama + payslip.fine + payslip.bankDeduction,
        netTotal: payslip.netTotal,
      },
    );
  }

  async sendBulkEmails(tenantId: string, month: number, year: number) {
    const slips = await this.prisma.payslip.findMany({
      where: { tenantId, month, year, rider: { email: { not: null } } },
      include: { rider: true },
    });

    const results = {
      total: slips.length,
      sent: 0,
      failed: 0,
      errors: [] as string[],
    };

    for (const slip of slips) {
      try {
        await this.mailService.sendPayslipEmail(
          slip.rider.email!,
          slip.rider.riderName,
          slip.month,
          slip.year,
          {
            grossAmount: slip.grossAmount,
            deductions: slip.deductions + slip.salesCash + slip.carRent + slip.akama + slip.fine + slip.bankDeduction,
            netTotal: slip.netTotal,
          },
        );
        results.sent++;
      } catch (error) {
        results.failed++;
        results.errors.push(`Failed for ${slip.rider.riderName}: ${error.message}`);
      }
    }

    return results;
  }

  async getDashboard(
    tenantId: string,
    month: number,
    year: number,
    search?: string,
  ) {
    console.log(`[PayslipsService] Fetching dashboard for month: ${month}, year: ${year}, search: ${search}`);
    if (!month || !year) {
      console.warn('[PayslipsService] Missing month or year');
      return { slips: [], summary: {} };
    }

    const where: any = { tenantId, month, year };

    if (search) {
      where.OR = [
        { rider: { riderId: { contains: search, mode: 'insensitive' } } },
        { rider: { riderName: { contains: search, mode: 'insensitive' } } },
      ];
    }

    // 1. Fetch current month's aggregates
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

    // 2. Fetch previous month's total for growth calculation
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
      slipsCount: activeSlipsCount, // Changed from slips array to count
      summary: {
        totalPayout: totalPayroll,
        totalRiders: activeSlipsCount,
        completed: 0, // This would require another aggregate for status='FINAL'
        payoutGrowth: parseFloat(growth.toFixed(1)),
      },
      recentActivity,
    };
  }

  async getPayslipsList(
    tenantId: string,
    month: number,
    year: number,
    search?: string,
  ) {
    const where: any = { tenantId, month, year };

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


  async generateAllPayslips(tenantId: string, month: number, year: number) {
    // 1. Get all riders
    const riders = await this.prisma.rider.findMany({
      where: { tenantId }
    });

    console.log(`Generating/Syncing slips for ${riders.length} riders for ${month}/${year}`);

    const results: any[] = [];

    for (const rider of riders) {
      try {
        // 2. Ensure slip exists
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

        // 3. Sync it
        const synced = await this.syncPayslip(tenantId, rider.id, month, year);
        results.push(synced);
      } catch (err: any) {
        console.error(`Error processing rider ${rider.riderId}:`, err.message);
      }
    }

    return {
      success: true,
      count: riders.length,
      message: `Successfully processed ${riders.length} slips.`
    };
  }

  async getPayslip(
    tenantId: string,
    riderId: string,
    month: number,
    year: number,
  ) {
    // 1. Fetch Payslip summary
    const payslip = await this.prisma.payslip.findUnique({
      where: {
        tenantId_riderId_month_year: { tenantId, riderId, month, year },
      },
      include: {
        rider: true,
      },
    });

    if (!payslip) {
      throw new NotFoundException('Payslip not found');
    }

    // 2. Fetch all daily entries for that month/year (Rule B)
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

  async update(id: string, dto: any) {
    const payslip = await this.prisma.payslip.findUnique({ where: { id } });
    if (!payslip) throw new NotFoundException('Payslip not found');

    const updated = await this.prisma.payslip.update({
      where: { id },
      data: dto,
    });

    // Recalculate net total
    const netTotal = updated.grossAmount + updated.bonus 
      - (updated.deductions + updated.salesCash + updated.carRent + updated.akama + updated.fine + updated.bankDeduction);

    return this.prisma.payslip.update({
      where: { id },
      data: { netTotal },
      include: { rider: true },
    });
  }

  // function to sync payslip totals
  async syncPayslip(
    tenantId: string,
    riderId: string,
    month: number,
    year: number,
    ) {
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

    if (!payslip) return null;

    const bonus = payslip.bonus || 0;
    const deductions = payslip.deductions || 0;
    const salesCash = payslip.salesCash || 0;
    const carRent = payslip.carRent || 0;
    const akama = payslip.akama || 0;
    const fine = payslip.fine || 0;
    const bankDeduction = payslip.bankDeduction || 0;

    // netTotal = gross + bonus - (all other deductions)
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
}

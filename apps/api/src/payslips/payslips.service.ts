import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { MailService } from "../mail/mail.service";

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

    if (!payslip) throw new NotFoundException("Payslip not found");
    if (!payslip.rider.email) {
      throw new BadRequestException(
        `Rider ${payslip.rider.riderName} does not have an email associated.`,
      );
    }

    return this.mailService.sendPayslipEmail(
      payslip.rider.email,
      payslip.rider.riderName,
      payslip.month,
      payslip.year,
      {
        grossAmount: payslip.grossAmount,
        deductions:
          payslip.deductions +
          payslip.salesCash +
          payslip.carRent +
          payslip.akama +
          payslip.fine +
          payslip.bankDeduction,
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
            deductions:
              slip.deductions +
              slip.salesCash +
              slip.carRent +
              slip.akama +
              slip.fine +
              slip.bankDeduction,
            netTotal: slip.netTotal,
          },
        );
        results.sent++;
      } catch (error) {
        results.failed++;
        results.errors.push(
          `Failed for ${slip.rider.riderName}: ${error.message}`,
        );
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
    console.log(
      `[PayslipsService] Fetching dashboard for month: ${month}, year: ${year}, search: ${search}`,
    );
    if (!month || !year) {
      console.warn("[PayslipsService] Missing month or year");
      return { slips: [], summary: {} };
    }

    const where: any = { tenantId, month, year };

    if (search) {
      where.OR = [
        { rider: { riderId: { contains: search, mode: "insensitive" } } },
        { rider: { riderName: { contains: search, mode: "insensitive" } } },
      ];
    }

    // 1. Fetch aggregations and recent activity in parallel
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;

    const [currentStats, prevStats, recentActivitySlips, activeSlipsCount] = await Promise.all([
      this.prisma.payslip.aggregate({
        where: { tenantId, month, year },
        _sum: { netTotal: true },
      }),
      this.prisma.payslip.aggregate({
        where: { tenantId, month: prevMonth, year: prevYear },
        _sum: { netTotal: true },
      }),
      this.prisma.payslip.findMany({
        where: { tenantId },
        orderBy: { updatedAt: "desc" },
        take: 5,
        include: { rider: true },
      }),
      this.prisma.payslip.count({
        where: { tenantId, month, year },
      }),
    ]);

    const totalPayroll = currentStats._sum.netTotal || 0;
    const prevTotalPayroll = prevStats._sum.netTotal || 0;

    const growth =
      prevTotalPayroll === 0
        ? 100
        : ((totalPayroll - prevTotalPayroll) / prevTotalPayroll) * 100;

    const recentActivity = recentActivitySlips.map((s) => ({
      id: s.id,
      type: "PAYSLIP_GENERATED",
      title: `Payslip generated for ${s.rider.riderName}`,
      description: `Amount: ${s.netTotal}`,
      timestamp: s.updatedAt,
    }));

    // For dominant structure, we still need a count per rateType. 
    // We can do this with a groupBy or another count if needed.
    // For now, let's just use the activeSlipsCount for simple insights.
    const efficiencyGrowth = Math.abs(parseFloat(growth.toFixed(1)));
    
    // Efficiently get counts for insights
    const [targetCount, noTargetCount, maxNetTotal] = await Promise.all([
      this.prisma.payslip.count({
        where: { tenantId, month, year, rider: { rateType: "TARGET" } },
      }),
      this.prisma.payslip.count({
        where: { tenantId, month, year, rider: { rateType: "NO_TARGET" } },
      }),
      this.prisma.payslip.aggregate({
        where: { tenantId, month, year },
        _max: { netTotal: true },
      }),
    ]);

    const dominantStructure = targetCount > noTargetCount ? "Target-based" : "Order-based";
    const avgSalary = activeSlipsCount > 0 ? (totalPayroll / activeSlipsCount) : 0;
    const topEarner = maxNetTotal._max.netTotal || 0;

    return {
      slipsCount: activeSlipsCount,
      summary: {
        totalPayout: totalPayroll,
        totalRiders: activeSlipsCount,
        completed: 0,
        payoutGrowth: parseFloat(growth.toFixed(1)),
      },
      recentActivity,
      insights: {
        efficiencyGrowth,
        dominantStructure,
        avgSalary,
        topEarner,
      },
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
        { rider: { riderId: { contains: search, mode: "insensitive" } } },
        { rider: { riderName: { contains: search, mode: "insensitive" } } },
      ];
    }

    const slips = await this.prisma.payslip.findMany({
      where,
      include: {
        rider: true,
      },
      orderBy: { updatedAt: "desc" },
    });

    return slips;
  }

  async generateAllPayslips(tenantId: string, month: number, year: number) {
    console.log(`[BulkSync] Starting bulk generation for ${month}/${year}`);
    const startTime = Date.now();

    // 1. Pre-fetch ALL necessary data in parallel
    const [riders, rateConfigs, entries, existingSlips, batches] = await Promise.all([
      this.prisma.rider.findMany({ where: { tenantId } }),
      this.prisma.rateConfig.findMany({ where: { tenantId } }),
      this.prisma.dailyEntry.findMany({
        where: {
          rider: { tenantId },
          payrollMonth: month,
          payrollYear: year,
        },
      }),
      this.prisma.payslip.findMany({
        where: { tenantId, month, year },
      }),
      this.prisma.batch.findMany({ where: { tenantId } }),
    ]);

    // 2. Map data for quick lookup
    const slipsMap = new Map(existingSlips.map((s) => [s.riderId, s]));
    const ridersMap = new Map(riders.map((r) => [r.id, r]));
    const entriesByRider = new Map<string, any[]>();
    for (const entry of entries) {
      if (!entriesByRider.has(entry.riderId)) entriesByRider.set(entry.riderId, []);
      entriesByRider.get(entry.riderId)!.push(entry);
    }

    // 3. Prepare updates
    const operations: any[] = [];

    for (const rider of riders) {
      const riderEntries = entriesByRider.get(rider.id) || [];
      const existingSlip = slipsMap.get(rider.id);

      // Totals
      let totalSingle = 0;
      let totalDouble = 0;
      let grossTotal = 0;
      let grossRevenue = 0;

      for (const e of riderEntries) {
        totalSingle += e.singleOrders;
        totalDouble += e.doubleOrders;
        grossTotal += e.dailyAmount;
        grossRevenue += e.companyAmount || 0;
      }

      // Base values from existing slip or defaults
      const bonus = existingSlip?.bonus || 0;
      const deductions = existingSlip?.deductions || 0;
      const salesCash = existingSlip?.salesCash || 0;
      const carRent = existingSlip?.carRent || 0;
      const akama = existingSlip?.akama || 0;
      const fine = existingSlip?.fine || 0;
      const bankDeduction = existingSlip?.bankDeduction || 0;

      const netTotal =
        grossTotal +
        bonus -
        (deductions + salesCash + carRent + akama + fine + bankDeduction);

      // Target Achievement logic (optimized)
      let targetOrders = 0;
      let targetAchieved = false;

      if (rider.rateType === "TARGET" && riderEntries.length > 0) {
        const sampleEntry = riderEntries[0];
        const batch = batches.find(b => b.id === sampleEntry.batchId);
        
        if (batch) {
          const rateConfig = rateConfigs.find(rc => 
            rc.batchNumber === batch.batchNumber && 
            rc.vehicleType === rider.vehicleType && 
            rc.rateType === "TARGET"
          );
          if (rateConfig) {
            targetOrders = rateConfig.targetCount;
            targetAchieved = (totalSingle + totalDouble) >= targetOrders;
          }
        }
      }

      const data = {
        totalSingleOrders: totalSingle,
        totalDoubleOrders: totalDouble,
        grossAmount: grossTotal,
        grossRevenue: grossRevenue,
        netTotal: netTotal,
        targetOrders,
        targetAchieved,
      };

      if (existingSlip) {
        operations.push(
          this.prisma.payslip.update({
            where: { id: existingSlip.id },
            data,
          }),
        );
      } else {
        operations.push(
          this.prisma.payslip.create({
            data: {
              ...data,
              tenantId,
              riderId: rider.id,
              month,
              year,
              status: "DRAFT",
            },
          }),
        );
      }
    }

    // 4. Execute all in a transaction
    await this.prisma.$transaction(operations);

    const duration = (Date.now() - startTime) / 1000;
    console.log(`[BulkSync] Processed ${riders.length} riders in ${duration}s`);

    return {
      success: true,
      count: riders.length,
      message: `Successfully processed ${riders.length} slips in ${duration}s.`,
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
      throw new NotFoundException("Payslip not found");
    }

    // 2. Fetch all daily entries for that month/year (Rule B)
    const entries = await this.prisma.dailyEntry.findMany({
      where: {
        riderId,
        payrollMonth: month,
        payrollYear: year,
      },
      orderBy: { date: "asc" },
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
    if (!payslip) throw new NotFoundException("Payslip not found");

    const updated = await this.prisma.payslip.update({
      where: { id },
      data: dto,
    });

    // Recalculate net total
    const netTotal =
      updated.grossAmount +
      updated.bonus -
      (updated.deductions +
        updated.salesCash +
        updated.carRent +
        updated.akama +
        updated.fine +
        updated.bankDeduction);

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
      where: {
        tenantId_riderId_month_year: { tenantId, riderId, month, year },
      },
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
    const netTotal =
      grossTotal +
      bonus -
      (deductions + salesCash + carRent + akama + fine + bankDeduction);

    // Calculate Target Achievement
    let targetOrders = 0;
    let targetAchieved = false;

    try {
      if (entries.length > 0) {
        const sampleEntry = entries[0];
        const rider = await this.prisma.rider.findUnique({
          where: { id: riderId },
        });

        if (rider && rider.rateType === "TARGET") {
          // Get batch number from the sample entry
          const batch = await this.prisma.batch.findUnique({
            where: { id: sampleEntry.batchId },
          });

          if (batch) {
            const rateConfig = await this.prisma.rateConfig.findFirst({
              where: {
                tenantId,
                batchNumber: batch.batchNumber,
                vehicleType: rider.vehicleType,
                rateType: "TARGET",
              },
            });
            if (rateConfig) {
              targetOrders = rateConfig.targetCount;
              targetAchieved =
                (totalSingle || 0) + (totalDouble || 0) >= targetOrders;
            }
          }
        }
      }
    } catch (e) {
      console.warn(
        `[SyncPayslip] Target calculation failed for rider ${riderId}:`,
        e.message,
      );
    }

    return this.prisma.payslip.update({
      where: { id: payslip.id },
      data: {
        totalSingleOrders: totalSingle,
        totalDoubleOrders: totalDouble,
        grossAmount: grossTotal,
        grossRevenue: grossRevenue,
        netTotal: netTotal,
        targetOrders,
        targetAchieved,
      },
      include: { rider: true },
    });
  }
}

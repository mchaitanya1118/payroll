import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { MailService } from "../mail/mail.service";
import * as XLSX from 'xlsx';

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
    companyCode?: string,
  ) {
    console.log(
      `[PayslipsService] Fetching dashboard for month: ${month}, year: ${year}, search: ${search}, company: ${companyCode}`,
    );
    if (!month || !year) {
      console.warn("[PayslipsService] Missing month or year");
      return { slips: [], summary: {} };
    }

    const where: any = { tenantId, month, year };

    if (companyCode) {
      where.rider = { companyCode };
    }

    if (search) {
      const searchFilter = [
        { rider: { riderId: { contains: search, mode: "insensitive" } } },
        { rider: { riderName: { contains: search, mode: "insensitive" } } },
      ];
      if (where.rider) {
        // If companyCode is already filtering by rider, we need to merge the search
        where.AND = [
          { rider: where.rider },
          { OR: searchFilter }
        ];
        delete where.rider;
      } else {
        where.OR = searchFilter;
      }
    }

    // 1. Fetch aggregations and recent activity in parallel
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;

    const [currentStats, prevStats, recentActivitySlips, activeSlipsCount] = await Promise.all([
      this.prisma.payslip.aggregate({
        where,
        _sum: { netTotal: true },
      }),
      this.prisma.payslip.aggregate({
        where: { ...where, month: prevMonth, year: prevYear },
        _sum: { netTotal: true },
      }),
      this.prisma.payslip.findMany({
        where: { tenantId, rider: companyCode ? { companyCode } : undefined },
        orderBy: { updatedAt: "desc" },
        take: 5,
        include: { rider: true },
      }),
      this.prisma.payslip.count({
        where,
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
        where: { ...where, rider: { ...where.rider, rateType: "TARGET" } },
      }),
      this.prisma.payslip.count({
        where: { ...where, rider: { ...where.rider, rateType: "NO_TARGET" } },
      }),
      this.prisma.payslip.aggregate({
        where,
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
    companyCode?: string,
  ) {
    const where: any = { tenantId, month, year };

    if (companyCode) {
      where.rider = { companyCode };
    }

    if (search) {
      const searchFilter = [
        { rider: { riderId: { contains: search, mode: "insensitive" } } },
        { rider: { riderName: { contains: search, mode: "insensitive" } } },
      ];
      if (where.rider) {
        where.AND = [
          { rider: where.rider },
          { OR: searchFilter }
        ];
        delete where.rider;
      } else {
        where.OR = searchFilter;
      }
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
    riderIdRaw: string,
    month: number,
    year: number,
  ) {
    // 1. Resolve rider - try Pilot ID first, then fallback to internal ID
    let rider = await this.prisma.rider.findUnique({
      where: { tenantId_riderId: { tenantId, riderId: riderIdRaw } }
    });

    if (!rider) {
      rider = await this.prisma.rider.findUnique({
        where: { id: riderIdRaw }
      });
    }

    if (!rider) {
      throw new NotFoundException(`Rider with ID ${riderIdRaw} not found`);
    }

    const riderId = rider.id;

    // 2. Fetch Payslip summary
    let payslip = await this.prisma.payslip.findUnique({
      where: {
        tenantId_riderId_month_year: { tenantId, riderId, month, year },
      },
      include: {
        rider: {
          include: {
            advances: {
              where: { balance: { gt: 0 } }
            }
          }
        },
      },
    });

    // 2.1 If no payslip exists but rider does, auto-create a DRAFT record
    if (!payslip) {
      console.log(`[getPayslip] Auto-creating DRAFT payslip for rider ${rider.riderName} (${month}/${year})`);
      payslip = await this.prisma.payslip.create({
        data: {
          tenantId,
          riderId,
          month,
          year,
          status: "DRAFT",
          netTotal: 0,
        },
        include: {
          rider: {
            include: {
              advances: {
                where: { balance: { gt: 0 } }
              }
            }
          },
        },
      });
    }

    // 3. Fetch all daily entries for that month/year (Rule B)
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

    const oldAdvanceDeduction = payslip.advanceDeduction || 0;
    const newAdvanceDeduction = dto.advanceDeduction !== undefined ? dto.advanceDeduction : oldAdvanceDeduction;

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
        updated.bankDeduction +
        updated.advanceDeduction);

    const finalPayslip = await this.prisma.payslip.update({
      where: { id },
      data: { netTotal },
      include: { rider: true },
    });

    // Update Advance Balances if deduction changed
    if (newAdvanceDeduction !== oldAdvanceDeduction) {
      const diff = newAdvanceDeduction - oldAdvanceDeduction;
      await this.updateAdvanceBalances(payslip.riderId, payslip.tenantId, diff);
    }

    return finalPayslip;
  }

  private async updateAdvanceBalances(riderId: string, tenantId: string, amount: number) {
    if (amount > 0) {
      // Deduct from balance (FIFO)
      const activeAdvances = await this.prisma.advance.findMany({
        where: { riderId, tenantId, balance: { gt: 0 } },
        orderBy: { createdAt: 'asc' }
      });

      let remainingToDeduct = amount;
      for (const adv of activeAdvances) {
        if (remainingToDeduct <= 0) break;
        const deduction = Math.min(adv.balance, remainingToDeduct);
        await this.prisma.advance.update({
          where: { id: adv.id },
          data: { balance: adv.balance - deduction }
        });
        remainingToDeduct -= deduction;
      }
    } else if (amount < 0) {
      // Add back to balance (LIFO)
      const lastAdvances = await this.prisma.advance.findMany({
        where: { riderId, tenantId },
        orderBy: { createdAt: 'desc' }
      });

      let remainingToAdd = Math.abs(amount);
      for (const adv of lastAdvances) {
        if (remainingToAdd <= 0) break;
        const room = adv.amount - adv.balance;
        const addition = Math.min(room, remainingToAdd);
        await this.prisma.advance.update({
          where: { id: adv.id },
          data: { balance: adv.balance + addition }
        });
        remainingToAdd -= addition;
      }
    }
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

  async getAdjustedSlips(tenantId: string, month: number, year: number, companyCode?: string) {
    try {
      console.log(`[getAdjustedSlips] params: tenantId=${tenantId}, month=${month}, year=${year}, company=${companyCode}`);
      
      const where: any = {
        tenantId,
        month,
        year,
        OR: [
          { salesCash: { gt: 0 } },
          { carRent: { gt: 0 } },
          { akama: { gt: 0 } },
          { fine: { gt: 0 } },
          { deductions: { gt: 0 } },
          { bonus: { gt: 0 } },
          { bankDeduction: { gt: 0 } },
          { advanceDeduction: { gt: 0 } },
        ]
      };

      if (companyCode) {
        where.rider = { companyCode };
      }

      return await this.prisma.payslip.findMany({
        where,
        include: { rider: true },
        orderBy: { updatedAt: 'desc' }
      });
    } catch (error) {
      console.error('[getAdjustedSlips] Error:', error);
      throw error;
    }
  }

  async exportAdjustments(tenantId: string, month: number, year: number) {
    const slips = await this.prisma.payslip.findMany({
      where: { tenantId, month, year },
      include: { rider: true }
    });

    const data = slips.map(s => ({
      'Pilot ID': s.rider.riderId,
      'Name': s.rider.riderName,
      'Company': s.rider.companyCode || 'N/A',
      'Month': s.month,
      'Year': s.year,
      'Sales Cash': s.salesCash,
      'Car Rent': s.carRent,
      'Akama': s.akama,
      'Fine': s.fine,
      'Deduction': s.deductions,
      'Bonus': s.bonus,
      'Bank': s.bankDeduction,
      'Advance': s.advanceDeduction
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, 'Adjustments');
    return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  }

  async importAdjustments(tenantId: string, fileBuffer: Buffer) {
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet);

    let count = 0;
    for (const row of rows as any[]) {
      const pilotId = row['Pilot ID']?.toString();
      const month = parseInt(row['Month']);
      const year = parseInt(row['Year']);

      if (!pilotId || isNaN(month) || isNaN(year)) continue;

      const rider = await this.prisma.rider.findUnique({
        where: { tenantId_riderId: { tenantId, riderId: pilotId } }
      });

      if (!rider) continue;

      const payslip = await this.prisma.payslip.findUnique({
        where: { tenantId_riderId_month_year: { tenantId, riderId: rider.id, month, year } }
      });

      if (!payslip) continue;

      const dto = {
        salesCash: parseFloat(row['Sales Cash']) || 0,
        carRent: parseFloat(row['Car Rent']) || 0,
        akama: parseFloat(row['Akama']) || 0,
        fine: parseFloat(row['Fine']) || 0,
        deductions: parseFloat(row['Deduction']) || 0,
        bonus: parseFloat(row['Bonus']) || 0,
        bankDeduction: parseFloat(row['Bank']) || 0,
        advanceDeduction: parseFloat(row['Advance']) || 0,
      };

      await this.update(payslip.id, dto);
      count++;
    }

    return { success: true, count, message: `Successfully updated ${count} records.` };
  }
}

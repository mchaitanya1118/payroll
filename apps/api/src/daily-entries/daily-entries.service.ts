import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PayslipsService } from '../payslips/payslips.service';
import { RatesService } from '../rates/rates.service';

@Injectable()
export class DailyEntriesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly payslipsService: PayslipsService,
    private readonly ratesService: RatesService,
  ) {}

  async getMonthlyGrid(tenantId: string, month: number, year: number, companyCode?: string) {
    // 1. Fetch Riders
    const riderWhere: any = { tenantId };
    if (companyCode && companyCode !== 'ALL') {
      riderWhere.companyCode = companyCode;
    }

    const riders = await this.prisma.rider.findMany({
      where: riderWhere,
      orderBy: [
        { nationality: 'asc' },
        { riderName: 'asc' }
      ]
    });

    // 2. Fetch Daily Entries
    const m = Number(month);
    const y = Number(year);
    const startDate = new Date(Date.UTC(y, m - 1, 1));
    const endDate = new Date(Date.UTC(y, m, 0, 23, 59, 59, 999));

    const entries = await this.prisma.dailyEntry.findMany({
      where: {
        rider: { tenantId },
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    // 3. Organize entries by riderId and date
    const entryMap = new Map<string, any>();
    entries.forEach(entry => {
      const dateKey = entry.date.toISOString().split('T')[0];
      const key = `${entry.riderId}_${dateKey}`;
      entryMap.set(key, entry);
    });

    return {
      riders,
      entryMap: Object.fromEntries(entryMap),
      daysInMonth: endDate.getUTCDate(),
    };
  }

  async bulkUpdate(tenantId: string, updates: any[]) {
    if (!updates || updates.length === 0) return { success: true };
    
    // 1. Pre-fetch all involved riders to verify ownership and get types
    const riderIds = [...new Set(updates.map(u => u.riderId))];
    const riders = await this.prisma.rider.findMany({
      where: { 
        id: { in: riderIds },
        tenantId 
      }
    });
    const riderMap = new Map(riders.map(r => [r.id, r]));

    // 2. Pre-fetch group rates for involved groups
    const groupIds = [...new Set(riders.map(r => r.groupId).filter(Boolean))] as string[];
    const groupRates = groupIds.length > 0 ? await this.prisma.groupRate.findMany({
      where: { groupId: { in: groupIds } }
    }) : [];

    // 3. Pre-fetch all rate configs for the tenant
    const rateConfigs = await this.prisma.rateConfig.findMany({
      where: { tenantId }
    });

    // 4. Pre-fetch batches for the tenant
    const batches = await this.prisma.batch.findMany({
      where: { tenantId }
    });
    const latestBatch = batches.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];

    const payslipsToSync = new Set<string>();

    // Use a transaction for better integrity
    await this.prisma.$transaction(async (tx) => {
      for (const update of updates) {
        const { riderId, date, status, orders, cashCollected } = update;
        const entryDate = new Date(date);
        const rider = riderMap.get(riderId);

        // Security check: skip if rider doesn't belong to this tenant
        if (!rider) continue;

        // Determine Batch
        let batchId: string | null = null;
        let batchNumber = 0;

        if (!rider.groupId) {
           // For non-group riders, we need a batch. 
           // In manual grid mode, we'll try to find if an entry already exists or use the latest batch
           const existing = await tx.dailyEntry.findUnique({
             where: { riderId_date: { riderId, date: entryDate } }
           });
           
           if (existing?.batchId) {
             batchId = existing.batchId;
             const b = batches.find(bx => bx.id === batchId);
             batchNumber = b?.batchNumber || 0;
           } else if (latestBatch) {
             batchId = latestBatch.id;
             batchNumber = latestBatch.batchNumber;
           }
        }

        // Calculate Rates
        let riderRateSingle = 0;
        let companyRateSingle = 0;

        if (rider.groupId) {
          const gr = groupRates.find(r => 
            r.groupId === rider.groupId && 
            r.vehicleType === rider.vehicleType && 
            r.rateType === rider.rateType
          );
          if (gr) {
            riderRateSingle = gr.riderRateSingle;
            companyRateSingle = gr.companyRateSingle;
          }
        }

        if (riderRateSingle === 0) {
          const rc = rateConfigs.find(r => 
            r.batchNumber === batchNumber && 
            r.vehicleType === rider.vehicleType && 
            r.rateType === rider.rateType
          );
          riderRateSingle = rc?.riderRateSingle || 0;
          companyRateSingle = rc?.companyRateSingle || 0;
        }

        const dailyAmount = orders * riderRateSingle;
        const companyAmount = orders * companyRateSingle;

        await tx.dailyEntry.upsert({
          where: { riderId_date: { riderId, date: entryDate } },
          update: {
            status,
            orders,
            cashCollected,
            singleOrders: orders,
            dailyAmount,
            companyAmount,
            riderRateSingle,
            companyRateSingle,
            payrollMonth: entryDate.getUTCMonth() + 1,
            payrollYear: entryDate.getUTCFullYear(),
          },
          create: {
            riderId,
            date: entryDate,
            batchId,
            status,
            orders,
            cashCollected,
            singleOrders: orders,
            autoRateSingle: riderRateSingle,
            dailyAmount,
            companyAmount,
            riderRateSingle,
            companyRateSingle,
            payrollMonth: entryDate.getUTCMonth() + 1,
            payrollYear: entryDate.getUTCFullYear(),
          }
        });

        payslipsToSync.add(`${riderId}|${entryDate.getUTCMonth() + 1}|${entryDate.getUTCFullYear()}`);
      }
    });

    // Sync payslips
    for (const key of payslipsToSync) {
      const [rId, month, year] = key.split('|');
      await this.payslipsService.syncPayslip(tenantId, rId, parseInt(month), parseInt(year));
    }

    return { success: true };
  }
}

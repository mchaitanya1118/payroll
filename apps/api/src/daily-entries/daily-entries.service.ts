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
    const startDate = new Date(Date.UTC(year, month - 1, 1));
    const endDate = new Date(Date.UTC(year, month, 0));

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
    const payslipsToSync = new Set<string>();

    for (const update of updates) {
      const { riderId, date, status, orders, cashCollected } = update;
      const entryDate = new Date(date);
      
      // Fetch rider to get vehicleType and rateType for pricing
      const rider = await this.prisma.rider.findUnique({
        where: { id: riderId }
      });

      if (!rider) continue;

      // Find or create a default batch for the tenant if not provided
      // In this manual mode, we might just use a default batch or look up the latest one
      // For now, let's try to find if an entry already exists to get its batchId
      const existingEntry = await this.prisma.dailyEntry.findUnique({
        where: { riderId_date: { riderId, date: entryDate } }
      });

      let batchId = existingEntry?.batchId;
      let batchNumber = 0;

      if (!batchId) {
        // Find the most recent batch for this tenant
        const latestBatch = await this.prisma.batch.findFirst({
          where: { tenantId },
          orderBy: { createdAt: 'desc' }
        });
        if (latestBatch) {
          batchId = latestBatch.id;
          batchNumber = latestBatch.batchNumber;
        } else {
           // Create a default batch if none exists
           const newBatch = await this.prisma.batch.create({
             data: {
               tenantId,
               batchNumber: 1,
               rateSingleOrder: 0,
               rateDoubleOrder: 0
             }
           });
           batchId = newBatch.id;
           batchNumber = 1;
        }
      } else {
        const batch = await this.prisma.batch.findUnique({ where: { id: batchId } });
        batchNumber = batch?.batchNumber || 0;
      }

      // Calculate Amount based on rates
      let riderRateSingle = 0;
      let companyRateSingle = 0;

      if (rider.groupId) {
        const groupRate = await this.prisma.groupRate.findUnique({
          where: {
            groupId_vehicleType_rateType: {
              groupId: rider.groupId,
              vehicleType: rider.vehicleType,
              rateType: rider.rateType
            }
          }
        });
        if (groupRate) {
          riderRateSingle = groupRate.riderRateSingle;
          companyRateSingle = groupRate.companyRateSingle;
        }
      }

      if (riderRateSingle === 0) {
        const rateConfig = await this.ratesService.findOne(
          tenantId,
          batchNumber,
          rider.vehicleType,
          rider.rateType
        );

        riderRateSingle = rateConfig?.riderRateSingle || 0;
        companyRateSingle = rateConfig?.companyRateSingle || 0;
      }

      // In the manual grid, "orders" is treated as single orders for now
      const dailyAmount = orders * riderRateSingle;
      const companyAmount = orders * companyRateSingle;

      await this.prisma.dailyEntry.upsert({
        where: { riderId_date: { riderId, date: entryDate } },
        update: {
          status,
          orders,
          cashCollected,
          singleOrders: orders, // Sync with singleOrders
          dailyAmount,
          companyAmount,
          riderRateSingle: riderRateSingle,
          companyRateSingle: companyRateSingle,
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
          autoRateDouble: 0,
          dailyAmount,
          companyAmount,
          riderRateSingle: riderRateSingle,
          companyRateSingle: companyRateSingle,
          payrollMonth: entryDate.getUTCMonth() + 1,
          payrollYear: entryDate.getUTCFullYear(),
        }
      });

      payslipsToSync.add(`${riderId}|${entryDate.getUTCMonth() + 1}|${entryDate.getUTCFullYear()}`);
    }

    // Sync payslips
    for (const key of payslipsToSync) {
      const [rId, month, year] = key.split('|');
      await this.payslipsService.syncPayslip(tenantId, rId, parseInt(month), parseInt(year));
    }

    return { success: true };
  }
}

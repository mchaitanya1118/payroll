import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import * as xlsx from "xlsx";

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async exportPayrollExcel(tenantId: string, month: number, year: number, companyCode?: string) {
    const where: any = { tenantId, month, year };
    if (companyCode) {
      where.rider = { companyCode };
    }

    const slips = await this.prisma.payslip.findMany({
      where,
      include: { rider: true },
    });

    const data = slips.map((s) => ({
      "Rider ID": s.rider.riderId,
      "Rider Name": s.rider.riderName,
      "Vehicle Type": s.rider.vehicleType,
      "Single Orders": s.totalSingleOrders,
      "Double Orders": s.totalDoubleOrders,
      "Gross Amount": s.grossAmount,
      "Bonus": s.bonus,
      "Deductions": s.deductions,
      "Sales Cash": s.salesCash,
      "Car Rent": s.carRent,
      "Akama": s.akama,
      "Fine": s.fine,
      "Bank Deduction": s.bankDeduction,
      "Advance Deduction": s.advanceDeduction,
      "Net Total": s.netTotal,
      "Status": s.status,
    }));

    const ws = xlsx.utils.json_to_sheet(data);
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, "Payroll");
    return xlsx.write(wb, { type: "buffer", bookType: "xlsx" });
  }

  async exportRidersExcel(tenantId: string, companyCode?: string) {
    const where: any = { tenantId };
    if (companyCode) {
      where.companyCode = companyCode;
    }

    const riders = await this.prisma.rider.findMany({
      where,
    });

    const data = riders.map((r) => ({
      "Rider ID": r.riderId,
      "Rider Name": r.riderName,
      "Email": r.email || "",
      "Phone Number": r.phoneNumber || "",
      "Vehicle Type": r.vehicleType,
      "Rate Type": r.rateType,
      "Company Code": r.companyCode || "",
      "Created At": r.createdAt.toISOString(),
    }));

    const ws = xlsx.utils.json_to_sheet(data);
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, "Riders");
    return xlsx.write(wb, { type: "buffer", bookType: "xlsx" });
  }

  async getRidersReport(tenantId: string, month: number, year: number, companyCode?: string) {
    const where: any = { tenantId, month, year };
    if (companyCode) {
      where.rider = { companyCode };
    }

    const slips = await this.prisma.payslip.findMany({
      where,
      include: { rider: true },
    });

    const data = slips.map((s) => ({
      riderId: s.rider.riderId,
      riderName: s.rider.riderName,
      singleRides: s.totalSingleOrders,
      doubleRides: s.totalDoubleOrders,
      paidAmount: s.netTotal,
      profit: (s.grossRevenue || 0) - s.netTotal,
    }));

    const totals = data.reduce(
      (acc, curr) => ({
        singleRides: acc.singleRides + curr.singleRides,
        doubleRides: acc.doubleRides + curr.doubleRides,
        paidAmount: acc.paidAmount + curr.paidAmount,
        profit: acc.profit + curr.profit,
      }),
      { singleRides: 0, doubleRides: 0, paidAmount: 0, profit: 0 },
    );

    return { data, totals };
  }

  async exportPerformanceExcel(tenantId: string, month: number, year: number, companyCode?: string) {
    const report = await this.getRidersReport(tenantId, month, year, companyCode);
    
    const data = report.data.map((r) => ({
      "Rider ID": r.riderId,
      "Rider Name": r.riderName,
      "Single Rides": r.singleRides,
      "Double Rides": r.doubleRides,
      "Paid Amount": r.paidAmount,
      "Profit": r.profit,
    }));

    // Add totals row
    data.push({
      "Rider ID": "TOTALS",
      "Rider Name": "",
      "Single Rides": report.totals.singleRides,
      "Double Rides": report.totals.doubleRides,
      "Paid Amount": report.totals.paidAmount,
      "Profit": report.totals.profit,
    } as any);

    const ws = xlsx.utils.json_to_sheet(data);
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, "Performance");
    return xlsx.write(wb, { type: "buffer", bookType: "xlsx" });
  }

  async getAnalyticsSummary(tenantId: string, monthParam?: number, yearParam?: number, companyCode?: string) {
    try {
      const now = new Date();
      const currentMonth = monthParam || now.getMonth() + 1;
      const currentYear = yearParam || now.getFullYear();

      const months: { month: number; year: number }[] = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(currentYear, (currentMonth - 1) - i, 1);
        months.push({ month: d.getMonth() + 1, year: d.getFullYear() });
      }

      const monthlyTrends = await Promise.all(
        months.map(async ({ month, year }) => {
          const where: any = { tenantId, month, year };
          if (companyCode) {
            where.rider = { companyCode };
          }
          
          const slips = await this.prisma.payslip.findMany({
            where,
            select: {
              netTotal: true,
              grossRevenue: true,
            },
          });

          const revenue = slips.reduce((sum, s) => sum + (s.grossRevenue || 0), 0);
          const payout = slips.reduce((sum, s) => sum + (s.netTotal || 0), 0);

          return {
            name: new Date(year, month - 1).toLocaleString("default", {
              month: "short",
            }),
            revenue,
            payout,
            profit: revenue - payout,
          };
        }),
      );

      const riderWhere: any = { tenantId };
      if (companyCode) {
        riderWhere.companyCode = companyCode;
      }

      const riders = await this.prisma.rider.findMany({
        where: riderWhere,
        select: { vehicleType: true },
      });

      const vehicleDist = riders.reduce((acc: any, curr) => {
        acc[curr.vehicleType] = (acc[curr.vehicleType] || 0) + 1;
        return acc;
      }, {});

      const topRidersWhere: any = {
        tenantId,
        month: currentMonth,
        year: currentYear,
      };
      if (companyCode) {
        topRidersWhere.rider = { companyCode };
      }

      const topRidersSlips = await this.prisma.payslip.findMany({
        where: topRidersWhere,
        include: { rider: true },
        orderBy: { grossRevenue: "desc" },
        take: 5,
      });

      const topRiders = topRidersSlips.map((s) => ({
        name: s.rider.riderName,
        revenue: s.grossRevenue,
        payout: s.netTotal,
      }));

      // Advanced Efficiency Metrics
      const efficiencyWhere: any = { tenantId, month: currentMonth, year: currentYear };
      if (companyCode) {
        efficiencyWhere.rider = { companyCode };
      }
      const currentMonthSlips = await this.prisma.payslip.findMany({
        where: efficiencyWhere,
      });

      const totalAchieved = currentMonthSlips.filter(s => s.targetAchieved).length;
      const targetAchievementRate = currentMonthSlips.length > 0 
        ? Math.round((totalAchieved / currentMonthSlips.length) * 100) 
        : 0;

      const totalRevenue = currentMonthSlips.reduce((sum, s) => sum + (s.grossRevenue || 0), 0);
      const totalPayout = currentMonthSlips.reduce((sum, s) => sum + s.netTotal, 0);
      const totalProfit = totalRevenue - totalPayout;
      
      const avgProfitPerRider = currentMonthSlips.length > 0 
        ? Math.round(totalProfit / currentMonthSlips.length) 
        : 0;

      const operationalMargin = totalRevenue > 0 
        ? Math.round((totalProfit / totalRevenue) * 100) 
        : 0;

      return {
        monthlyTrends,
        vehicleDistribution: [
          { name: "CAR", value: vehicleDist.CAR || 0 },
          { name: "BIKE", value: vehicleDist.BIKE || 0 },
        ],
        topRiders,
        efficiency: {
          targetAchievementRate,
          avgProfitPerRider,
          operationalMargin,
          totalRevenue,
          totalProfit
        }
      };
    } catch (error) {
      console.error("[ReportsService] Analytics Error:", error);
      throw error;
    }
  }
}

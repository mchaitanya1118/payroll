import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  private escapeCsv(val: any): string {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  }

  async exportPayrollCsv(tenantId: string, month: number, year: number) {
    const slips = await this.prisma.payslip.findMany({
      where: { tenantId, month, year },
      include: { rider: true },
    });

    const headers = [
      "Rider ID",
      "Rider Name",
      "Vehicle Type",
      "Single Orders",
      "Double Orders",
      "Gross Amount",
      "Bonus",
      "Deductions",
      "Sales Cash",
      "Car Rent",
      "Akama",
      "Fine",
      "Bank Deduction",
      "Net Total",
      "Status",
    ];

    const rows = slips.map((s) => [
      s.rider.riderId,
      s.rider.riderName,
      s.rider.vehicleType,
      s.totalSingleOrders,
      s.totalDoubleOrders,
      s.grossAmount,
      s.bonus,
      s.deductions,
      s.salesCash,
      s.carRent,
      s.akama,
      s.fine,
      s.bankDeduction,
      s.netTotal,
      s.status,
    ]);

    const csvContent = [
      headers.map((h) => this.escapeCsv(h)).join(","),
      ...rows.map((row) => row.map((cell) => this.escapeCsv(cell)).join(",")),
    ].join("\n");

    return csvContent;
  }

  async exportRidersCsv(tenantId: string) {
    const riders = await this.prisma.rider.findMany({
      where: { tenantId },
    });

    const headers = [
      "Rider ID",
      "Rider Name",
      "Vehicle Type",
      "Rate Type",
      "Company Code",
      "Created At",
    ];

    const rows = riders.map((r) => [
      r.riderId,
      r.riderName,
      r.vehicleType,
      r.rateType,
      r.companyCode || "",
      r.createdAt.toISOString(),
    ]);

    const csvContent = [
      headers.map((h) => this.escapeCsv(h)).join(","),
      ...rows.map((row) => row.map((cell) => this.escapeCsv(cell)).join(",")),
    ].join("\n");

    return csvContent;
  }

  async getRidersReport(tenantId: string, month: number, year: number) {
    const slips = await this.prisma.payslip.findMany({
      where: { tenantId, month, year },
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

  async exportPerformanceCsv(tenantId: string, month: number, year: number) {
    const report = await this.getRidersReport(tenantId, month, year);
    
    const headers = [
      "Rider ID",
      "Rider Name",
      "Single Rides",
      "Double Rides",
      "Paid Amount",
      "Profit"
    ];

    const rows = report.data.map((r) => [
      r.riderId,
      r.riderName,
      r.singleRides,
      r.doubleRides,
      r.paidAmount,
      r.profit,
    ]);

    // Add totals row
    rows.push([
      "TOTALS",
      "",
      report.totals.singleRides,
      report.totals.doubleRides,
      report.totals.paidAmount,
      report.totals.profit,
    ]);

    const csvContent = [
      headers.map((h) => this.escapeCsv(h)).join(","),
      ...rows.map((row) => row.map((cell) => this.escapeCsv(cell)).join(",")),
    ].join("\n");

    return csvContent;
  }

  async getAnalyticsSummary(tenantId: string) {
    const now = new Date();
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({ month: d.getMonth() + 1, year: d.getFullYear() });
    }

    const monthlyTrends = await Promise.all(
      months.map(async ({ month, year }) => {
        const slips = await this.prisma.payslip.findMany({
          where: { tenantId, month, year },
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

    const riders = await this.prisma.rider.findMany({
      where: { tenantId },
      select: { vehicleType: true },
    });

    const vehicleDist = riders.reduce((acc: any, curr) => {
      acc[curr.vehicleType] = (acc[curr.vehicleType] || 0) + 1;
      return acc;
    }, {});

    const topRidersSlips = await this.prisma.payslip.findMany({
      where: {
        tenantId,
        month: now.getMonth() + 1,
        year: now.getFullYear(),
      },
      include: { rider: true },
      orderBy: { grossRevenue: "desc" },
      take: 5,
    });

    const topRiders = topRidersSlips.map((s) => ({
      name: s.rider.riderName,
      revenue: s.grossRevenue,
      payout: s.netTotal,
    }));

    return {
      monthlyTrends,
      vehicleDistribution: [
        { name: "CAR", value: vehicleDist.CAR || 0 },
        { name: "BIKE", value: vehicleDist.BIKE || 0 },
      ],
      topRiders,
    };
  }
}

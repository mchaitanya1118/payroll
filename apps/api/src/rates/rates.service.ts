import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import * as xlsx from "xlsx";

@Injectable()
export class RatesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(tenantId: string) {
    return this.prisma.rateConfig.findMany({
      where: { tenantId },
      orderBy: [{ batchNumber: "asc" }, { vehicleType: "asc" }],
    });
  }

  async upsert(tenantId: string, data: any) {
    const {
      batchNumber,
      vehicleType,
      rateType,
      targetCount,
      companyRateSingle,
      companyRateDouble,
      riderRateSingle,
      riderRateDouble,
    } = data;

    return this.prisma.rateConfig.upsert({
      where: {
        tenantId_batchNumber_vehicleType_rateType: {
          tenantId,
          batchNumber: Number(batchNumber),
          vehicleType,
          rateType: rateType || "TARGET",
        },
      },
      update: {
        targetCount: targetCount ? Number(targetCount) : 300,
        companyRateSingle: Number(companyRateSingle),
        companyRateDouble: Number(companyRateDouble),
        riderRateSingle: Number(riderRateSingle),
        riderRateDouble: Number(riderRateDouble),
      },
      create: {
        tenantId,
        batchNumber: Number(batchNumber),
        vehicleType,
        rateType: rateType || "TARGET",
        targetCount: targetCount ? Number(targetCount) : 300,
        companyRateSingle: Number(companyRateSingle),
        companyRateDouble: Number(companyRateDouble),
        riderRateSingle: Number(riderRateSingle),
        riderRateDouble: Number(riderRateDouble),
      },
    });
  }

  async remove(tenantId: string, id: string) {
    const config = await this.prisma.rateConfig.findUnique({ where: { id } });
    if (!config || config.tenantId !== tenantId) {
      throw new NotFoundException("Rate configuration not found");
    }

    return this.prisma.rateConfig.delete({ where: { id } });
  }

  async findOne(
    tenantId: string,
    batchNumber: number,
    vehicleType: any,
    rateType: any = "TARGET",
  ) {
    return this.prisma.rateConfig.findUnique({
      where: {
        tenantId_batchNumber_vehicleType_rateType: {
          tenantId,
          batchNumber,
          vehicleType,
          rateType,
        },
      },
    });
  }

  async exportRates(tenantId: string) {
    const rates = await this.prisma.rateConfig.findMany({
      where: { tenantId },
      orderBy: [{ batchNumber: "asc" }, { vehicleType: "asc" }],
    });

    const rows = rates.map((r) => ({
      "Batch Number": r.batchNumber,
      "Rate Type": r.rateType === "NO_TARGET" ? "NO TARGET" : "TARGET",
      "Vehicle": r.vehicleType,
      "Rider Rate (Single)": r.riderRateSingle,
      "Rider Rate (Double)": r.riderRateDouble,
      "Company Rate (Single)": r.companyRateSingle,
      "Company Rate (Double)": r.companyRateDouble,
      "Target Count": r.targetCount,
    }));

    const ws = xlsx.utils.json_to_sheet(rows);
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, "Rate Configurations");

    const buffer = xlsx.write(wb, { type: "buffer", bookType: "xlsx" });
    return buffer;
  }

  async importRates(tenantId: string, buffer: Buffer) {
    const workbook = xlsx.read(buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet);

    let count = 0;
    for (const row of data as any[]) {
      const batchNumber = row["Batch Number"] || row["batch"] || row["Batch"];
      const vehicleType = row["Vehicle"] || row["vehicle"] || row["Vehicle Type"];
      const rateTypeStr = row["Rate Type"] || row["type"] || row["Scheme"];
      
      if (!batchNumber || !vehicleType) continue;

      const rateType = String(rateTypeStr || "").toUpperCase().includes("NO TARGET") ? "NO_TARGET" : "TARGET";

      await this.upsert(tenantId, {
        batchNumber,
        vehicleType: String(vehicleType).toUpperCase().trim(),
        rateType,
        targetCount: row["Target Count"] || row["target"] || 300,
        riderRateSingle: row["Rider Rate (Single)"] || row["rider_single"] || 0,
        riderRateDouble: row["Rider Rate (Double)"] || row["rider_double"] || 0,
        companyRateSingle: row["Company Rate (Single)"] || row["company_single"] || 0,
        companyRateDouble: row["Company Rate (Double)"] || row["company_double"] || 0,
      });
      count++;
    }
    return { message: "Rates imported successfully", count };
  }
}

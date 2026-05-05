import { Injectable, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { RatesService } from "../rates/rates.service";
import { PayslipsService } from "../payslips/payslips.service";
import * as xlsx from "xlsx";

@Injectable()
export class UploadService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ratesService: RatesService,
    private readonly payslipsService: PayslipsService,
  ) {}

  private async ensureTenantExists(tenantId: string) {
    let tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });
    if (!tenant) {
      tenant = await this.prisma.tenant.create({
        data: { id: tenantId, name: "Demo Tenant" },
      });
    }
  }

  async processExcel(
    buffer: Buffer,
    tenantId: string,
    mapping?: Record<string, string>,
    payrollMonth?: number,
    payrollYear?: number,
    ridersOnly?: boolean,
  ) {
    try {
      console.log(
        `[UploadService] Starting Excel processing for tenant: ${tenantId}`,
      );
      if (mapping)
        console.log(`[UploadService] Using custom mapping:`, mapping);

      await this.ensureTenantExists(tenantId);

      const workbook = xlsx.read(buffer, { type: "buffer" });
      let bestSheetName = "";
      let bestHeaderIndex = 0;
      let maxScore = -1;

      for (const name of workbook.SheetNames) {
        const sheet = workbook.Sheets[name];
        for (let headerRowIndex = 0; headerRowIndex < 10; headerRowIndex++) {
          const rows = xlsx.utils.sheet_to_json(sheet, {
            header: 1,
            range: headerRowIndex,
            defval: null,
          });
          if (!rows || rows.length === 0) continue;

          const headers = rows[0] as any[];
          if (!Array.isArray(headers)) continue;

          const score = this.scoreHeaderRow(headers);
          if (score > maxScore) {
            maxScore = score;
            bestSheetName = name;
            bestHeaderIndex = headerRowIndex;
          }
          if (score >= 4) break;
        }
      }

      if (maxScore <= 0) {
        throw new BadRequestException(
          "Could not find a valid data sheet or header row in the Excel file.",
        );
      }

      const targetSheet = workbook.Sheets[bestSheetName];
      const rawData = xlsx.utils.sheet_to_json(targetSheet, {
        range: bestHeaderIndex,
        defval: null,
      });

      if (!rawData || rawData.length === 0) {
        throw new BadRequestException("Target sheet is empty.");
      }

      const batchCache = new Map<number, any>();
      const payslipsToUpdate = new Set<string>();
      const processedEntries: any[] = [];
      const errors: string[] = [];
      let newRidersCount = 0;
      let newBatchesCount = 0;

      const riderMap = new Map<string, any>();
      const allExistingRiders = await this.prisma.rider.findMany({
        where: { tenantId },
      });

      for (let i = 0; i < rawData.length; i++) {
        const row: any = rawData[i];
        const riderIdRaw = this.getCol(
          row,
          ["rider id", "id", "riderid", "pilot id", "emp id"],
          mapping?.riderId,
        );
        const nameRaw = this.getCol(
          row,
          ["name", "rider name", "pilot name", "rider"],
          mapping?.riderName,
        );
        const vehicleRaw = this.getCol(
          row,
          ["vehicle type", "vehicle", "type"],
          mapping?.vehicleType,
        );
        const emailRaw = this.getCol(
          row,
          ["email", "rider email", "mail"],
          mapping?.email,
        );
        const companyRaw = this.getCol(
          row,
          ["company", "company code"],
          mapping?.companyCode,
        );
        const phoneRaw = this.getCol(
          row,
          ["phone", "whats app", "whatsapp", "mobile", "cell", "phone number"],
          mapping?.phoneNumber,
        );

        if (!riderIdRaw && !nameRaw) continue;

        let riderIdentifier = riderIdRaw ? String(riderIdRaw).trim() : null;
        let rider: any = null;

        if (riderIdentifier) {
          rider = await this.prisma.rider.findUnique({
            where: { tenantId_riderId: { tenantId, riderId: riderIdentifier } },
          });
        }

        if (!rider && nameRaw) {
          const nameToMatch = String(nameRaw).toLowerCase().trim();
          rider = allExistingRiders.find(
            (r) => r.riderName.toLowerCase().trim() === nameToMatch,
          );
          if (rider) riderIdentifier = rider.riderId;
        }

        if (!rider && riderIdentifier) {
          newRidersCount++;
          rider = await this.prisma.rider.create({
            data: {
              tenantId,
              riderId: riderIdentifier,
              riderName: nameRaw ? String(nameRaw) : riderIdentifier,
              email: emailRaw ? String(emailRaw).trim().toLowerCase() : null,
              vehicleType: (String(vehicleRaw).toUpperCase() === "CAR"
                ? "CAR"
                : "BIKE") as any,
              companyCode: companyRaw ? String(companyRaw).trim() : null,
              phoneNumber: phoneRaw
                ? String(phoneRaw).trim().replace(/\s+/g, "")
                : null,
            },
          });
        } else if (rider) {
          const updateData: any = {};

          if (emailRaw && !rider.email)
            updateData.email = String(emailRaw).trim().toLowerCase();

          if (phoneRaw && !rider.phoneNumber)
            updateData.phoneNumber = String(phoneRaw)
              .trim()
              .replace(/\s+/g, "");

          if (companyRaw && String(companyRaw).trim() !== rider.companyCode) {
            updateData.companyCode = String(companyRaw).trim();
          }

          if (Object.keys(updateData).length > 0) {
            rider = await this.prisma.rider.update({
              where: { id: rider.id },
              data: updateData,
            });
          }
        }

        if (riderIdentifier) {
          riderMap.set(riderIdentifier, rider);
        }
      }

      if (ridersOnly) {
        return {
          message: "Riders data processed successfully",
          totalProcessed: rawData.length,
          newRiders: newRidersCount,
        };
      }

      for (let i = 0; i < rawData.length; i++) {
        const row: any = rawData[i];

        try {
          const riderIdRaw = this.getCol(
            row,
            ["rider id", "id", "riderid", "pilot id", "emp id"],
            mapping?.riderId,
          );
          const batchRaw = this.getCol(
            row,
            ["Batch Number", "BATCH", "batch"],
            mapping?.batchNumber,
          );
          const dateRaw = this.getCol(
            row,
            ["Batch Week Local", "BATCH CHANGE DATE", "date"],
            mapping?.date,
          );

          const singleRaw = this.resolveValue(row, mapping?.singleOrders, [
            "Completed Pickups",
            "SINGLE ORDERS",
            "single",
          ]);
          const doubleRaw = this.resolveValue(row, mapping?.doubleOrders, [
            "double orders",
            "double",
          ]);
          const rateSingleRaw = this.resolveValue(row, mapping?.rateSingle, [
            "RATES",
            "Rate",
            "Single Rate",
            "unit_price",
          ]);
          const rateDoubleRaw = this.resolveValue(row, mapping?.rateDouble, [
            "RATES",
            "Rate",
            "Double Rate",
            "unit_price_double",
          ]);

          const riderIdentifier = riderIdRaw ? String(riderIdRaw).trim() : null;
          if (!riderIdentifier) continue;

          const rider = riderMap.get(riderIdentifier);
          if (!rider || !dateRaw) continue;

          const entryDate = this.parseDate(dateRaw);
          if (!entryDate) {
            errors.push(`Row ${i + 2}: Invalid Date (${dateRaw}).`);
            continue;
          }

          const batchNumber = this.parseNumber(batchRaw);
          if (isNaN(batchNumber)) continue;

          const singleOrders = this.parseNumber(singleRaw);
          const doubleOrders = this.parseNumber(doubleRaw);
          const excelRateSingle = this.parseNumber(rateSingleRaw);
          const excelRateDouble = this.parseNumber(rateDoubleRaw);

          let batch = batchCache.get(batchNumber);
          if (!batch) {
            batch = await this.prisma.batch.findUnique({
              where: { tenantId_batchNumber: { tenantId, batchNumber } },
            });
            if (batch) batchCache.set(batchNumber, batch);
          }

          if (!batch) {
            batch = await this.prisma.batch.create({
              data: {
                tenantId,
                batchNumber,
                rateSingleOrder: !isNaN(excelRateSingle) ? excelRateSingle : 0,
                rateDoubleOrder: !isNaN(excelRateDouble) ? excelRateDouble : 0,
              },
            });
            newBatchesCount++;
            batchCache.set(batchNumber, batch);
          } else if (!isNaN(excelRateSingle) || !isNaN(excelRateDouble)) {
            batch = await this.prisma.batch.update({
              where: { id: batch.id },
              data: {
                rateSingleOrder: !isNaN(excelRateSingle)
                  ? excelRateSingle
                  : batch.rateSingleOrder,
                rateDoubleOrder: !isNaN(excelRateDouble)
                  ? excelRateDouble
                  : batch.rateDoubleOrder,
              },
            });
            batchCache.set(batchNumber, batch);
          }

          const autoRateSingle = !isNaN(excelRateSingle)
            ? excelRateSingle
            : batch.rateSingleOrder;
          const autoRateDouble = !isNaN(excelRateDouble)
            ? excelRateDouble
            : batch.rateDoubleOrder;

          // Specialized Rates Lookup
          const rateConfig = await this.ratesService.findOne(
            tenantId,
            batchNumber,
            rider.vehicleType,
            rider.rateType,
          );

          let finalRiderRateSingle = autoRateSingle;
          let finalRiderRateDouble = autoRateDouble;
          let finalCompanyRateSingle = 0;
          let finalCompanyRateDouble = 0;

          if (rateConfig) {
            finalRiderRateSingle = rateConfig.riderRateSingle;
            finalRiderRateDouble = rateConfig.riderRateDouble;
            finalCompanyRateSingle = rateConfig.companyRateSingle;
            finalCompanyRateDouble = rateConfig.companyRateDouble;
          }

          const dailyAmount =
            singleOrders * finalRiderRateSingle +
            doubleOrders * finalRiderRateDouble;
          const companyAmount =
            singleOrders * finalCompanyRateSingle +
            doubleOrders * finalCompanyRateDouble;

          await this.prisma.dailyEntry.upsert({
            where: { riderId_date: { riderId: rider.id, date: entryDate } },
            update: {
              batchId: batch.id,
              singleOrders,
              doubleOrders,
              autoRateSingle: finalRiderRateSingle,
              autoRateDouble: finalRiderRateDouble,
              dailyAmount,
              // Rule B - Optimized Mapping
              riderRateSingle: finalRiderRateSingle,
              riderRateDouble: finalRiderRateDouble,
              companyRateSingle: finalCompanyRateSingle,
              companyRateDouble: finalCompanyRateDouble,
              companyAmount: companyAmount,
              payrollMonth,
              payrollYear,
            },
            create: {
              date: entryDate,
              riderId: rider.id,
              batchId: batch.id,
              singleOrders,
              doubleOrders,
              autoRateSingle: finalRiderRateSingle,
              autoRateDouble: finalRiderRateDouble,
              dailyAmount,
              // Rule B - Optimized Mapping
              riderRateSingle: finalRiderRateSingle,
              riderRateDouble: finalRiderRateDouble,
              companyRateSingle: finalCompanyRateSingle,
              companyRateDouble: finalCompanyRateDouble,
              companyAmount: companyAmount,
              payrollMonth,
              payrollYear,
            },
          });

          if (payrollMonth && payrollYear) {
            payslipsToUpdate.add(`${rider.id}|${payrollMonth}|${payrollYear}`);
          } else {
            payslipsToUpdate.add(
              `${rider.id}|${entryDate.getUTCMonth() + 1}|${entryDate.getUTCFullYear()}`,
            );
          }
          processedEntries.push(rider.id);
        } catch (e) {
          errors.push(`Row ${i + 2}: ${e.message}`);
        }
      }

      for (const key of payslipsToUpdate) {
        const [rId, mStr, yStr] = key.split("|");
        await this.payslipsService.syncPayslip(
          tenantId,
          rId,
          parseInt(mStr, 10),
          parseInt(yStr, 10),
        );
      }

      return {
        message: "Upload processed",
        processed: processedEntries.length,
        newRiders: newRidersCount,
        newBatches: newBatchesCount,
        errors,
      };
    } catch (err: any) {
      console.error(err);
      throw new BadRequestException(
        `Internal processing error: ${err.message}`,
      );
    }
  }

  private getCol(row: any, aliases: string[], explicitHeader?: string) {
    if (explicitHeader && row[explicitHeader] !== undefined)
      return row[explicitHeader];
    const keys = Object.keys(row);
    const stdAliases = aliases.map((a) =>
      a.toLowerCase().replace(/[^a-z0-9]/g, ""),
    );
    for (const key of keys) {
      if (stdAliases.includes(key.toLowerCase().replace(/[^a-z0-9]/g, "")))
        return row[key];
    }
    return undefined;
  }

  private resolveValue(
    row: any,
    mappingValue: string | undefined,
    aliases: string[],
  ) {
    // 1. If no mapping provided, use fuzzy aliases
    if (!mappingValue) return this.getCol(row, aliases);

    // 2. If it is a FORMULA
    if (mappingValue.startsWith("FORMULA:")) {
      return this.evaluateFormula(mappingValue.replace("FORMULA:", ""), row);
    }

    // 3. Direct column mapping
    return row[mappingValue];
  }

  private evaluateFormula(formula: string, row: any): number {
    try {
      // Replace tokens {{Column Name}} with numeric values
      let expression = formula;
      const tokenRegex = /\{\{(.*?)\}\}/g;

      expression = expression.replace(tokenRegex, (match, colName) => {
        const val = this.parseNumber(row[colName.trim()]);
        return isNaN(val) ? "0" : val.toString();
      });

      // Clean expression of everything except numbers and basic operators for safety
      const safeExpression = expression.replace(/[^0-9+\-*/.()\s]/g, "");

      // Basic arithmetic evaluation (careful: using Function constructor as a small math interpreter)
      // Since we've sanitized everything except numbers and operators, this is safe in this context.
      // eslint-disable-next-line @typescript-eslint/no-implied-eval
      return new Function(`return ${safeExpression}`)();
    } catch (e) {
      console.error("[UploadService] Formula error:", formula, e);
      return 0;
    }
  }

  async getHeaders(buffer: Buffer) {
    const workbook = xlsx.read(buffer, { type: "buffer" });
    const results: any[] = [];
    for (const name of workbook.SheetNames) {
      const sheet = workbook.Sheets[name];
      const rows: any[][] = xlsx.utils.sheet_to_json(sheet, {
        header: 1,
        range: 0,
        defval: null,
      });
      let headerRowIndex = 0;
      let headers: string[] = [];
      for (let i = 0; i < Math.min(rows.length, 10); i++) {
        if (Array.isArray(rows[i]) && this.scoreHeaderRow(rows[i]) > 0) {
          headerRowIndex = i;
          headers = rows[i].filter((h) => h !== null).map(String);
          break;
        }
      }
      const rawData: any[] = xlsx.utils.sheet_to_json(sheet, {
        range: headerRowIndex,
        defval: null,
      });
      results.push({
        sheetName: name,
        headers,
        sample: rawData.length > 0 ? rawData[0] : null,
      });
    }
    return results;
  }

  private parseDate(val: any): Date | null {
    if (!val) return null;
    let d: Date;
    if (val instanceof Date) d = val;
    else if (typeof val === "number")
      d = new Date(Math.round((val - 25569) * 86400 * 1000));
    else {
      const str = String(val).trim();
      const dmy = str.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
      if (dmy) {
        let year = parseInt(dmy[3], 10);
        if (year < 100) year += 2000;
        return new Date(
          Date.UTC(year, parseInt(dmy[2], 10) - 1, parseInt(dmy[1], 10)),
        );
      }
      d = new Date(str);
    }
    if (isNaN(d.getTime())) return null;
    return new Date(
      Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()),
    );
  }

  private parseNumber(val: any): number {
    if (val === null || val === undefined || val === "") return 0;
    if (typeof val === "number") return val;
    const match = String(val)
      .replace(/,/g, "")
      .match(/[-+]?\d*\.?\d+/);
    return match ? parseFloat(match[0]) : NaN;
  }

  private scoreHeaderRow(headers: any[]): number {
    let score = 0;
    const stdHeaders = headers
      .filter((h) => h !== null)
      .map((h) =>
        String(h)
          .toLowerCase()
          .replace(/[^a-z0-9]/g, ""),
      );
    const coreAliases = [
      ["rider id", "id", "riderid", "pilot id", "emp id"],
      ["Batch Week Local", "BATCH CHANGE DATE", "date", "service date"],
      ["Batch Number", "BATCH", "batch"],
      ["Completed Pickups", "SINGLE ORDERS", "single orders"],
    ];
    for (const group of coreAliases) {
      const stdAliases = group.map((a) =>
        a.toLowerCase().replace(/[^a-z0-9]/g, ""),
      );
      if (stdHeaders.some((h) => stdAliases.includes(h))) score++;
    }
    return score;
  }

  async resetTenantData(tenantId: string, month?: number, year?: number) {
    await this.ensureTenantExists(tenantId);
    
    const entryWhere: any = { rider: { tenantId } };
    const slipWhere: any = { tenantId };
    
    if (month && year) {
      entryWhere.payrollMonth = month;
      entryWhere.payrollYear = year;
      slipWhere.month = month;
      slipWhere.year = year;
    }

    await this.prisma.dailyEntry.deleteMany({ where: entryWhere });
    await this.prisma.payslip.deleteMany({ where: slipWhere });

    return {
      success: true,
      message: month && year 
        ? `Payroll data for ${month}/${year} cleared securely.`
        : "All payroll data cleared. Riders and configurations preserved.",
    };
  }
}

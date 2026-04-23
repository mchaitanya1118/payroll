"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UploadService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const rates_service_1 = require("../rates/rates.service");
const xlsx = __importStar(require("xlsx"));
let UploadService = class UploadService {
    prisma;
    ratesService;
    constructor(prisma, ratesService) {
        this.prisma = prisma;
        this.ratesService = ratesService;
    }
    async ensureTenantExists(tenantId) {
        let tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
        if (!tenant) {
            tenant = await this.prisma.tenant.create({
                data: { id: tenantId, name: 'Demo Tenant' },
            });
        }
    }
    async processExcel(buffer, tenantId, mapping, payrollMonth, payrollYear) {
        try {
            console.log(`[UploadService] Starting Excel processing for tenant: ${tenantId}`);
            if (mapping)
                console.log(`[UploadService] Using custom mapping:`, mapping);
            await this.ensureTenantExists(tenantId);
            const workbook = xlsx.read(buffer, { type: 'buffer' });
            let bestSheetName = '';
            let bestHeaderIndex = 0;
            let maxScore = -1;
            for (const name of workbook.SheetNames) {
                const sheet = workbook.Sheets[name];
                for (let headerRowIndex = 0; headerRowIndex < 10; headerRowIndex++) {
                    const rows = xlsx.utils.sheet_to_json(sheet, { header: 1, range: headerRowIndex, defval: null });
                    if (!rows || rows.length === 0)
                        continue;
                    const headers = rows[0];
                    if (!Array.isArray(headers))
                        continue;
                    const score = this.scoreHeaderRow(headers);
                    if (score > maxScore) {
                        maxScore = score;
                        bestSheetName = name;
                        bestHeaderIndex = headerRowIndex;
                    }
                    if (score >= 4)
                        break;
                }
            }
            if (maxScore <= 0) {
                throw new common_1.BadRequestException('Could not find a valid data sheet or header row in the Excel file.');
            }
            const targetSheet = workbook.Sheets[bestSheetName];
            const rawData = xlsx.utils.sheet_to_json(targetSheet, { range: bestHeaderIndex, defval: null });
            if (!rawData || rawData.length === 0) {
                throw new common_1.BadRequestException('Target sheet is empty.');
            }
            const batchCache = new Map();
            const payslipsToUpdate = new Set();
            const processedEntries = [];
            const errors = [];
            let newRidersCount = 0;
            let newBatchesCount = 0;
            const riderMap = new Map();
            const allExistingRiders = await this.prisma.rider.findMany({ where: { tenantId } });
            for (let i = 0; i < rawData.length; i++) {
                const row = rawData[i];
                const riderIdRaw = this.getCol(row, ['rider id', 'id', 'riderid', 'pilot id', 'emp id'], mapping?.riderId);
                const nameRaw = this.getCol(row, ['name', 'rider name', 'pilot name', 'rider'], mapping?.riderName);
                const vehicleRaw = this.getCol(row, ['vehicle type', 'vehicle', 'type'], mapping?.vehicleType);
                const emailRaw = this.getCol(row, ['email', 'rider email', 'mail'], mapping?.email);
                const companyRaw = this.getCol(row, ['company', 'company code'], mapping?.companyCode);
                if (!riderIdRaw && !nameRaw)
                    continue;
                let riderIdentifier = riderIdRaw ? String(riderIdRaw).trim() : null;
                let rider = null;
                if (riderIdentifier) {
                    rider = await this.prisma.rider.findUnique({
                        where: { tenantId_riderId: { tenantId, riderId: riderIdentifier } }
                    });
                }
                if (!rider && nameRaw) {
                    const nameToMatch = String(nameRaw).toLowerCase().trim();
                    rider = allExistingRiders.find(r => r.riderName.toLowerCase().trim() === nameToMatch);
                    if (rider)
                        riderIdentifier = rider.riderId;
                }
                if (!rider && riderIdentifier) {
                    newRidersCount++;
                    rider = await this.prisma.rider.create({
                        data: {
                            tenantId,
                            riderId: riderIdentifier,
                            riderName: nameRaw ? String(nameRaw) : riderIdentifier,
                            email: emailRaw ? String(emailRaw).trim().toLowerCase() : null,
                            vehicleType: (String(vehicleRaw).toUpperCase() === 'CAR' ? 'CAR' : 'BIKE'),
                            companyCode: companyRaw ? String(companyRaw).trim() : null,
                        }
                    });
                }
                else if (rider && emailRaw && !rider.email) {
                    rider = await this.prisma.rider.update({
                        where: { id: rider.id },
                        data: { email: String(emailRaw).trim().toLowerCase() }
                    });
                }
                if (riderIdentifier) {
                    riderMap.set(riderIdentifier, rider);
                }
            }
            for (let i = 0; i < rawData.length; i++) {
                const row = rawData[i];
                try {
                    const riderIdRaw = this.getCol(row, ['rider id', 'id', 'riderid', 'pilot id', 'emp id'], mapping?.riderId);
                    const batchRaw = this.getCol(row, ['Batch Number', 'BATCH', 'batch'], mapping?.batchNumber);
                    const dateRaw = this.getCol(row, ['Batch Week Local', 'BATCH CHANGE DATE', 'date'], mapping?.date);
                    const singleRaw = this.resolveValue(row, mapping?.singleOrders, [
                        'Completed Pickups', 'SINGLE ORDERS', 'single'
                    ]);
                    const doubleRaw = this.resolveValue(row, mapping?.doubleOrders, [
                        'double orders', 'double'
                    ]);
                    const rateSingleRaw = this.resolveValue(row, mapping?.rateSingle, [
                        'RATES', 'Rate', 'Single Rate', 'unit_price'
                    ]);
                    const rateDoubleRaw = this.resolveValue(row, mapping?.rateDouble, [
                        'RATES', 'Rate', 'Double Rate', 'unit_price_double'
                    ]);
                    let riderIdentifier = riderIdRaw ? String(riderIdRaw).trim() : null;
                    if (!riderIdentifier)
                        continue;
                    const rider = riderMap.get(riderIdentifier);
                    if (!rider || !dateRaw)
                        continue;
                    let entryDate = this.parseDate(dateRaw);
                    if (!entryDate) {
                        errors.push(`Row ${i + 2}: Invalid Date (${dateRaw}).`);
                        continue;
                    }
                    const batchNumber = this.parseNumber(batchRaw);
                    if (isNaN(batchNumber))
                        continue;
                    const singleOrders = this.parseNumber(singleRaw);
                    const doubleOrders = this.parseNumber(doubleRaw);
                    const excelRateSingle = this.parseNumber(rateSingleRaw);
                    const excelRateDouble = this.parseNumber(rateDoubleRaw);
                    let batch = batchCache.get(batchNumber);
                    if (!batch) {
                        batch = await this.prisma.batch.findUnique({
                            where: { tenantId_batchNumber: { tenantId, batchNumber } },
                        });
                        if (batch)
                            batchCache.set(batchNumber, batch);
                    }
                    if (!batch) {
                        batch = await this.prisma.batch.create({
                            data: {
                                tenantId,
                                batchNumber,
                                rateSingleOrder: !isNaN(excelRateSingle) ? excelRateSingle : 0,
                                rateDoubleOrder: !isNaN(excelRateDouble) ? excelRateDouble : 0
                            },
                        });
                        newBatchesCount++;
                        batchCache.set(batchNumber, batch);
                    }
                    else if (!isNaN(excelRateSingle) || !isNaN(excelRateDouble)) {
                        batch = await this.prisma.batch.update({
                            where: { id: batch.id },
                            data: {
                                rateSingleOrder: !isNaN(excelRateSingle) ? excelRateSingle : batch.rateSingleOrder,
                                rateDoubleOrder: !isNaN(excelRateDouble) ? excelRateDouble : batch.rateDoubleOrder,
                            }
                        });
                        batchCache.set(batchNumber, batch);
                    }
                    const autoRateSingle = !isNaN(excelRateSingle) ? excelRateSingle : batch.rateSingleOrder;
                    const autoRateDouble = !isNaN(excelRateDouble) ? excelRateDouble : batch.rateDoubleOrder;
                    const rateConfig = await this.ratesService.findOne(tenantId, batchNumber, rider.vehicleType, rider.rateType);
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
                    const dailyAmount = (singleOrders * finalRiderRateSingle) + (doubleOrders * finalRiderRateDouble);
                    const companyAmount = (singleOrders * finalCompanyRateSingle) + (doubleOrders * finalCompanyRateDouble);
                    await this.prisma.dailyEntry.upsert({
                        where: { riderId_date: { riderId: rider.id, date: entryDate } },
                        update: {
                            batchId: batch.id,
                            singleOrders,
                            doubleOrders,
                            autoRateSingle: finalRiderRateSingle,
                            autoRateDouble: finalRiderRateDouble,
                            dailyAmount,
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
                    }
                    else {
                        payslipsToUpdate.add(`${rider.id}|${entryDate.getUTCMonth() + 1}|${entryDate.getUTCFullYear()}`);
                    }
                    processedEntries.push(rider.id);
                }
                catch (e) {
                    errors.push(`Row ${i + 2}: ${e.message}`);
                }
            }
            for (const key of payslipsToUpdate) {
                const [rId, mStr, yStr] = key.split('|');
                await this.syncPayslip(tenantId, rId, parseInt(mStr), parseInt(yStr));
            }
            return {
                message: 'Upload processed',
                processed: processedEntries.length,
                newRiders: newRidersCount,
                newBatches: newBatchesCount,
                errors,
            };
        }
        catch (err) {
            console.error(err);
            throw new common_1.BadRequestException(`Internal processing error: ${err.message}`);
        }
    }
    getCol(row, aliases, explicitHeader) {
        if (explicitHeader && row[explicitHeader] !== undefined)
            return row[explicitHeader];
        const keys = Object.keys(row);
        const stdAliases = aliases.map(a => a.toLowerCase().replace(/[^a-z0-9]/g, ''));
        for (const key of keys) {
            if (stdAliases.includes(key.toLowerCase().replace(/[^a-z0-9]/g, '')))
                return row[key];
        }
        return undefined;
    }
    resolveValue(row, mappingValue, aliases) {
        if (!mappingValue)
            return this.getCol(row, aliases);
        if (mappingValue.startsWith('FORMULA:')) {
            return this.evaluateFormula(mappingValue.replace('FORMULA:', ''), row);
        }
        return row[mappingValue];
    }
    evaluateFormula(formula, row) {
        try {
            let expression = formula;
            const tokenRegex = /\{\{(.*?)\}\}/g;
            expression = expression.replace(tokenRegex, (match, colName) => {
                const val = this.parseNumber(row[colName.trim()]);
                return isNaN(val) ? '0' : val.toString();
            });
            const safeExpression = expression.replace(/[^0-9\+\-\*\/\.\(\)\s]/g, '');
            return new Function(`return ${safeExpression}`)();
        }
        catch (e) {
            console.error('[UploadService] Formula error:', formula, e);
            return 0;
        }
    }
    async getHeaders(buffer) {
        const workbook = xlsx.read(buffer, { type: 'buffer' });
        const results = [];
        for (const name of workbook.SheetNames) {
            const sheet = workbook.Sheets[name];
            const rows = xlsx.utils.sheet_to_json(sheet, { header: 1, range: 0, defval: null });
            let headerRowIndex = 0;
            let headers = [];
            for (let i = 0; i < Math.min(rows.length, 10); i++) {
                if (Array.isArray(rows[i]) && this.scoreHeaderRow(rows[i]) > 0) {
                    headerRowIndex = i;
                    headers = rows[i].filter(h => h !== null).map(String);
                    break;
                }
            }
            const rawData = xlsx.utils.sheet_to_json(sheet, { range: headerRowIndex, defval: null });
            results.push({ sheetName: name, headers, sample: rawData.length > 0 ? rawData[0] : null });
        }
        return results;
    }
    parseDate(val) {
        if (!val)
            return null;
        let d;
        if (val instanceof Date)
            d = val;
        else if (typeof val === 'number')
            d = new Date(Math.round((val - 25569) * 86400 * 1000));
        else {
            const str = String(val).trim();
            const dmy = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
            if (dmy) {
                let year = parseInt(dmy[3]);
                if (year < 100)
                    year += 2000;
                return new Date(Date.UTC(year, parseInt(dmy[2]) - 1, parseInt(dmy[1])));
            }
            d = new Date(str);
        }
        if (isNaN(d.getTime()))
            return null;
        return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
    }
    parseNumber(val) {
        if (val === null || val === undefined || val === '')
            return 0;
        if (typeof val === 'number')
            return val;
        const match = String(val).replace(/,/g, '').match(/[-+]?\d*\.?\d+/);
        return match ? parseFloat(match[0]) : NaN;
    }
    scoreHeaderRow(headers) {
        let score = 0;
        const stdHeaders = headers.filter(h => h !== null).map(h => String(h).toLowerCase().replace(/[^a-z0-9]/g, ''));
        const coreAliases = [
            ['rider id', 'id', 'riderid', 'pilot id', 'emp id'],
            ['Batch Week Local', 'BATCH CHANGE DATE', 'date', 'service date'],
            ['Batch Number', 'BATCH', 'batch'],
            ['Completed Pickups', 'SINGLE ORDERS', 'single orders']
        ];
        for (const group of coreAliases) {
            const stdAliases = group.map(a => a.toLowerCase().replace(/[^a-z0-9]/g, ''));
            if (stdHeaders.some(h => stdAliases.includes(h)))
                score++;
        }
        return score;
    }
    async syncPayslip(tenantId, riderId, month, year) {
        const entries = await this.prisma.dailyEntry.findMany({
            where: { riderId, payrollMonth: month, payrollYear: year },
        });
        let totalSingle = 0, totalDouble = 0, grossTotal = 0, grossRevenue = 0;
        for (const e of entries) {
            totalSingle += e.singleOrders;
            totalDouble += e.doubleOrders;
            grossTotal += e.dailyAmount;
            grossRevenue += e.companyAmount || 0;
        }
        const payslip = await this.prisma.payslip.upsert({
            where: { tenantId_riderId_month_year: { tenantId, riderId, month, year } },
            update: {},
            create: { tenantId, riderId, month, year },
        });
        const netTotal = grossTotal + (payslip.bonus || 0) - ((payslip.deductions || 0) + (payslip.salesCash || 0) + (payslip.carRent || 0) +
            (payslip.akama || 0) + (payslip.fine || 0) + (payslip.bankDeduction || 0));
        await this.prisma.payslip.update({
            where: { id: payslip.id },
            data: {
                totalSingleOrders: totalSingle || 0,
                totalDoubleOrders: totalDouble || 0,
                grossAmount: grossTotal || 0,
                grossRevenue: grossRevenue || 0,
                netTotal: netTotal || 0,
            },
        });
    }
    async resetTenantData(tenantId) {
        await this.ensureTenantExists(tenantId);
        await this.prisma.dailyEntry.deleteMany({ where: { rider: { tenantId } } });
        await this.prisma.payslip.deleteMany({ where: { tenantId } });
        return { success: true, message: 'Payroll data cleared. Riders and configurations preserved.' };
    }
};
exports.UploadService = UploadService;
exports.UploadService = UploadService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        rates_service_1.RatesService])
], UploadService);
//# sourceMappingURL=upload.service.js.map
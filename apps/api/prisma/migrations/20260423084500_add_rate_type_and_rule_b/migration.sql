-- CreateEnum
CREATE TYPE "RateType" AS ENUM ('TARGET', 'NO_TARGET');

-- AlterTable
ALTER TABLE "DailyEntry" ADD COLUMN     "companyAmount" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN     "companyRateDouble" DOUBLE PRECISION,
ADD COLUMN     "companyRateSingle" DOUBLE PRECISION,
ADD COLUMN     "payrollMonth" INTEGER,
ADD COLUMN     "payrollYear" INTEGER,
ADD COLUMN     "riderRateDouble" DOUBLE PRECISION,
ADD COLUMN     "riderRateSingle" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "Payslip" ADD COLUMN     "grossRevenue" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Rider" ADD COLUMN     "rateType" "RateType" NOT NULL DEFAULT 'TARGET';

-- CreateTable
CREATE TABLE "RateConfig" (
    "id" TEXT NOT NULL,
    "batchNumber" INTEGER NOT NULL,
    "vehicleType" "VehicleType" NOT NULL,
    "rateType" "RateType" NOT NULL DEFAULT 'TARGET',
    "riderRateSingle" DOUBLE PRECISION NOT NULL,
    "riderRateDouble" DOUBLE PRECISION NOT NULL,
    "companyRateSingle" DOUBLE PRECISION NOT NULL,
    "companyRateDouble" DOUBLE PRECISION NOT NULL,
    "tenantId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RateConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DailyEntry_payrollMonth_payrollYear_idx" ON "DailyEntry"("payrollMonth", "payrollYear");

-- CreateIndex
CREATE INDEX "Payslip_tenantId_month_year_idx" ON "Payslip"("tenantId", "month", "year");

-- CreateIndex
CREATE UNIQUE INDEX "RateConfig_tenantId_batchNumber_vehicleType_rateType_key" ON "RateConfig"("tenantId", "batchNumber", "vehicleType", "rateType");

-- AddForeignKey
ALTER TABLE "RateConfig" ADD CONSTRAINT "RateConfig_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

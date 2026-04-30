-- AlterTable
ALTER TABLE "Tenant" ADD COLUMN "currency" TEXT NOT NULL DEFAULT 'SAR',
ADD COLUMN "currencySymbol" TEXT NOT NULL DEFAULT 'SAR';

-- AlterTable
ALTER TABLE "Rider" ADD COLUMN "phoneNumber" TEXT;

-- AlterTable
ALTER TABLE "Payslip" ADD COLUMN "targetOrders" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "targetAchieved" BOOLEAN NOT NULL DEFAULT false;

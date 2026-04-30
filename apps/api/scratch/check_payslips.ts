import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const payslips = await prisma.payslip.findMany({ take: 5, where: { phoneNumber: { not: null } } });
  console.log(JSON.stringify(payslips, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());

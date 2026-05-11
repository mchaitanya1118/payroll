const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const riders = await prisma.rider.findMany({
    take: 5,
    select: { tenantId: true }
  });
  console.log('Rider Tenant IDs:', [...new Set(riders.map(r => r.tenantId))]);
}

main().catch(console.error).finally(() => prisma.$disconnect());

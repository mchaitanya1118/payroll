const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.user.update({
    where: { email: 'admin@neqtra.com' },
    data: { tenantId: 'demo-tenant' }
  });
  console.log('User admin@neqtra.com moved to demo-tenant');
}

main().catch(console.error).finally(() => prisma.$disconnect());

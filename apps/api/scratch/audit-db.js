const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const tenants = await prisma.tenant.findMany();
  const users = await prisma.user.findMany();
  console.log('Tenants:', JSON.stringify(tenants, null, 2));
  console.log('Users:', JSON.stringify(users.map(u => ({ email: u.email, name: u.name, tenantId: u.tenantId })), null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());

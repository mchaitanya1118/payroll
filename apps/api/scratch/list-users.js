const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      tenantId: true
    }
  });
  console.log('--- SYSTEM USERS ---');
  console.log(JSON.stringify(users, null, 2));
  console.log('--------------------');
}

main().catch(console.error).finally(() => prisma.$disconnect());

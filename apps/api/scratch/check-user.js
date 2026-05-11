const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findUnique({
    where: { email: 'medavarapu.m@gmail.com' },
    include: { tenant: true }
  });
  console.log('User found:', JSON.stringify(user, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());

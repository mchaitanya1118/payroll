import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const riders = await prisma.rider.findMany({ take: 5 });
  console.log(JSON.stringify(riders, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());

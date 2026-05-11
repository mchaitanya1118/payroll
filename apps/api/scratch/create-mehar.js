const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  const email = 'medavarapu.m@gmail.com';
  const password = 'password123';
  const hashedPassword = await bcrypt.hash(password, 10);
  
  await prisma.user.upsert({
    where: { email },
    update: { password: hashedPassword, tenantId: 'demo-tenant' },
    create: {
      email,
      name: 'Mehar Chaitanya',
      password: hashedPassword,
      role: 'ADMIN',
      tenantId: 'demo-tenant'
    }
  });
  
  console.log(`User ${email} created/updated with password: ${password} and tenant: demo-tenant`);
}

main().catch(console.error).finally(() => prisma.$disconnect());


const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  const email = 'admin@neqtra.com';
  const password = 'password';
  const hashedPassword = await bcrypt.hash(password, 10);

  console.log('Ensuring admin user exists...');

  try {
    const tenant = await prisma.tenant.upsert({
      where: { id: 'default-tenant' },
      update: {},
      create: {
        id: 'default-tenant',
        name: 'Main Tenant',
      },
    });

    const user = await prisma.user.upsert({
      where: { email },
      update: {
        password: hashedPassword,
        role: 'ADMIN',
        tenantId: tenant.id,
      },
      create: {
        email,
        password: hashedPassword,
        name: 'System Admin',
        role: 'ADMIN',
        tenantId: tenant.id,
      },
    });

    console.log('Admin user ready:', user.email);
  } catch (e) {
    console.error('Error seeding admin:', e);
  } finally {
    await prisma.$disconnect();
  }
}

main();

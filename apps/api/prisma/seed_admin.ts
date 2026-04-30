import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = 'admin@neqtra.com';
  const password = 'admin123';
  const hashedPassword = await bcrypt.hash(password, 10);

  console.log('--- Starting Seeding ---');

  // 1. Create Default Tenant
  const tenant = await prisma.tenant.upsert({
    where: { id: 'default-tenant-id' }, // Stable ID for dev
    update: {},
    create: {
      id: 'default-tenant-id',
      name: 'Default Tenant',
    },
  });
  console.log('Tenant ensured:', tenant.name);

  // 2. Create Admin User
  const user = await prisma.user.upsert({
    where: { email },
    update: {
      password: hashedPassword,
      tenantId: tenant.id,
    },
    create: {
      email,
      password: hashedPassword,
      name: 'Super Admin',
      role: 'ADMIN',
      tenantId: tenant.id,
    },
  });
  console.log('Admin user ensured:', user.email);

  console.log('--- Seeding Complete ---');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

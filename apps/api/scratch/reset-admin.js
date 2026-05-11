const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  const email = 'admin@neqtra.com';
  const password = 'admin123';
  const hashedPassword = await bcrypt.hash(password, 10);
  
  await prisma.user.update({
    where: { email },
    data: { password: hashedPassword }
  });
  
  console.log(`Password for ${email} has been reset to: ${password}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());

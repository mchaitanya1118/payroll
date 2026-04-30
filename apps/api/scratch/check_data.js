const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const tenant = await prisma.tenant.findFirst();
    if (!tenant) {
      console.log("No tenant found");
      return;
    }
    console.log("Found tenant:", tenant.id);
    
    const riders = await prisma.rider.findMany({ where: { tenantId: tenant.id } });
    console.log(`Found ${riders.length} riders`);
    
    const stats = await prisma.dailyEntry.groupBy({
      by: ['payrollMonth', 'payrollYear'],
      _count: true
    });
    console.log("Data distribution:", stats);
    
    if (stats.length === 0) {
      console.log("CRITICAL: DailyEntry table is EMPTY!");
    } else {
       console.log(`Found entries for ${stats.length} different periods.`);
    }
    
  } catch (e) {
    console.error("DB Error:", e);
  } finally {
    await prisma.$disconnect();
  }
}

main();

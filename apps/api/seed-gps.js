const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const BASE_LAT = 24.7136;
const BASE_LNG = 46.6753;

async function main() {
  console.log('Fetching all riders to seed GPS data...');
  const riders = await prisma.rider.findMany({
    select: { id: true, riderName: true }
  });
  
  console.log(`Found ${riders.length} riders. Seeding...`);
  
  for (const rider of riders) {
    const lat = BASE_LAT + (Math.random() - 0.5) * 0.3;
    const lng = BASE_LNG + (Math.random() - 0.5) * 0.3;
    
    try {
      await prisma.rider.update({
        where: { id: rider.id },
        data: {
          lastLat: lat,
          lastLng: lng,
          lastLocationUpdate: new Date()
        }
      });
      
      // We only log to console for a few to avoid flooding
      if (riders.indexOf(rider) < 10) {
         console.log(`Seeded GPS for: ${rider.riderName}`);
      }
    } catch (e) {
      console.error(`Failed to seed ${rider.id}:`, e.message);
    }
  }
  console.log('Seed complete!');
}

main().catch(console.error).finally(() => prisma.$disconnect());

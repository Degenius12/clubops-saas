const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedShiftConfigurations() {
  console.log('🔄 Seeding shift configurations for demo club...\n');

  try {
    // Find demo club
    const demoClub = await prisma.club.findFirst({
      where: {
        subdomain: 'demo'
      }
    });

    if (!demoClub) {
      console.log('❌ Demo club not found. Please create the club first.');
      return;
    }

    console.log(`✅ Found demo club: ${demoClub.name} (${demoClub.id})\n`);

    // Create default shift configurations
    const shifts = [
      {
        clubId: demoClub.id,
        name: 'Day Shift',
        shiftType: 'DAY',
        startTime: '14:00',
        endTime: '22:00',
        displayOrder: 1
      },
      {
        clubId: demoClub.id,
        name: 'Night Shift',
        shiftType: 'NIGHT',
        startTime: '22:00',
        endTime: '06:00',
        displayOrder: 2
      }
    ];

    for (const shift of shifts) {
      // Check if shift already exists
      const existing = await prisma.shiftConfiguration.findFirst({
        where: {
          clubId: demoClub.id,
          name: shift.name
        }
      });

      if (existing) {
        console.log(`⏭️  Shift "${shift.name}" already exists, skipping...`);
      } else {
        const created = await prisma.shiftConfiguration.create({
          data: shift
        });
        console.log(`✅ Created shift: ${created.name} (${created.startTime} - ${created.endTime})`);
      }
    }

    console.log('\n✅ Shift configurations seeded successfully!');
  } catch (error) {
    console.error('❌ Error seeding shift configurations:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedShiftConfigurations();

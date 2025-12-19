/**
 * Helper script to find your Club ID
 *
 * Usage: node backend/scripts/getClubId.js
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function getClubId() {
  try {
    console.log('\n🔍 Finding clubs in database...\n');

    const clubs = await prisma.club.findMany({
      select: {
        id: true,
        name: true,
        active: true,
        subscriptionStatus: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    if (clubs.length === 0) {
      console.log('❌ No clubs found in database.');
      console.log('\nYou need to create a club first. You can:');
      console.log('  1. Sign up via the app (creates a club automatically)');
      console.log('  2. Use Prisma Studio: npx prisma studio');
      console.log('  3. Create via API: POST /api/auth/register\n');
      return;
    }

    console.log(`Found ${clubs.length} club(s):\n`);

    clubs.forEach((club, index) => {
      console.log(`${index + 1}. ${club.name}`);
      console.log(`   ID: ${club.id}`);
      console.log(`   Status: ${club.subscriptionStatus} ${club.active ? '(Active)' : '(Inactive)'}`);
      console.log(`   Created: ${club.createdAt.toLocaleDateString()}`);
      console.log('');
    });

    if (clubs.length === 1) {
      console.log('💡 To seed security data for this club, run:');
      console.log(`   node backend/scripts/seedSecurityData.js ${clubs[0].id}\n`);
    } else {
      console.log('💡 To seed security data, run:');
      console.log('   node backend/scripts/seedSecurityData.js <CLUB_ID>\n');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

getClubId();

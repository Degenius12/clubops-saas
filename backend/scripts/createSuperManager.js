const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createSuperManager() {
  console.log('🔄 Creating Super Manager demo account...\n');

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

    // Check if super manager already exists
    const existing = await prisma.clubUser.findFirst({
      where: {
        clubId: demoClub.id,
        email: 'supermanager@demo.clubflow.com'
      }
    });

    if (existing) {
      console.log('⏭️  Super Manager account already exists');
      console.log(`   Email: supermanager@demo.clubflow.com`);
      console.log(`   Password: demo123`);
      console.log(`   Role: SUPER_MANAGER\n`);
      return;
    }

    // Create Super Manager account
    const passwordHash = await bcrypt.hash('demo123', 10);

    const superManager = await prisma.clubUser.create({
      data: {
        clubId: demoClub.id,
        email: 'supermanager@demo.clubflow.com',
        passwordHash,
        role: 'SUPER_MANAGER',
        firstName: 'Sarah',
        lastName: 'Mitchell',
        isActive: true
      }
    });

    console.log('✅ Super Manager account created successfully!\n');
    console.log('📧 Login credentials:');
    console.log(`   Email: supermanager@demo.clubflow.com`);
    console.log(`   Password: demo123`);
    console.log(`   Role: SUPER_MANAGER`);
    console.log(`   Name: ${superManager.firstName} ${superManager.lastName}\n`);

    // List all demo accounts
    console.log('📋 All demo accounts:');
    const allUsers = await prisma.clubUser.findMany({
      where: {
        clubId: demoClub.id,
        email: { contains: 'demo.clubflow.com' }
      },
      select: {
        email: true,
        role: true,
        firstName: true,
        lastName: true
      },
      orderBy: { role: 'asc' }
    });

    allUsers.forEach(user => {
      console.log(`   ${user.role.padEnd(15)} - ${user.email}`);
    });

  } catch (error) {
    console.error('❌ Error creating Super Manager:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createSuperManager();

// Check what demo users exist for testing authentication
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDemoUsers() {
  console.log('🔍 Checking Demo Users...\n');

  try {
    // Get demo club
    const club = await prisma.club.findFirst({
      where: { OR: [
        { subdomain: 'demo' },
        { name: { contains: 'Demo', mode: 'insensitive' } }
      ]}
    });

    if (!club) {
      console.error('❌ No demo club found');
      process.exit(1);
    }

    console.log(`✅ Found club: ${club.name} (subdomain: ${club.subdomain})\n`);

    // Get all users for this club
    const users = await prisma.clubUser.findMany({
      where: { clubId: club.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true
      },
      orderBy: { role: 'asc' }
    });

    console.log(`📋 Found ${users.length} users:\n`);

    const roleGroups = {
      'OWNER': [],
      'SUPER_MANAGER': [],
      'MANAGER': [],
      'VIP_HOST': [],
      'DJ': [],
      'OTHER': []
    };

    users.forEach(user => {
      const role = user.role.toUpperCase();
      const group = roleGroups[role] || roleGroups['OTHER'];
      group.push(user);
    });

    Object.entries(roleGroups).forEach(([role, users]) => {
      if (users.length > 0) {
        console.log(`\n${role}:`);
        users.forEach(user => {
          console.log(`  - ${user.firstName} ${user.lastName}`);
          console.log(`    Email: ${user.email}`);
          console.log(`    Active: ${user.isActive ? '✅' : '❌'}`);
        });
      }
    });

    console.log('\n\n📝 Test Credentials:');
    console.log('Password for all demo accounts: demo123\n');

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

checkDemoUsers();

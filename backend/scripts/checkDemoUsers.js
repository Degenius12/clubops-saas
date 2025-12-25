const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function checkDemoUsers() {
  console.log('🔍 Checking demo users...\n');

  const users = await prisma.clubUser.findMany({
    where: {
      email: {
        contains: 'demo.clubflow.com'
      }
    },
    select: {
      email: true,
      role: true,
      isActive: true,
      passwordHash: true
    }
  });

  console.log(`Found ${users.length} demo users:\n`);

  for (const user of users) {
    console.log(`Email: ${user.email}`);
    console.log(`Role: ${user.role}`);
    console.log(`Active: ${user.isActive}`);
    console.log(`Password Hash: ${user.passwordHash.substring(0, 30)}...`);

    // Test password
    const isMatch = await bcrypt.compare('demo123', user.passwordHash);
    console.log(`Password 'demo123' matches: ${isMatch ? '✅ YES' : '❌ NO'}`);
    console.log('');
  }

  await prisma.$disconnect();
}

checkDemoUsers().catch(console.error);

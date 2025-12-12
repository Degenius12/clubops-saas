const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function check() {
  const dancers = await p.dancer.findMany({ 
    select: { stageName: true, clubId: true, isActive: true }
  });
  console.log('Dancers:', JSON.stringify(dancers, null, 2));
  
  const clubs = await p.club.findMany({
    select: { id: true, name: true }
  });
  console.log('Clubs:', JSON.stringify(clubs, null, 2));
  
  const users = await p.clubUser.findFirst({
    where: { email: 'admin@clubops.com' },
    select: { clubId: true, email: true, role: true }
  });
  console.log('Admin User:', JSON.stringify(users, null, 2));
}

check().finally(() => p.$disconnect());

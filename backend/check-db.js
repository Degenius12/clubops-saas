const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  const clubs = await p.club.findMany({ select: { id: true, name: true } });
  console.log('Clubs:', JSON.stringify(clubs, null, 2));
  
  const users = await p.clubUser.findMany({ 
    select: { id: true, email: true, clubId: true, role: true } 
  });
  console.log('Users:', JSON.stringify(users, null, 2));
  
  const dancers = await p.dancer.findMany({
    select: { id: true, stageName: true, clubId: true }
  });
  console.log('Dancers:', JSON.stringify(dancers, null, 2));
}

main().then(() => p.$disconnect());

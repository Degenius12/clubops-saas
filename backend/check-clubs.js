const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('\n=== CLUBS ===');
  const clubs = await prisma.club.findMany();
  clubs.forEach(c => console.log(`Club: ${c.name} | ID: ${c.id}`));

  console.log('\n=== USERS ===');
  const users = await prisma.clubUser.findMany();
  users.forEach(u => console.log(`User: ${u.email} | ClubID: ${u.clubId} | Role: ${u.role}`));

  console.log('\n=== DANCERS ===');
  const dancers = await prisma.dancer.findMany();
  dancers.forEach(d => console.log(`Dancer: ${d.stageName} | ClubID: ${d.clubId} | QR: ${d.qrBadgeCode}`));
}

main().finally(() => prisma.$disconnect());

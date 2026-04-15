// Get webhook secret from database
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const club = await prisma.club.findFirst({
    where: { name: { contains: 'Demo' } },
    select: { id: true, name: true, doorCountWebhookSecret: true }
  });

  if (club) {
    console.log(club.doorCountWebhookSecret);
  }

  await prisma.$disconnect();
}

main();

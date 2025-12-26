const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function getClubId() {
  const club = await prisma.club.findFirst({
    where: { subdomain: 'demo' }
  });

  console.log('Club ID:', club.id);
  console.log('Club Name:', club.name);
  console.log('Subdomain:', club.subdomain);

  await prisma.$disconnect();
}

getClubId();

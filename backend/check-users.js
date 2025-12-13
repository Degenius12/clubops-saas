const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.clubUser.findMany({
    select: {
      email: true,
      role: true,
      firstName: true,
      lastName: true,
      isActive: true
    }
  });
  console.log('Users in database:');
  users.forEach(u => {
    console.log(`  - ${u.email} (${u.role}) - ${u.firstName} ${u.lastName} - Active: ${u.isActive}`);
  });
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());

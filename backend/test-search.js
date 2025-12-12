const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function testSearch() {
  const clubId = '58fb4430-cc2a-4d66-b4f1-86c5a0000780';
  const q = 'Amber';
  
  // Test 1: Simple search
  console.log('Test 1: Basic findMany for Amber');
  const test1 = await p.dancer.findMany({
    where: {
      clubId: clubId,
      stageName: { contains: 'Amber', mode: 'insensitive' }
    }
  });
  console.log('Result:', test1.length, 'dancers found');
  console.log(JSON.stringify(test1, null, 2));

  // Test 2: Check contains case
  console.log('\nTest 2: Contains with mode insensitive');
  const test2 = await p.dancer.findMany({
    where: {
      clubId: clubId,
      isActive: true,
      OR: [
        { stageName: { contains: q, mode: 'insensitive' } }
      ]
    }
  });
  console.log('Result:', test2.length, 'dancers found');
  
  // Test 3: Get all dancers for club
  console.log('\nTest 3: All dancers for club');
  const test3 = await p.dancer.findMany({
    where: { clubId: clubId },
    select: { stageName: true, isActive: true }
  });
  console.log('All dancers:', test3.map(d => d.stageName).join(', '));
}

testSearch().finally(() => p.$disconnect());

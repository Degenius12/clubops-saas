// Create financial transactions for testing revenue API
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createRevenueTestData() {
  console.log('💰 Creating Revenue Test Data...\n');

  try {
    // Get demo club
    const club = await prisma.club.findFirst({
      where: { name: { contains: 'Demo', mode: 'insensitive' } }
    });

    if (!club) {
      console.error('❌ Demo club not found');
      process.exit(1);
    }

    console.log(`✅ Found club: ${club.name} (${club.id})\n`);

    // Create transactions for today
    console.log('Creating today\'s transactions...');
    const today = new Date();
    today.setHours(10, 0, 0, 0); // Start at 10 AM

    const todayTransactions = [
      // Bar fees (using lowercase snake_case from dancers.js line 255)
      { type: 'bar_fee', amount: 85.00, hours: 0 },
      { type: 'bar_fee', amount: 120.00, hours: 2 },
      { type: 'bar_fee', amount: 95.50, hours: 4 },
      { type: 'bar_fee', amount: 110.00, hours: 6 },

      // VIP fees
      { type: 'vip_house_fee', amount: 180.00, hours: 1 },
      { type: 'vip_house_fee', amount: 240.00, hours: 3 },
      { type: 'vip_house_fee', amount: 360.00, hours: 5 },
      { type: 'vip_house_fee', amount: 200.00, hours: 7 },

      // Cover charges
      { type: 'cover_charge', amount: 25.00, hours: 1.5 },
      { type: 'cover_charge', amount: 25.00, hours: 2.5 },
      { type: 'cover_charge', amount: 25.00, hours: 3.5 },
      { type: 'cover_charge', amount: 30.00, hours: 4.5 },

      // Other
      { type: 'other', amount: 50.00, hours: 2 },
      { type: 'other', amount: 35.00, hours: 4 }
    ];

    for (const tx of todayTransactions) {
      const txTime = new Date(today);
      txTime.setHours(txTime.getHours() + tx.hours);

      await prisma.financialTransaction.create({
        data: {
          clubId: club.id,
          transactionType: tx.type,
          amount: tx.amount,
          status: 'PAID',
          description: `Test ${tx.type}`,
          createdAt: txTime
        }
      });
    }

    const todayTotal = todayTransactions.reduce((sum, tx) => sum + tx.amount, 0);
    console.log(`✅ Created ${todayTransactions.length} transactions for today`);
    console.log(`   Total: $${todayTotal.toFixed(2)}\n`);

    // Create transactions for yesterday
    console.log('Creating yesterday\'s transactions...');
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const yesterdayTransactions = [
      { type: 'bar_fee', amount: 75.00, hours: 0 },
      { type: 'bar_fee', amount: 105.00, hours: 2 },
      { type: 'vip_house_fee', amount: 160.00, hours: 1 },
      { type: 'vip_house_fee', amount: 220.00, hours: 3 },
      { type: 'cover_charge', amount: 25.00, hours: 1 },
      { type: 'cover_charge', amount: 25.00, hours: 2 },
      { type: 'other', amount: 40.00, hours: 2 }
    ];

    for (const tx of yesterdayTransactions) {
      const txTime = new Date(yesterday);
      txTime.setHours(txTime.getHours() + tx.hours);

      await prisma.financialTransaction.create({
        data: {
          clubId: club.id,
          transactionType: tx.type,
          amount: tx.amount,
          status: 'PAID',
          description: `Test ${tx.type}`,
          createdAt: txTime
        }
      });
    }

    const yesterdayTotal = yesterdayTransactions.reduce((sum, tx) => sum + tx.amount, 0);
    console.log(`✅ Created ${yesterdayTransactions.length} transactions for yesterday`);
    console.log(`   Total: $${yesterdayTotal.toFixed(2)}\n`);

    // Create transactions for the past week
    console.log('Creating past week transactions...');
    let weeklyCount = 0;
    for (let i = 2; i <= 7; i++) {
      const dayDate = new Date(today);
      dayDate.setDate(dayDate.getDate() - i);
      dayDate.setHours(12, 0, 0, 0);

      const dayAmount = 300 + (Math.random() * 400); // Random between $300-$700
      await prisma.financialTransaction.create({
        data: {
          clubId: club.id,
          transactionType: 'bar_fee',
          amount: dayAmount,
          status: 'PAID',
          description: `Daily aggregate for ${dayDate.toDateString()}`,
          createdAt: dayDate
        }
      });
      weeklyCount++;
    }

    console.log(`✅ Created ${weeklyCount} daily aggregates for past week\n`);

    // Create transactions for previous week
    console.log('Creating previous week transactions...');
    let prevWeekCount = 0;
    for (let i = 8; i <= 14; i++) {
      const dayDate = new Date(today);
      dayDate.setDate(dayDate.getDate() - i);
      dayDate.setHours(12, 0, 0, 0);

      const dayAmount = 250 + (Math.random() * 350); // Random between $250-$600
      await prisma.financialTransaction.create({
        data: {
          clubId: club.id,
          transactionType: 'bar_fee',
          amount: dayAmount,
          status: 'PAID',
          description: `Daily aggregate for ${dayDate.toDateString()}`,
          createdAt: dayDate
        }
      });
      prevWeekCount++;
    }

    console.log(`✅ Created ${prevWeekCount} daily aggregates for previous week\n`);

    // Create transactions for this month
    console.log('Creating monthly transactions...');
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const currentDay = today.getDate();

    let monthlyCount = 0;
    for (let day = 1; day < currentDay - 7; day++) { // Don't overlap with weekly data
      const dayDate = new Date(today.getFullYear(), today.getMonth(), day);
      dayDate.setHours(12, 0, 0, 0);

      const dayAmount = 400 + (Math.random() * 500); // Random between $400-$900
      await prisma.financialTransaction.create({
        data: {
          clubId: club.id,
          transactionType: 'vip_house_fee',
          amount: dayAmount,
          status: 'PAID',
          description: `Monthly aggregate for ${dayDate.toDateString()}`,
          createdAt: dayDate
        }
      });
      monthlyCount++;
    }

    console.log(`✅ Created ${monthlyCount} daily aggregates for this month\n`);

    // Summary
    console.log('═══════════════════════════════════════════════════');
    console.log('  Revenue Test Data Summary');
    console.log('═══════════════════════════════════════════════════');
    console.log(`  Today: ${todayTransactions.length} transactions = $${todayTotal.toFixed(2)}`);
    console.log(`  Yesterday: ${yesterdayTransactions.length} transactions = $${yesterdayTotal.toFixed(2)}`);
    console.log(`  Comparison: ${((todayTotal - yesterdayTotal) / yesterdayTotal * 100).toFixed(1)}%`);
    console.log(`  Past Week: ${weeklyCount} days`);
    console.log(`  Previous Week: ${prevWeekCount} days`);
    console.log(`  This Month: ${monthlyCount} days`);
    console.log('═══════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Error creating test data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createRevenueTestData();

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Helper to create dates in the past
const daysAgo = (days, hours = 0, minutes = 0) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(date.getHours() - hours);
  date.setMinutes(date.getMinutes() - minutes);
  return date;
};

// Sample dancer names and stage names
const dancers = [
  { legalName: 'Amber Rose', stageName: 'Diamond' },
  { legalName: 'Crystal Waters', stageName: 'Starlight' },
  { legalName: 'Ruby Stone', stageName: 'Sapphire' },
  { legalName: 'Jade Green', stageName: 'Emerald' },
  { legalName: 'Pearl White', stageName: 'Angel' },
  { legalName: 'Scarlett Fox', stageName: 'Phoenix' },
  { legalName: 'Raven Black', stageName: 'Mystique' },
  { legalName: 'Luna Silver', stageName: 'Moonlight' },
  { legalName: 'Aurora Dawn', stageName: 'Sunshine' },
  { legalName: 'Bella Rose', stageName: 'Velvet' }
];

// VIP booth data
const vipBooths = [
  { boothName: 'VIP Suite', boothNumber: 1, capacity: 8, songRate: 20.00 },
  { boothName: 'VIP Suite', boothNumber: 2, capacity: 6, songRate: 20.00 },
  { boothName: 'Diamond Lounge', boothNumber: 3, capacity: 12, songRate: 25.00 },
  { boothName: 'Platinum Room', boothNumber: 4, capacity: 10, songRate: 25.00 },
  { boothName: 'Executive Suite', boothNumber: 5, capacity: 15, songRate: 30.00 }
];

// Transaction types and amounts
// Using valid transaction types from database check constraint
const transactionTypes = [
  { type: 'bar_fee', category: 'bar_fee', amountRange: [50, 50] }, // Standard bar fee
  { type: 'vip_room', category: 'vip_room', amountRange: [200, 500] }, // VIP session fees
  { type: 'tip_out', category: 'tip_out', amountRange: [20, 100] }, // Tip outs
  { type: 'bonus', category: 'bonus', amountRange: [50, 200] }, // Performance bonuses
  { type: 'penalty', category: 'penalty', amountRange: [10, 50] } // Late fees, violations
];

async function seedDemoData() {
  console.log('🌱 Starting demo data seeding...\n');

  try {
    // Find demo club
    const demoClub = await prisma.club.findFirst({
      where: { subdomain: 'demo' }
    });

    if (!demoClub) {
      console.log('❌ Demo club not found. Please create the club first.');
      return;
    }

    console.log(`✅ Found demo club: ${demoClub.name} (${demoClub.id})\n`);

    // Find demo manager
    const manager = await prisma.clubUser.findFirst({
      where: {
        clubId: demoClub.id,
        role: 'MANAGER'
      }
    });

    if (!manager) {
      console.log('❌ Demo manager not found.');
      return;
    }

    console.log(`✅ Found manager: ${manager.firstName} ${manager.lastName}\n`);

    // ===================================================================
    // 1. CREATE DANCERS
    // ===================================================================
    console.log('👯 Creating dancers...');
    const createdDancers = [];

    for (const dancer of dancers) {
      const existing = await prisma.dancer.findFirst({
        where: {
          clubId: demoClub.id,
          stageName: dancer.stageName
        }
      });

      if (existing) {
        console.log(`   ⏭️  ${dancer.stageName} already exists`);
        createdDancers.push(existing);
      } else {
        const newDancer = await prisma.dancer.create({
          data: {
            clubId: demoClub.id,
            legalName: dancer.legalName,
            stageName: dancer.stageName,
            email: `${dancer.stageName.toLowerCase()}@demo.dancers.com`,
            phone: `555-${Math.floor(Math.random() * 900 + 100)}-${Math.floor(Math.random() * 9000 + 1000)}`,
            isActive: true
          }
        });
        console.log(`   ✅ Created ${newDancer.stageName}`);
        createdDancers.push(newDancer);
      }
    }

    console.log(`\n✅ Total dancers: ${createdDancers.length}\n`);

    // ===================================================================
    // 2. CREATE VIP BOOTHS
    // ===================================================================
    console.log('🏛️  Creating VIP booths...');
    const createdBooths = [];

    for (const booth of vipBooths) {
      const existing = await prisma.vipBooth.findFirst({
        where: {
          clubId: demoClub.id,
          boothNumber: booth.boothNumber
        }
      });

      if (existing) {
        console.log(`   ⏭️  ${booth.boothName} #${booth.boothNumber} already exists`);
        createdBooths.push(existing);
      } else {
        const newBooth = await prisma.vipBooth.create({
          data: {
            clubId: demoClub.id,
            boothName: booth.boothName,
            boothNumber: booth.boothNumber,
            capacity: booth.capacity,
            songRate: booth.songRate,
            isActive: true
          }
        });
        console.log(`   ✅ Created ${newBooth.boothName} #${newBooth.boothNumber} ($${newBooth.songRate}/song)`);
        createdBooths.push(newBooth);
      }
    }

    console.log(`\n✅ Total VIP booths: ${createdBooths.length}\n`);

    // ===================================================================
    // 3. CREATE PAST SHIFTS WITH DATA
    // ===================================================================
    console.log('🕐 Creating past shifts with realistic data...\n');

    const shiftsData = [
      {
        level: 1,
        name: 'Day Shift',
        daysAgo: 5,
        startHour: 12,
        durationHours: 8,
        dancerCount: 4,
        vipSessionCount: 2,
        transactionCount: 25,
        notes: 'Slow start but picked up in the afternoon. Good crowd for a weekday.'
      },
      {
        level: 2,
        name: 'Evening Shift',
        daysAgo: 4,
        startHour: 20,
        durationHours: 6,
        dancerCount: 6,
        vipSessionCount: 3,
        transactionCount: 40,
        notes: 'Steady flow all night. Two bachelor parties, both spent well in VIP.'
      },
      {
        level: 3,
        name: 'Friday Night',
        daysAgo: 2,
        startHour: 22,
        durationHours: 7,
        dancerCount: 8,
        vipSessionCount: 5,
        transactionCount: 65,
        notes: 'Excellent Friday night! Packed house, bottle service was strong. Diamond booth hit $1200.'
      },
      {
        level: 2,
        name: 'Saturday Day',
        daysAgo: 1,
        startHour: 14,
        durationHours: 8,
        dancerCount: 5,
        vipSessionCount: 2,
        transactionCount: 30,
        notes: 'Slower Saturday day shift. Regulars came in around 6pm.'
      },
      {
        level: 4,
        name: 'Saturday Night - Premium',
        daysAgo: 1,
        startHour: 22,
        durationHours: 8,
        dancerCount: 10,
        vipSessionCount: 6,
        transactionCount: 85,
        notes: 'HUGE Saturday night! Executive Suite and Diamond Lounge both maxed out. Multiple bottle packages sold. Best night this month!'
      }
    ];

    for (const shiftData of shiftsData) {
      const shiftStart = daysAgo(shiftData.daysAgo, 24 - shiftData.startHour);
      const shiftEnd = new Date(shiftStart);
      shiftEnd.setHours(shiftEnd.getHours() + shiftData.durationHours);

      // Create shift
      const shift = await prisma.shift.create({
        data: {
          clubId: demoClub.id,
          userId: manager.id,
          role: manager.role,
          shiftLevel: shiftData.level,
          shiftName: shiftData.name,
          startedAt: shiftStart,
          endedAt: shiftEnd,
          status: 'COMPLETED',
          notes: shiftData.notes,
          closedBy: manager.id
        }
      });

      console.log(`   📅 Shift: ${shift.shiftName} (Level ${shift.shiftLevel})`);
      console.log(`      ${shiftStart.toLocaleString()} - ${shiftEnd.toLocaleString()}`);

      // Create dancer check-ins for this shift
      const shiftDancers = createdDancers
        .sort(() => 0.5 - Math.random())
        .slice(0, shiftData.dancerCount);

      let totalCheckIns = 0;
      for (const dancer of shiftDancers) {
        const checkInTime = new Date(shiftStart);
        checkInTime.setMinutes(checkInTime.getMinutes() + Math.floor(Math.random() * 60));

        const checkOutTime = new Date(shiftEnd);
        checkOutTime.setMinutes(checkOutTime.getMinutes() - Math.floor(Math.random() * 30));

        await prisma.dancerCheckIn.create({
          data: {
            clubId: demoClub.id,
            dancerId: dancer.id,
            shiftId: shift.id,
            performedById: manager.id,
            checkInMethod: 'NAME_SEARCH',
            checkedInAt: checkInTime,
            checkedOutAt: checkOutTime,
            barFeeAmount: 50.00,
            barFeeStatus: 'PAID',
            barFeePaidAt: checkOutTime,
            licenseVerified: true,
            status: 'CHECKED_OUT'
          }
        });
        totalCheckIns++;
      }

      console.log(`      ✅ ${totalCheckIns} dancer check-ins`);

      // Create VIP sessions for this shift
      let totalVipSessions = 0;
      const sessionBooths = createdBooths
        .sort(() => 0.5 - Math.random())
        .slice(0, shiftData.vipSessionCount);

      for (const booth of sessionBooths) {
        const sessionStart = new Date(shiftStart);
        sessionStart.setHours(sessionStart.getHours() + Math.floor(Math.random() * 3));

        const sessionDuration = Math.floor(Math.random() * 180) + 60; // 60-240 minutes
        const sessionEnd = new Date(sessionStart);
        sessionEnd.setMinutes(sessionEnd.getMinutes() + sessionDuration);

        // Pick a random dancer for this session
        const sessionDancer = shiftDancers[Math.floor(Math.random() * shiftDancers.length)];

        const songCount = Math.floor(sessionDuration / 3); // ~3 min per song
        const songRate = booth.songRate || 20.00; // Use booth's song rate
        const houseFeeOwed = songCount * songRate * 0.5; // 50% house fee

        await prisma.vipSession.create({
          data: {
            clubId: demoClub.id,
            boothId: booth.id,
            dancerId: sessionDancer.id,
            shiftId: shift.id,
            startedById: manager.id,
            endedById: manager.id,
            customerName: `Guest ${Math.floor(Math.random() * 1000)}`,
            startedAt: sessionStart,
            endedAt: sessionEnd,
            durationMinutes: sessionDuration,
            songCountManual: songCount,
            songCountDjSync: songCount,
            songCountByTime: songCount,
            songCountFinal: songCount,
            songRate,
            houseFeeOwed,
            houseFeeStatus: 'PAID',
            verificationStatus: 'VERIFIED',
            customerConfirmed: true,
            customerConfirmedAt: sessionEnd
          }
        });
        totalVipSessions++;
      }

      console.log(`      ✅ ${totalVipSessions} VIP sessions`);

      // Create financial transactions for this shift
      let totalRevenue = 0;
      for (let i = 0; i < shiftData.transactionCount; i++) {
        const txType = transactionTypes[Math.floor(Math.random() * transactionTypes.length)];
        const [min, max] = txType.amountRange;
        const amount = Math.floor(Math.random() * (max - min + 1)) + min;

        const txTime = new Date(shiftStart);
        txTime.setMinutes(txTime.getMinutes() + Math.floor(Math.random() * shiftData.durationHours * 60));

        await prisma.financialTransaction.create({
          data: {
            clubId: demoClub.id,
            transactionType: txType.type,
            category: txType.category,
            amount,
            description: `${txType.category.replace('_', ' ')} - Shift ${shift.shiftLevel}`,
            paymentMethod: Math.random() > 0.3 ? 'card' : 'cash',
            status: 'PAID',
            paidAt: txTime,
            recordedBy: manager.id,
            createdAt: txTime
          }
        });

        totalRevenue += amount;
      }

      console.log(`      ✅ ${shiftData.transactionCount} transactions`);

      // Update shift with totals
      await prisma.shift.update({
        where: { id: shift.id },
        data: {
          totalCheckIns,
          totalVipSessions,
          totalRevenue,
          eosReport: {
            totalRevenue,
            totalCheckIns,
            totalVipSessions,
            transactionCount: shiftData.transactionCount,
            duration: shiftData.durationHours * 60,
            managerName: `${manager.firstName} ${manager.lastName}`,
            averageTransaction: totalRevenue / shiftData.transactionCount
          }
        }
      });

      console.log(`      💰 Total Revenue: $${totalRevenue.toFixed(2)}`);
      console.log(`      ⏱️  Duration: ${shiftData.durationHours} hours\n`);
    }

    // ===================================================================
    // SUMMARY
    // ===================================================================
    console.log('═══════════════════════════════════════════════════════════');
    console.log('✅ DEMO DATA SEEDING COMPLETE!');
    console.log('═══════════════════════════════════════════════════════════\n');

    console.log('📊 Summary:');
    console.log(`   Dancers: ${createdDancers.length}`);
    console.log(`   VIP Booths: ${createdBooths.length}`);
    console.log(`   Past Shifts: ${shiftsData.length}`);

    const totalTransactions = await prisma.financialTransaction.count({
      where: { clubId: demoClub.id }
    });

    const totalRevenueData = await prisma.financialTransaction.aggregate({
      _sum: { amount: true },
      where: { clubId: demoClub.id }
    });

    console.log(`   Total Transactions: ${totalTransactions}`);
    console.log(`   Total Revenue: $${totalRevenueData._sum.amount.toFixed(2)}\n`);

    console.log('🎬 Demo Scenario Ready!');
    console.log('═══════════════════════════════════════════════════════════\n');

    console.log('📝 Next Steps:');
    console.log('1. Login as manager@demo.clubflow.com');
    console.log('2. View dashboard with shift history');
    console.log('3. Open a new shift to demonstrate workflow');
    console.log('4. Close shift and view EOS report\n');

  } catch (error) {
    console.error('❌ Error seeding demo data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run seeding
seedDemoData()
  .then(() => {
    console.log('✨ Seeding script completed successfully!\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Seeding script failed:', error);
    process.exit(1);
  });

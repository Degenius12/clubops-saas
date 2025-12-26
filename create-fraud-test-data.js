// Create intentionally suspicious VIP sessions to test fraud detection
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createFraudTestData() {
  console.log('🎭 Creating Test Data with Intentional Anomalies...\n');

  try {
    // Get demo club
    const club = await prisma.club.findFirst({
      where: { name: { contains: 'Demo', mode: 'insensitive' } }
    });

    if (!club) {
      console.error('❌ Demo club not found');
      process.exit(1);
    }

    // Get a VIP booth
    const booth = await prisma.vipBooth.findFirst({
      where: { clubId: club.id }
    });

    // Get a dancer
    const dancer = await prisma.dancer.findFirst({
      where: { clubId: club.id }
    });

    // Get VIP host (user)
    const vipHost = await prisma.clubUser.findFirst({
      where: { clubId: club.id, role: 'VIP_HOST' }
    });

    if (!vipHost) {
      console.log('⚠️  No VIP_HOST found, creating one...');
      const manager = await prisma.clubUser.findFirst({
        where: { clubId: club.id }
      });

      if (manager) {
        await prisma.clubUser.update({
          where: { id: manager.id },
          data: { role: 'VIP_HOST' }
        });
        console.log('✅ Updated user to VIP_HOST role\n');
      }
    }

    // Get shift
    const shift = await prisma.shift.findFirst({
      where: { clubId: club.id, status: 'COMPLETED' }
    });

    console.log('📍 Creating 5 suspicious VIP sessions...\n');

    const now = new Date();
    const baseDate = new Date(now);
    baseDate.setDate(baseDate.getDate() - 5);

    // 1. CRITICAL: Huge variance (manual: 20, time: 5 songs)
    console.log('1. Creating CRITICAL variance session (20 vs 5 songs)...');
    await prisma.vipSession.create({
      data: {
        clubId: club.id,
        boothId: booth.id,
        dancerId: dancer.id,
        shiftId: shift.id,
        startedById: vipHost?.id || shift.userId,

        startedAt: new Date(baseDate.getTime()),
        endedAt: new Date(baseDate.getTime() + 15 * 60 * 1000), // 15 min
        durationMinutes: 15,

        songCountManual: 20, // VIP host entered 20
        songCountByTime: 5,  // Time calculation says 5
        songCountDjSync: 6,  // DJ system says 6
        songCountFinal: 20,  // Final count used the inflated manual count
        songRate: 20.00,     // $20 per song

        verificationStatus: 'PENDING_REVIEW',
        status: 'COMPLETED'
      }
    });

    // 2. HIGH: Significant variance with override
    console.log('2. Creating HIGH variance session with manual override...');
    const manager = await prisma.clubUser.findFirst({
      where: { clubId: club.id, role: { in: ['MANAGER', 'SUPER_MANAGER', 'OWNER'] } }
    });

    await prisma.vipSession.create({
      data: {
        clubId: club.id,
        boothId: booth.id,
        dancerId: dancer.id,
        shiftId: shift.id,
        startedById: vipHost?.id || shift.userId,

        startedAt: new Date(baseDate.getTime() + 60 * 60 * 1000),
        endedAt: new Date(baseDate.getTime() + 80 * 60 * 1000), // 20 min
        durationMinutes: 20,

        songCountManual: 15,
        songCountByTime: 6,
        songCountDjSync: 7,
        songCountFinal: 15,
        songRate: 20.00,

        overrideById: manager?.id,
        overrideReason: 'Customer insisted on higher count',

        verificationStatus: 'PENDING_REVIEW',
        status: 'COMPLETED'
      }
    });

    // 3. MEDIUM: Pattern - always rounding up
    console.log('3-5. Creating pattern sessions (systematic rounding up)...');
    for (let i = 0; i < 3; i++) {
      const sessionDate = new Date(baseDate.getTime() + (i + 2) * 60 * 60 * 1000);
      await prisma.vipSession.create({
        data: {
          clubId: club.id,
          boothId: booth.id,
          dancerId: dancer.id,
          shiftId: shift.id,
          startedById: vipHost?.id || shift.userId,

          startedAt: sessionDate,
          endedAt: new Date(sessionDate.getTime() + 18 * 60 * 1000),
          durationMinutes: 18,

          songCountManual: 7,      // Always rounds up
          songCountByTime: 6.2,    // Time says 6.2
          songCountDjSync: 6,      // DJ says 6
          songCountFinal: 7,       // Uses rounded up value
          songRate: 20.00,

          verificationStatus: 'PENDING_REVIEW',
          status: 'COMPLETED'
        }
      });
    }

    console.log('\n✅ Created 5 suspicious VIP sessions!');
    console.log('\n📊 Expected Anomalies:');
    console.log('   - 1 CRITICAL: Huge variance (20 vs 5 songs)');
    console.log('   - 1 HIGH: Significant variance with override');
    console.log('   - 1 MEDIUM: Pattern detection (systematic rounding up)\n');
    console.log('💡 Run fraud detection now: node test-fraud-detection.js\n');

  } catch (error) {
    console.error('❌ Error creating test data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createFraudTestData();

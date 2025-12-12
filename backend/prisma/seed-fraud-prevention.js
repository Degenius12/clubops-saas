// ClubOps Fraud Prevention Seed Script
// Seeds test data for Door Staff, VIP Host, and Security Dashboard testing

const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const prisma = new PrismaClient();

// Helper to generate hash for audit log chain
function generateHash(data, previousHash = null) {
  const content = JSON.stringify(data) + (previousHash || '');
  return crypto.createHash('sha256').update(content).digest('hex');
}

async function main() {
  console.log('🌱 Starting Fraud Prevention Seed...\n');

  // First, find existing club and owner user
  const existingClub = await prisma.club.findFirst();
  
  if (!existingClub) {
    console.log('❌ No club found. Please create a club first via the app.');
    return;
  }

  console.log(`✅ Found club: ${existingClub.name} (${existingClub.id})`);
  const clubId = existingClub.id;

  // Find existing owner user
  let ownerUser = await prisma.clubUser.findFirst({
    where: { clubId, role: 'OWNER' }
  });
  
  if (!ownerUser) {
    // Just get any user from this club
    ownerUser = await prisma.clubUser.findFirst({
      where: { clubId }
    });
  }

  if (!ownerUser) {
    console.log('❌ No user found for this club. Please register a user first.');
    return;
  }

  console.log(`✅ Found owner: ${ownerUser.email}`);

  // ============================================
  // 1. CREATE ADDITIONAL STAFF USERS
  // ============================================
  console.log('\n📋 Creating staff users...');

  // Real bcrypt hash for password 'Demo123!'
  const demoPasswordHash = '$2a$10$yYI6u6bEhaFmVzVMUtLisuAv8qceeKa4us6t2Umbb5iJiVta9Kwhm';
  
  const doorStaffUser = await prisma.clubUser.upsert({
    where: { clubId_email: { clubId, email: 'doorstaff@demo.com' } },
    update: { passwordHash: demoPasswordHash },
    create: {
      clubId,
      email: 'doorstaff@demo.com',
      passwordHash: demoPasswordHash,
      role: 'DOOR_STAFF',
      firstName: 'Mike',
      lastName: 'Doorman',
      pin: '1234',
      isActive: true
    }
  });
  console.log(`  ✓ Door Staff: ${doorStaffUser.email}`);

  const vipHostUser = await prisma.clubUser.upsert({
    where: { clubId_email: { clubId, email: 'viphost@demo.com' } },
    update: { passwordHash: demoPasswordHash },
    create: {
      clubId,
      email: 'viphost@demo.com',
      passwordHash: demoPasswordHash,
      role: 'VIP_HOST',
      firstName: 'Sarah',
      lastName: 'VIPHost',
      pin: '5678',
      isActive: true
    }
  });
  console.log(`  ✓ VIP Host: ${vipHostUser.email}`);

  // ============================================
  // 2. CREATE VIP BOOTHS
  // ============================================
  console.log('\n🛋️ Creating VIP booths...');

  const boothsData = [
    { boothName: 'Champagne Room', boothNumber: 1, capacity: 6, songRate: 35.00 },
    { boothName: 'Diamond Suite', boothNumber: 2, capacity: 4, songRate: 40.00 },
    { boothName: 'Platinum Lounge', boothNumber: 3, capacity: 8, songRate: 30.00 },
    { boothName: 'VIP Booth 4', boothNumber: 4, capacity: 4, songRate: 30.00 },
    { boothName: 'VIP Booth 5', boothNumber: 5, capacity: 4, songRate: 30.00, isAvailable: false },
  ];

  for (const booth of boothsData) {
    await prisma.vipBooth.upsert({
      where: { clubId_boothNumber: { clubId, boothNumber: booth.boothNumber } },
      update: { ...booth },
      create: { clubId, ...booth }
    });
  }
  console.log(`  ✓ Created ${boothsData.length} VIP booths`);

  // ============================================
  // 3. CREATE DANCERS WITH VARIOUS STATUSES
  // ============================================
  console.log('\n💃 Creating dancers...');

  const dancersData = [
    { stageName: 'Crystal', legalName: 'Jane Smith', licenseStatus: 'valid', licenseExpiryDate: new Date('2026-06-15'), qrBadgeCode: 'CRYS001' },
    { stageName: 'Diamond', legalName: 'Sarah Johnson', licenseStatus: 'valid', licenseExpiryDate: new Date('2025-12-20'), qrBadgeCode: 'DIAM002' },
    { stageName: 'Ruby', legalName: 'Emily Davis', licenseStatus: 'valid', licenseExpiryDate: new Date('2025-01-15'), qrBadgeCode: 'RUBY003' }, // Expiring soon but status valid
    { stageName: 'Sapphire', legalName: 'Lisa Wilson', licenseStatus: 'valid', licenseExpiryDate: new Date('2026-03-22'), qrBadgeCode: 'SAPH004' },
    { stageName: 'Emerald', legalName: 'Amy Brown', licenseStatus: 'valid', licenseExpiryDate: new Date('2025-09-10'), qrBadgeCode: 'EMER005' },
    { stageName: 'Pearl', legalName: 'Nicole Taylor', licenseStatus: 'expired', licenseExpiryDate: new Date('2024-11-30'), qrBadgeCode: 'PERL006' },
    { stageName: 'Jade', legalName: 'Michelle Lee', licenseStatus: 'valid', licenseExpiryDate: new Date('2026-01-05'), qrBadgeCode: 'JADE007' },
    { stageName: 'Amber', legalName: 'Rachel Martinez', licenseStatus: 'pending', licenseExpiryDate: null, qrBadgeCode: 'AMBR008' },
  ];

  const dancers = [];
  for (const dancer of dancersData) {
    const created = await prisma.dancer.upsert({
      where: { qrBadgeCode: dancer.qrBadgeCode },
      update: { ...dancer, clubId },
      create: { clubId, ...dancer, qrBadgeIssuedAt: new Date() }
    });
    dancers.push(created);
  }
  console.log(`  ✓ Created ${dancers.length} dancers`);

  // ============================================
  // 4. CREATE ACTIVE SHIFT FOR TESTING
  // ============================================
  console.log('\n⏱️ Creating active shift...');

  // End any existing active shifts first
  await prisma.shift.updateMany({
    where: { clubId, status: 'ACTIVE' },
    data: { status: 'COMPLETED', endedAt: new Date() }
  });

  const activeShift = await prisma.shift.create({
    data: {
      clubId,
      userId: doorStaffUser.id,
      role: 'DOOR_STAFF',
      status: 'ACTIVE',
      startedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // Started 2 hours ago
    }
  });
  console.log(`  ✓ Active shift created: ${activeShift.id}`);

  // Create cash drawer for shift
  await prisma.cashDrawer.create({
    data: {
      clubId,
      shiftId: activeShift.id,
      userId: doorStaffUser.id,
      station: 'DOOR',
      openingBalance: 200.00,
    }
  });
  console.log('  ✓ Cash drawer opened with $200');

  // ============================================
  // 5. CREATE DANCER CHECK-INS
  // ============================================
  console.log('\n✅ Creating dancer check-ins...');

  // Check in first 5 dancers
  for (let i = 0; i < 5; i++) {
    const dancer = dancers[i];
    await prisma.dancerCheckIn.create({
      data: {
        clubId,
        dancerId: dancer.id,
        shiftId: activeShift.id,
        performedById: doorStaffUser.id,
        status: 'CHECKED_IN',
        checkInMethod: i % 2 === 0 ? 'QR_SCAN' : 'NAME_SEARCH',
        checkedInAt: new Date(Date.now() - (90 - i * 15) * 60 * 1000), // Staggered check-ins
        barFeeAmount: 50.00,
        barFeeStatus: i < 3 ? 'PAID' : 'PENDING',
        barFeePaidAt: i < 3 ? new Date() : null,
        licenseVerified: true,
        licenseAlert: dancer.licenseStatus === 'expiring_soon' ? 'EXPIRING_SOON' : null,
      }
    });
  }
  console.log('  ✓ 5 dancers checked in (3 paid bar fee, 2 pending)');

  // Check out 2 dancers (departed)
  for (let i = 5; i < 7; i++) {
    const dancer = dancers[i];
    if (dancer.licenseStatus !== 'expired') {
      await prisma.dancerCheckIn.create({
        data: {
          clubId,
          dancerId: dancer.id,
          shiftId: activeShift.id,
          performedById: doorStaffUser.id,
          status: 'CHECKED_OUT',
          checkInMethod: 'QR_SCAN',
          checkedInAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
          checkedOutAt: new Date(Date.now() - 30 * 60 * 1000),
          barFeeAmount: 50.00,
          barFeeStatus: 'PAID',
          barFeePaidAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
          licenseVerified: true,
        }
      });
    }
  }
  console.log('  ✓ 2 dancers checked out (departed)');

  // ============================================
  // 6. CREATE VIP SESSIONS (with some discrepancies)
  // ============================================
  console.log('\n🌟 Creating VIP sessions...');

  // Get the booths we created
  const booths = await prisma.vipBooth.findMany({ where: { clubId } });

  // Completed session - NORMAL (no discrepancy)
  const session1 = await prisma.vipSession.create({
    data: {
      clubId,
      boothId: booths[0].id,
      dancerId: dancers[0].id,
      startedById: vipHostUser.id,
      endedById: vipHostUser.id,
      startedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      endedAt: new Date(Date.now() - 90 * 60 * 1000),
      durationMinutes: 30,
      songCountManual: 8,
      songCountDjSync: 8,
      songCountByTime: 8,
      songCountFinal: 8,
      verificationStatus: 'VERIFIED',
      discrepancyAmount: 0,
      customerConfirmed: true,
      customerConfirmedAt: new Date(Date.now() - 90 * 60 * 1000),
      songRate: 35.00,
      houseFeeOwed: 280.00,
      houseFeeStatus: 'PAID',
      houseFeePaidAt: new Date(Date.now() - 85 * 60 * 1000),
      paymentMethod: 'CASH',
      status: 'COMPLETED',
    }
  });
  console.log('  ✓ Session 1: Completed - VERIFIED (8 songs, $280)');

  // Completed session - DISCREPANCY (manual count higher than DJ sync)
  const session2 = await prisma.vipSession.create({
    data: {
      clubId,
      boothId: booths[1].id,
      dancerId: dancers[1].id,
      startedById: vipHostUser.id,
      endedById: vipHostUser.id,
      startedAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
      endedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      durationMinutes: 60,
      songCountManual: 18, // VIP Host reported 18
      songCountDjSync: 15, // DJ system only logged 15
      songCountByTime: 16, // Time calculation says 16
      songCountFinal: 15, // Used DJ count
      verificationStatus: 'MISMATCH',
      discrepancyAmount: 3, // 3 songs difference
      customerConfirmed: true,
      customerConfirmedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      customerDisputed: false,
      songRate: 40.00,
      houseFeeOwed: 600.00, // Based on DJ count (15 * 40)
      houseFeeStatus: 'PAID',
      houseFeePaidAt: new Date(Date.now() - 115 * 60 * 1000),
      paymentMethod: 'CARD',
      status: 'COMPLETED',
    }
  });
  console.log('  ✓ Session 2: Completed - MISMATCH (18 manual vs 15 DJ = 3 song discrepancy)');

  // Completed session - DISPUTED by customer
  const session3 = await prisma.vipSession.create({
    data: {
      clubId,
      boothId: booths[2].id,
      dancerId: dancers[2].id,
      startedById: vipHostUser.id,
      endedById: vipHostUser.id,
      startedAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
      endedAt: new Date(Date.now() - 3.5 * 60 * 60 * 1000),
      durationMinutes: 30,
      songCountManual: 12,
      songCountDjSync: 9,
      songCountByTime: 8,
      songCountFinal: 10, // Negotiated
      verificationStatus: 'PENDING_REVIEW',
      discrepancyAmount: 3,
      customerConfirmed: false,
      customerDisputed: true,
      disputeReason: 'Customer claims only 8 songs played, not 12',
      songRate: 30.00,
      houseFeeOwed: 300.00,
      houseFeeStatus: 'DISPUTED',
      status: 'DISPUTED',
    }
  });
  console.log('  ✓ Session 3: DISPUTED - Customer claims fewer songs');

  // ACTIVE session (currently ongoing)
  const session4 = await prisma.vipSession.create({
    data: {
      clubId,
      boothId: booths[0].id,
      dancerId: dancers[3].id,
      startedById: vipHostUser.id,
      startedAt: new Date(Date.now() - 25 * 60 * 1000), // Started 25 min ago
      songCountManual: 6,
      songRate: 35.00,
      status: 'ACTIVE',
    }
  });
  console.log('  ✓ Session 4: ACTIVE - In progress (6 songs so far)');

  // ============================================
  // 7. CREATE AUDIT LOG ENTRIES
  // ============================================
  console.log('\n📝 Creating audit log entries...');

  let previousHash = null;

  // Check-in audit entry
  const auditData1 = { action: 'CREATE', entityType: 'DANCER_CHECK_IN', timestamp: new Date().toISOString() };
  const audit1 = await prisma.auditLog.create({
    data: {
      clubId,
      userId: doorStaffUser.id,
      action: 'CREATE',
      entityType: 'DANCER_CHECK_IN',
      entityId: null,
      newData: { dancerName: 'Crystal', checkInMethod: 'QR_SCAN', barFeeStatus: 'PAID' },
      changesSummary: 'Dancer Crystal checked in via QR scan',
      previousHash: null,
      currentHash: generateHash(auditData1),
      isHighRisk: false,
    }
  });
  previousHash = audit1.currentHash;

  // VIP session created
  const auditData2 = { action: 'CREATE', entityType: 'VIP_SESSION', timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString() };
  const audit2 = await prisma.auditLog.create({
    data: {
      clubId,
      userId: vipHostUser.id,
      action: 'CREATE',
      entityType: 'VIP_SESSION',
      entityId: session4.id,
      newData: { boothName: 'Champagne Room', dancerName: 'Sapphire', songRate: 35.00 },
      changesSummary: 'VIP session started in Champagne Room with Sapphire',
      previousHash: previousHash,
      currentHash: generateHash(auditData2, previousHash),
      isHighRisk: false,
    }
  });
  previousHash = audit2.currentHash;

  // Discrepancy detected - HIGH RISK
  const auditData3 = { action: 'DISCREPANCY_DETECTED', entityType: 'VIP_SESSION', timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() };
  const audit3 = await prisma.auditLog.create({
    data: {
      clubId,
      userId: null,
      action: 'DISCREPANCY_DETECTED',
      entityType: 'VIP_SESSION',
      entityId: session2.id,
      previousData: { songCountManual: 18 },
      newData: { songCountDjSync: 15, discrepancy: 3 },
      changesSummary: 'Song count discrepancy: VIP Host reported 18, DJ system logged 15 (difference: 3)',
      previousHash: previousHash,
      currentHash: generateHash(auditData3, previousHash),
      isHighRisk: true,
      flaggedReason: 'Song count variance exceeds threshold',
    }
  });
  previousHash = audit3.currentHash;

  // Override action - HIGH RISK
  const auditData4 = { action: 'OVERRIDE', entityType: 'VIP_SESSION', timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString() };
  await prisma.auditLog.create({
    data: {
      clubId,
      userId: ownerUser.id,
      action: 'OVERRIDE',
      entityType: 'VIP_SESSION',
      entityId: session2.id,
      previousData: { songCountFinal: 18 },
      newData: { songCountFinal: 15, overrideReason: 'Using DJ count as authoritative source' },
      changesSummary: 'Owner approved override: Changed final count from 18 to 15',
      previousHash: previousHash,
      currentHash: generateHash(auditData4, previousHash),
      isHighRisk: true,
      flaggedReason: 'Manual override of song count',
    }
  });

  console.log('  ✓ 4 audit log entries created (2 high-risk flagged)');

  // ============================================
  // 8. CREATE VERIFICATION ALERTS
  // ============================================
  console.log('\n⚠️ Creating verification alerts...');

  // Song mismatch alert - OPEN
  await prisma.verificationAlert.create({
    data: {
      clubId,
      alertType: 'VIP_SONG_MISMATCH',
      severity: 'HIGH',
      status: 'OPEN',
      entityType: 'VIP_SESSION',
      entityId: session2.id,
      title: 'Song Count Discrepancy Detected',
      description: 'Manual count (18) exceeds DJ system count (15) by 3 songs in Diamond Suite session',
      expectedValue: '15 songs (DJ system)',
      actualValue: '18 songs (VIP Host)',
      discrepancy: '3 songs ($120 potential overcharge)',
      involvedUserId: vipHostUser.id,
      involvedDancerId: dancers[1].id,
      visibleToOwnerOnly: true,
    }
  });

  // License expiring alert - OPEN
  await prisma.verificationAlert.create({
    data: {
      clubId,
      alertType: 'LICENSE_EXPIRING',
      severity: 'MEDIUM',
      status: 'OPEN',
      entityType: 'DANCER',
      entityId: dancers[2].id,
      title: 'Dancer License Expiring Soon',
      description: 'Ruby\'s entertainer license expires on January 15, 2025 (35 days)',
      expectedValue: 'Valid license',
      actualValue: 'Expiring in 35 days',
      involvedDancerId: dancers[2].id,
      visibleToOwnerOnly: false,
    }
  });

  // Cash drawer variance - ACKNOWLEDGED
  await prisma.verificationAlert.create({
    data: {
      clubId,
      alertType: 'CASH_VARIANCE',
      severity: 'MEDIUM',
      status: 'ACKNOWLEDGED',
      entityType: 'CASH_DRAWER',
      entityId: activeShift.id,
      title: 'Cash Drawer Variance',
      description: 'Previous shift ended with $15 variance (expected: $450, actual: $435)',
      expectedValue: '$450.00',
      actualValue: '$435.00',
      discrepancy: '-$15.00',
      involvedUserId: doorStaffUser.id,
      acknowledgedById: ownerUser.id,
      acknowledgedAt: new Date(Date.now() - 30 * 60 * 1000),
      visibleToOwnerOnly: true,
    }
  });

  // Pattern detected alert - RESOLVED
  await prisma.verificationAlert.create({
    data: {
      clubId,
      alertType: 'PATTERN_DETECTED',
      severity: 'LOW',
      status: 'RESOLVED',
      entityType: 'VIP_HOST',
      entityId: vipHostUser.id,
      title: 'Consistent Rounding Pattern',
      description: 'VIP Host Sarah consistently rounds song counts up by 1-2 songs per session',
      expectedValue: 'Random variance',
      actualValue: '+1.3 songs avg per session',
      involvedUserId: vipHostUser.id,
      resolvedById: ownerUser.id,
      resolvedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      resolution: 'Discussed with employee, provided training on accurate counting',
      visibleToOwnerOnly: true,
    }
  });

  console.log('  ✓ 4 verification alerts created (various statuses)');

  // ============================================
  // 9. CREATE ANOMALY REPORT
  // ============================================
  console.log('\n📊 Creating anomaly report...');

  await prisma.anomalyReport.upsert({
    where: {
      clubId_reportDate_analysisType: {
        clubId,
        reportDate: new Date(),
        analysisType: 'VIP_ATTENDANT_VARIANCE'
      }
    },
    update: {},
    create: {
      clubId,
      reportDate: new Date(),
      periodStart: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      periodEnd: new Date(),
      analysisType: 'VIP_ATTENDANT_VARIANCE',
      findingsSummary: 'Analysis of 12 VIP sessions over the past week shows VIP Host Sarah averaging +1.3 songs above DJ system count. Potential revenue impact: $156.',
      dataPoints: {
        totalSessions: 12,
        avgVariance: 1.3,
        maxVariance: 3,
        totalVarianceSongs: 16,
        potentialRevenueImpact: 156.00,
        sessionsByVariance: [
          { variance: 0, count: 4 },
          { variance: 1, count: 5 },
          { variance: 2, count: 2 },
          { variance: 3, count: 1 },
        ]
      },
      anomaliesFound: 3,
      flaggedUserIds: [vipHostUser.id],
      flaggedDancerIds: [],
      overallRisk: 'MEDIUM',
      ownerViewed: false,
    }
  });

  console.log('  ✓ Weekly anomaly report created');

  // ============================================
  // SUMMARY
  // ============================================
  console.log('\n========================================');
  console.log('🎉 SEED COMPLETE!');
  console.log('========================================');
  console.log('\n📊 Data Created:');
  console.log('  • 2 Additional staff users (Door Staff, VIP Host)');
  console.log('  • 5 VIP booths');
  console.log('  • 8 Dancers (various license statuses)');
  console.log('  • 1 Active shift with cash drawer');
  console.log('  • 7 Dancer check-ins (5 present, 2 departed)');
  console.log('  • 4 VIP sessions (1 verified, 1 mismatch, 1 disputed, 1 active)');
  console.log('  • 4 Audit log entries (2 high-risk)');
  console.log('  • 4 Verification alerts (various statuses)');
  console.log('  • 1 Weekly anomaly report');
  console.log('\n🧪 Testing Scenarios Available:');
  console.log('  1. Door Staff: Check in dancers, collect bar fees');
  console.log('  2. VIP Host: Manage active session, start new sessions');
  console.log('  3. Security Dashboard: Review discrepancies, audit logs, alerts');
  console.log('\n🔐 Demo Credentials:');
  console.log('  • Door Staff: doorstaff@demo.com (any password)');
  console.log('  • VIP Host: viphost@demo.com (any password)');
  console.log('  • Owner: (use your existing owner account)');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

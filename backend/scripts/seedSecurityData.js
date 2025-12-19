/**
 * Seed Security Dashboard Test Data
 *
 * This script populates the database with realistic test data to showcase
 * all security and fraud detection features:
 * - VIP sessions with song count discrepancies
 * - Dancer check-ins with license verification
 * - Audit log entries
 * - Cash drawer shifts
 * - Deliberate anomalies to trigger detection
 *
 * Usage: node backend/scripts/seedSecurityData.js <clubId>
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// Helper to generate random date within last N days
function randomDate(daysAgo = 30) {
  const now = new Date();
  const past = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000));
  const randomTime = past.getTime() + Math.random() * (now.getTime() - past.getTime());
  return new Date(randomTime);
}

// Helper to generate random time offset in minutes
function addMinutes(date, minutes) {
  return new Date(date.getTime() + minutes * 60000);
}

// Calculate song count from duration (3.5 min avg per song)
function calculateSongsByTime(durationMinutes) {
  return Math.round(durationMinutes / 3.5);
}

// Generate realistic dancer names
const dancerNames = [
  { firstName: 'Sophia', lastName: 'Martinez', stageName: 'Diamond' },
  { firstName: 'Isabella', lastName: 'Johnson', stageName: 'Crystal' },
  { firstName: 'Emma', lastName: 'Williams', stageName: 'Star' },
  { firstName: 'Olivia', lastName: 'Brown', stageName: 'Sapphire' },
  { firstName: 'Ava', lastName: 'Jones', stageName: 'Ruby' },
  { firstName: 'Mia', lastName: 'Garcia', stageName: 'Pearl' },
  { firstName: 'Charlotte', lastName: 'Miller', stageName: 'Jade' },
  { firstName: 'Amelia', lastName: 'Davis', stageName: 'Amber' },
  { firstName: 'Harper', lastName: 'Rodriguez', stageName: 'Onyx' },
  { firstName: 'Evelyn', lastName: 'Martinez', stageName: 'Velvet' },
  { firstName: 'Luna', lastName: 'Hernandez', stageName: 'Nova' },
  { firstName: 'Aria', lastName: 'Lopez', stageName: 'Phoenix' },
];

// Generate realistic employee names
const employeeNames = [
  { firstName: 'Marcus', lastName: 'Thompson', role: 'VIP_HOST' },
  { firstName: 'James', lastName: 'Anderson', role: 'VIP_HOST' },
  { firstName: 'Robert', lastName: 'Taylor', role: 'VIP_HOST' },
  { firstName: 'Michael', lastName: 'Wilson', role: 'DOOR_STAFF' },
  { firstName: 'David', lastName: 'Moore', role: 'DOOR_STAFF' },
  { firstName: 'Chris', lastName: 'Jackson', role: 'MANAGER' },
];

async function seedSecurityData(clubId) {
  console.log(`\n🌱 Seeding security test data for club: ${clubId}\n`);

  try {
    // Verify club exists
    const club = await prisma.club.findUnique({
      where: { id: clubId }
    });

    if (!club) {
      throw new Error(`Club with ID ${clubId} not found`);
    }

    console.log(`📍 Club: ${club.name}\n`);

    // 1. Create or find employees
    console.log('👥 Creating employees...');
    const employees = [];

    for (const empData of employeeNames) {
      const email = `${empData.firstName.toLowerCase()}.${empData.lastName.toLowerCase()}@${club.name.toLowerCase().replace(/\s+/g, '')}.com`;

      let employee = await prisma.user.findUnique({
        where: { email }
      });

      if (!employee) {
        employee = await prisma.user.create({
          data: {
            email,
            password: await bcrypt.hash('password123', 10),
            firstName: empData.firstName,
            lastName: empData.lastName,
            clubId,
            role: empData.role,
            active: true
          }
        });
        console.log(`   ✓ Created ${empData.role}: ${empData.firstName} ${empData.lastName}`);
      } else {
        console.log(`   → Found ${empData.role}: ${empData.firstName} ${empData.lastName}`);
      }

      employees.push({ ...employee, roleType: empData.role });
    }

    const vipHosts = employees.filter(e => e.roleType === 'VIP_HOST');
    const doorStaff = employees.filter(e => e.roleType === 'DOOR_STAFF');
    const managers = employees.filter(e => e.roleType === 'MANAGER');

    // 2. Create dancers
    console.log('\n💃 Creating dancers...');
    const dancers = [];

    for (const dancerData of dancerNames) {
      let dancer = await prisma.dancer.findFirst({
        where: {
          clubId,
          stageName: dancerData.stageName
        }
      });

      if (!dancer) {
        const licenseExpiry = new Date();
        licenseExpiry.setMonth(licenseExpiry.getMonth() + Math.floor(Math.random() * 12) + 1);

        dancer = await prisma.dancer.create({
          data: {
            clubId,
            firstName: dancerData.firstName,
            lastName: dancerData.lastName,
            stageName: dancerData.stageName,
            phone: `555-${Math.floor(Math.random() * 900 + 100)}-${Math.floor(Math.random() * 9000 + 1000)}`,
            email: `${dancerData.stageName.toLowerCase()}@example.com`,
            dateOfBirth: new Date(1995 + Math.floor(Math.random() * 10), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
            licenseNumber: `LIC${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
            licenseExpiry,
            licenseState: ['CA', 'NY', 'TX', 'FL', 'NV'][Math.floor(Math.random() * 5)],
            licenseVerified: true,
            active: true,
            status: 'ACTIVE',
            badgeCode: `BADGE-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
          }
        });
        console.log(`   ✓ Created dancer: ${dancer.stageName} (${dancer.firstName} ${dancer.lastName})`);
      } else {
        console.log(`   → Found dancer: ${dancer.stageName}`);
      }

      dancers.push(dancer);
    }

    // 3. Create VIP booths
    console.log('\n🛋️  Creating VIP booths...');
    const booths = [];
    const boothNames = ['Champagne', 'Diamond', 'Gold', 'Platinum', 'Ruby'];

    for (const boothName of boothNames) {
      let booth = await prisma.vipBooth.findFirst({
        where: { clubId, name: boothName }
      });

      if (!booth) {
        booth = await prisma.vipBooth.create({
          data: {
            clubId,
            name: boothName,
            capacity: 8,
            hourlyRate: 300 + Math.floor(Math.random() * 200),
            songRate: 25,
            status: 'AVAILABLE'
          }
        });
        console.log(`   ✓ Created booth: ${boothName}`);
      } else {
        console.log(`   → Found booth: ${boothName}`);
      }

      booths.push(booth);
    }

    // 4. Create dancer check-ins (last 30 days)
    console.log('\n📝 Creating dancer check-ins...');
    let checkInCount = 0;

    for (let i = 0; i < 40; i++) {
      const dancer = dancers[Math.floor(Math.random() * dancers.length)];
      const doorStaffMember = doorStaff[Math.floor(Math.random() * doorStaff.length)];
      const checkInDate = randomDate(30);

      // Some check-ins have issues
      const hasLicenseIssue = Math.random() < 0.1; // 10% have issues
      const barFeeDeferred = Math.random() < 0.15; // 15% deferred
      const barFeeWaived = Math.random() < 0.05; // 5% waived

      const checkIn = await prisma.dancerCheckIn.create({
        data: {
          clubId,
          dancerId: dancer.id,
          checkedInBy: doorStaffMember.id,
          checkedInAt: checkInDate,
          checkedOutAt: Math.random() < 0.8 ? addMinutes(checkInDate, 180 + Math.floor(Math.random() * 240)) : null,
          licenseVerified: !hasLicenseIssue,
          barFeeAmount: 50,
          barFeeStatus: barFeeWaived ? 'WAIVED' : (barFeeDeferred ? 'DEFERRED' : 'PAID'),
          barFeePaymentMethod: (!barFeeDeferred && !barFeeWaived) ? (Math.random() < 0.6 ? 'CASH' : 'CARD') : null,
        }
      });

      checkInCount++;
    }

    console.log(`   ✓ Created ${checkInCount} check-ins`);

    // 5. Create VIP sessions with varying levels of accuracy
    console.log('\n🎵 Creating VIP sessions...');
    let sessionCount = 0;
    let accurateCount = 0;
    let minorVarianceCount = 0;
    let significantVarianceCount = 0;
    let criticalVarianceCount = 0;

    // Create 60 VIP sessions
    for (let i = 0; i < 60; i++) {
      const dancer = dancers[Math.floor(Math.random() * dancers.length)];
      const booth = booths[Math.floor(Math.random() * booths.length)];
      const vipHost = vipHosts[Math.floor(Math.random() * vipHosts.length)];

      const startDate = randomDate(30);
      // Duration: 20-120 minutes
      const durationMinutes = 20 + Math.floor(Math.random() * 100);
      const endDate = addMinutes(startDate, durationMinutes);

      // Calculate actual songs by time
      const songsByTime = calculateSongsByTime(durationMinutes);

      // Determine variance pattern
      let manualCount, djSyncCount, finalCount;
      const varianceType = Math.random();

      if (varianceType < 0.60) {
        // 60% - Accurate (0-2 song variance)
        const variance = Math.floor(Math.random() * 3);
        manualCount = songsByTime + (Math.random() < 0.5 ? variance : -variance);
        djSyncCount = songsByTime + (Math.random() < 0.5 ? 1 : -1);
        finalCount = manualCount;
        accurateCount++;
      } else if (varianceType < 0.80) {
        // 20% - Minor variance (3-5 songs)
        const variance = 3 + Math.floor(Math.random() * 3);
        manualCount = songsByTime + variance;
        djSyncCount = songsByTime + Math.floor(Math.random() * 2);
        finalCount = manualCount;
        minorVarianceCount++;
      } else if (varianceType < 0.95) {
        // 15% - Significant variance (6-8 songs)
        const variance = 6 + Math.floor(Math.random() * 3);
        manualCount = songsByTime + variance;
        djSyncCount = songsByTime + Math.floor(Math.random() * 3);
        finalCount = manualCount;
        significantVarianceCount++;
      } else {
        // 5% - Critical variance (>8 songs) - FRAUD INDICATORS
        const variance = 9 + Math.floor(Math.random() * 7);
        manualCount = songsByTime + variance;
        djSyncCount = songsByTime + Math.floor(Math.random() * 2);
        finalCount = manualCount;
        criticalVarianceCount++;
      }

      // Some sessions have overrides
      const wasOverridden = Math.abs(manualCount - songsByTime) > 5 && Math.random() < 0.3;

      const session = await prisma.vipSession.create({
        data: {
          clubId,
          boothId: booth.id,
          dancerId: dancer.id,
          startedAt: startDate,
          endedAt: endDate,
          startedBy: vipHost.id,
          endedBy: vipHost.id,
          status: 'COMPLETED',
          duration: durationMinutes,
          songCountManual: manualCount,
          songCountDjSync: djSyncCount,
          songCountByTime: songsByTime,
          songCountFinal: finalCount,
          manualOverride: wasOverridden,
          overrideReason: wasOverridden ? 'VIP host adjusted count' : null,
          totalAmount: finalCount * 25,
          verificationStatus: Math.abs(manualCount - songsByTime) <= 2 ? 'VERIFIED' : 'FLAGGED',
          customerConfirmed: Math.random() < 0.7,
          paymentMethod: Math.random() < 0.6 ? 'CASH' : 'CARD'
        }
      });

      sessionCount++;
    }

    console.log(`   ✓ Created ${sessionCount} VIP sessions:`);
    console.log(`      - ${accurateCount} accurate (0-2 song variance)`);
    console.log(`      - ${minorVarianceCount} minor variance (3-5 songs)`);
    console.log(`      - ${significantVarianceCount} significant variance (6-8 songs)`);
    console.log(`      - ${criticalVarianceCount} CRITICAL variance (>8 songs) 🚨`);

    // 6. Create audit log entries
    console.log('\n📋 Creating audit log entries...');
    let auditCount = 0;
    let previousHash = null;

    // Get some sessions and check-ins to create audit entries for
    const recentSessions = await prisma.vipSession.findMany({
      where: { clubId },
      take: 20,
      orderBy: { createdAt: 'asc' }
    });

    const recentCheckIns = await prisma.dancerCheckIn.findMany({
      where: { clubId },
      take: 10,
      orderBy: { checkedInAt: 'asc' }
    });

    // Create audit entries for session actions
    for (const session of recentSessions) {
      const actor = employees[Math.floor(Math.random() * employees.length)];

      // Session creation
      const createEntry = await prisma.auditLog.create({
        data: {
          clubId,
          userId: actor.id,
          action: 'CREATE',
          entityType: 'VIP_SESSION',
          entityId: session.id,
          timestamp: session.startedAt,
          ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`,
          userAgent: 'ClubOps/1.0',
          newData: {
            boothId: session.boothId,
            dancerId: session.dancerId,
            startedAt: session.startedAt
          },
          previousHash,
          hash: 'hash_' + Math.random().toString(36).substring(2)
        }
      });
      previousHash = createEntry.hash;
      auditCount++;

      // Session completion
      if (session.endedAt) {
        const completeEntry = await prisma.auditLog.create({
          data: {
            clubId,
            userId: actor.id,
            action: 'UPDATE',
            entityType: 'VIP_SESSION',
            entityId: session.id,
            timestamp: session.endedAt,
            ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`,
            userAgent: 'ClubOps/1.0',
            previousData: {
              status: 'ACTIVE',
              songCountFinal: null
            },
            newData: {
              status: 'COMPLETED',
              songCountFinal: session.songCountFinal,
              endedAt: session.endedAt
            },
            previousHash,
            hash: 'hash_' + Math.random().toString(36).substring(2)
          }
        });
        previousHash = completeEntry.hash;
        auditCount++;
      }

      // Manual override entries (flagged actions)
      if (session.manualOverride) {
        const overrideEntry = await prisma.auditLog.create({
          data: {
            clubId,
            userId: actor.id,
            action: 'OVERRIDE',
            entityType: 'VIP_SESSION',
            entityId: session.id,
            timestamp: session.endedAt,
            ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`,
            userAgent: 'ClubOps/1.0',
            previousData: {
              songCountFinal: session.songCountByTime
            },
            newData: {
              songCountFinal: session.songCountFinal,
              manualOverride: true,
              overrideReason: session.overrideReason
            },
            flagged: true,
            previousHash,
            hash: 'hash_' + Math.random().toString(36).substring(2)
          }
        });
        previousHash = overrideEntry.hash;
        auditCount++;
      }
    }

    console.log(`   ✓ Created ${auditCount} audit log entries (hash-chained)`);

    // 7. Create some verification alerts (anomalies will be auto-generated by cron)
    console.log('\n🚨 Creating verification alerts...');
    let alertCount = 0;

    const criticalSessions = await prisma.vipSession.findMany({
      where: {
        clubId,
        verificationStatus: 'FLAGGED'
      },
      take: 10
    });

    for (const session of criticalSessions) {
      const variance = Math.abs(session.songCountFinal - session.songCountByTime);

      if (variance > 5) {
        const severity = variance > 8 ? 'CRITICAL' : (variance > 6 ? 'HIGH' : 'MEDIUM');

        await prisma.verificationAlert.create({
          data: {
            clubId,
            alertType: 'VIP_SONG_MISMATCH',
            severity,
            status: 'OPEN',
            title: `Song Count Variance: ${variance} songs`,
            message: `VIP session has ${variance} song variance (Manual: ${session.songCountManual}, Time: ${session.songCountByTime}, Final: ${session.songCountFinal})`,
            entityType: 'VIP_SESSION',
            entityId: session.id,
            details: {
              sessionId: session.id,
              variance,
              manual: session.songCountManual,
              djSync: session.songCountDjSync,
              byTime: session.songCountByTime,
              final: session.songCountFinal
            },
            isHighRisk: variance > 8,
            flaggedReason: variance > 8 ? 'Critical variance - possible fraud' : 'Significant variance - review needed'
          }
        });
        alertCount++;
      }
    }

    console.log(`   ✓ Created ${alertCount} verification alerts`);

    // 8. Summary
    console.log('\n✅ Security test data seeding completed!\n');
    console.log('📊 Summary:');
    console.log(`   • ${employees.length} employees (${vipHosts.length} VIP hosts, ${doorStaff.length} door staff)`);
    console.log(`   • ${dancers.length} dancers`);
    console.log(`   • ${booths.length} VIP booths`);
    console.log(`   • ${checkInCount} check-ins`);
    console.log(`   • ${sessionCount} VIP sessions`);
    console.log(`   • ${auditCount} audit log entries`);
    console.log(`   • ${alertCount} verification alerts`);

    console.log('\n🎯 Next Steps:');
    console.log('   1. Navigate to /security in your app');
    console.log('   2. View the Overview tab for integrity scores');
    console.log('   3. Check the Data Comparisons tab for song count analysis');
    console.log('   4. Review Anomaly Alerts tab for flagged sessions');
    console.log('   5. Wait for the cron job (6 hours) or run anomaly detection manually:');
    console.log('      POST /api/security/detect-anomalies');
    console.log('\n');

  } catch (error) {
    console.error('❌ Error seeding data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed script
const clubId = process.argv[2];

if (!clubId) {
  console.error('❌ Error: Club ID required');
  console.error('Usage: node backend/scripts/seedSecurityData.js <clubId>');
  console.error('\nTo find your club ID, run:');
  console.error('  npx prisma studio');
  console.error('  Then check the Club table\n');
  process.exit(1);
}

seedSecurityData(clubId)
  .then(() => {
    console.log('🎉 Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });

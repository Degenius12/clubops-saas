// Test fraud detection system with demo data
const { PrismaClient } = require('@prisma/client');
const anomalyDetection = require('./backend/services/anomalyDetection');

const prisma = new PrismaClient();

async function testFraudDetection() {
  console.log('🔍 Testing Fraud Detection System...\n');

  try {
    // 1. Get demo club
    const club = await prisma.club.findFirst({
      where: { name: { contains: 'Demo', mode: 'insensitive' } }
    });

    if (!club) {
      console.error('❌ Demo club not found');
      process.exit(1);
    }

    console.log(`✅ Found club: ${club.name} (${club.id})\n`);

    // 2. Check how much data we have
    const sessionCount = await prisma.vipSession.count({
      where: { clubId: club.id }
    });
    const transactionCount = await prisma.financialTransaction.count({
      where: { clubId: club.id }
    });

    console.log(`📊 Available data:`);
    console.log(`   - VIP Sessions: ${sessionCount}`);
    console.log(`   - Transactions: ${transactionCount}\n`);

    if (sessionCount === 0 && transactionCount === 0) {
      console.log('⚠️  No data available for fraud detection');
      console.log('💡 Run the demo data seeding script first: node backend/scripts/seedDemoData.js\n');
      process.exit(0);
    }

    // 3. Run anomaly detection
    console.log('🤖 Running anomaly detection algorithms...\n');

    const results = await anomalyDetection.detectAnomalies(club.id, {
      period: 30, // Last 30 days
      skipCache: true
    });

    console.log('📈 Detection Results:');
    console.log(`   - Total anomalies found: ${results.anomalies.length}`);
    console.log(`   - Average confidence: ${(results.stats.avgConfidence * 100).toFixed(1)}%\n`);

    // 4. Display anomalies by severity
    console.log('🚨 Anomalies by Severity:');
    Object.entries(results.stats.bySeverity).forEach(([severity, count]) => {
      if (count > 0) {
        const icon = severity === 'CRITICAL' ? '🔴' : severity === 'HIGH' ? '🟠' : severity === 'MEDIUM' ? '🟡' : '🟢';
        console.log(`   ${icon} ${severity}: ${count}`);
      }
    });
    console.log();

    // 5. Display anomalies by type
    console.log('📊 Anomalies by Type:');
    Object.entries(results.stats.byType).forEach(([type, count]) => {
      console.log(`   - ${type}: ${count}`);
    });
    console.log();

    // 6. Show top 5 most severe anomalies
    const topAnomalies = results.anomalies
      .sort((a, b) => {
        const severityOrder = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
        return severityOrder[b.severity] - severityOrder[a.severity];
      })
      .slice(0, 5);

    if (topAnomalies.length > 0) {
      console.log('⚠️  Top 5 Most Severe Anomalies:\n');
      topAnomalies.forEach((anomaly, index) => {
        const severityEmoji = {
          CRITICAL: '🔴',
          HIGH: '🟠',
          MEDIUM: '🟡',
          LOW: '🟢'
        }[anomaly.severity];

        console.log(`${index + 1}. ${severityEmoji} ${anomaly.title}`);
        console.log(`   Severity: ${anomaly.severity} | Confidence: ${(anomaly.confidence * 100).toFixed(0)}%`);
        console.log(`   ${anomaly.message}`);
        console.log(`   Action: ${anomaly.recommendedAction}\n`);
      });
    }

    // 7. Create alerts in database
    console.log('💾 Creating verification alerts in database...');
    let createdCount = 0;
    let skippedCount = 0;

    for (const anomaly of results.anomalies) {
      // Check if alert already exists
      const existing = await prisma.verificationAlert.findFirst({
        where: {
          clubId: club.id,
          alertType: anomaly.type,
          entityId: anomaly.entityId,
          status: { in: ['OPEN', 'ACKNOWLEDGED'] }
        }
      });

      if (!existing) {
        await prisma.verificationAlert.create({
          data: {
            clubId: club.id,
            alertType: anomaly.type,
            severity: anomaly.severity,
            status: 'OPEN',
            title: anomaly.title,
            description: anomaly.message,
            entityType: anomaly.entityType,
            entityId: anomaly.entityId,
            discrepancy: anomaly.recommendedAction,
            visibleToOwnerOnly: anomaly.severity === 'CRITICAL' || anomaly.severity === 'HIGH'
          }
        });
        createdCount++;
      } else {
        skippedCount++;
      }
    }

    console.log(`✅ Created ${createdCount} new alerts`);
    console.log(`⏭️  Skipped ${skippedCount} duplicate alerts\n`);

    // 8. Summary
    console.log('✨ Fraud Detection Test Complete!\n');
    console.log('📍 Next Steps:');
    console.log('   1. View alerts in Security Dashboard at: http://localhost:3000/security');
    console.log('   2. Login as owner to access dashboard');
    console.log('   3. Review and resolve alerts\n');

  } catch (error) {
    console.error('❌ Error running fraud detection:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

testFraudDetection();

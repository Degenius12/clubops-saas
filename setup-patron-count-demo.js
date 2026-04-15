// Setup Patron Count System for Demo Club
// Enables patron counting with test webhook secret

const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const prisma = new PrismaClient();

async function main() {
  console.log('🚪 Setting up Patron Count System for Demo Club\\n');

  try {
    // Get demo club
    const club = await prisma.club.findFirst({
      where: {
        name: { contains: 'Demo' }
      }
    });

    if (!club) {
      console.error('❌ Demo club not found');
      process.exit(1);
    }

    console.log(`Found club: ${club.name} (${club.id})\\n`);

    // Generate webhook secret
    const webhookSecret = crypto.randomBytes(32).toString('hex');

    // Update club with patron count settings
    const updated = await prisma.club.update({
      where: { id: club.id },
      data: {
        doorCountEnabled: true,
        capacityLimit: 200,
        trackExits: true,
        enableMultiZone: false,
        reEntryFeeEnabled: false,
        reEntryFeeAmount: 0,
        autoResetOnShiftChange: true,
        doorCountWebhookSecret: webhookSecret,
        currentPatronCount: 0
      }
    });

    console.log('✅ Patron Count System Configured:');
    console.log(`   - Enabled: ${updated.doorCountEnabled}`);
    console.log(`   - Capacity Limit: ${updated.capacityLimit} patrons`);
    console.log(`   - Track Exits: ${updated.trackExits}`);
    console.log(`   - Multi-Zone: ${updated.enableMultiZone}`);
    console.log(`   - Re-Entry Fee: ${updated.reEntryFeeEnabled ? `$${updated.reEntryFeeAmount}` : 'Disabled'}`);
    console.log(`   - Auto-Reset on Shift: ${updated.autoResetOnShiftChange}`);
    console.log(`   - Webhook Secret: ${webhookSecret.substring(0, 16)}...`);
    console.log(`   - Current Count: ${updated.currentPatronCount}\\n`);

    // Save webhook secret to file for testing
    const fs = require('fs');
    fs.writeFileSync('.webhook-secret', webhookSecret);
    console.log('✅ Webhook secret saved to .webhook-secret file\\n');

    console.log('🎯 Ready for Testing!\\n');
    console.log('You can now:');
    console.log('  1. Use the webhook secret to simulate hardware events');
    console.log('  2. Test manual count adjustments via API');
    console.log('  3. View patron count in Door Staff interface');
    console.log('  4. Monitor capacity alerts\\n');

  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

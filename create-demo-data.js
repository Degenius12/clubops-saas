// Demo Data Creation for ClubFlow System
// Creates realistic demo data across all modules for demonstration purposes

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🎬 Creating Demo Data for ClubFlow...\n');

  try {
    // Get the demo club
    const club = await prisma.club.findFirst({
      where: { name: { contains: 'Demo' } }
    });

    if (!club) {
      console.error('❌ Demo club not found. Please run the seed script first.');
      process.exit(1);
    }

    console.log(`✅ Using club: ${club.name} (${club.id})\n`);

    // Get demo users
    const owner = await prisma.clubUser.findFirst({
      where: { clubId: club.id, role: 'OWNER' }
    });

    const manager = await prisma.clubUser.findFirst({
      where: { clubId: club.id, role: 'MANAGER' }
    });

    const dj = await prisma.clubUser.findFirst({
      where: { clubId: club.id, role: 'DJ' }
    });

    console.log('👥 Found demo users:');
    console.log(`  - Owner: ${owner?.email}`);
    console.log(`  - Manager: ${manager?.email}`);
    console.log(`  - DJ: ${dj?.email}\n`);

    // ============================================================
    // 1. CREATE ENTERTAINERS (15 total - mix of active and inactive)
    // ============================================================
    console.log('💃 Creating Entertainers...');

    const entertainerData = [
      // Active entertainers
      { legalName: 'Jessica Martinez', stageName: 'Jade', email: 'jade@demo.clubflow.com', phone: '555-0101', dateOfBirth: new Date('1997-05-12'), contractType: 'INDEPENDENT_CONTRACTOR_1099', hasSignedContract: true, onboardingStatus: 'COMPLETED', isActive: true },
      { legalName: 'Ashley Thompson', stageName: 'Angel', email: 'angel@demo.clubflow.com', phone: '555-0102', dateOfBirth: new Date('1995-08-22'), contractType: 'INDEPENDENT_CONTRACTOR_1099', hasSignedContract: true, onboardingStatus: 'COMPLETED', isActive: true },
      { legalName: 'Maria Rodriguez', stageName: 'Diamond', email: 'diamond@demo.clubflow.com', phone: '555-0103', dateOfBirth: new Date('1998-03-15'), contractType: 'INDEPENDENT_CONTRACTOR_1099', hasSignedContract: true, onboardingStatus: 'COMPLETED', isActive: true },
      { legalName: 'Samantha Lee', stageName: 'Sapphire', email: 'sapphire@demo.clubflow.com', phone: '555-0104', dateOfBirth: new Date('1996-11-30'), contractType: 'INDEPENDENT_CONTRACTOR_1099', hasSignedContract: true, onboardingStatus: 'COMPLETED', isActive: true },
      { legalName: 'Emily Johnson', stageName: 'Crystal', email: 'crystal@demo.clubflow.com', phone: '555-0105', dateOfBirth: new Date('1999-01-18'), contractType: 'INDEPENDENT_CONTRACTOR_1099', hasSignedContract: true, onboardingStatus: 'COMPLETED', isActive: true },
      { legalName: 'Victoria Harris', stageName: 'Scarlett', email: 'scarlett@demo.clubflow.com', phone: '555-0113', dateOfBirth: new Date('1996-08-17'), contractType: 'INDEPENDENT_CONTRACTOR_1099', hasSignedContract: true, onboardingStatus: 'COMPLETED', isActive: true },
      { legalName: 'Alexandra White', stageName: 'Luna', email: 'luna@demo.clubflow.com', phone: '555-0114', dateOfBirth: new Date('1995-11-22'), contractType: 'INDEPENDENT_CONTRACTOR_1099', hasSignedContract: true, onboardingStatus: 'COMPLETED', isActive: true },
      { legalName: 'Stephanie Clark', stageName: 'Aurora', email: 'aurora@demo.clubflow.com', phone: '555-0115', dateOfBirth: new Date('1998-04-09'), contractType: 'INDEPENDENT_CONTRACTOR_1099', hasSignedContract: true, onboardingStatus: 'COMPLETED', isActive: true },

      // Inactive entertainers
      { legalName: 'Nicole Williams', stageName: 'Ruby', email: 'ruby@demo.clubflow.com', phone: '555-0106', dateOfBirth: new Date('1994-07-25'), contractType: 'INDEPENDENT_CONTRACTOR_1099', hasSignedContract: true, onboardingStatus: 'COMPLETED', isActive: true },
      { legalName: 'Brittany Davis', stageName: 'Emerald', email: 'emerald@demo.clubflow.com', phone: '555-0107', dateOfBirth: new Date('1997-09-10'), contractType: 'INDEPENDENT_CONTRACTOR_1099', hasSignedContract: true, onboardingStatus: 'COMPLETED', isActive: true },
      { legalName: 'Amanda Garcia', stageName: 'Pearl', email: 'pearl@demo.clubflow.com', phone: '555-0108', dateOfBirth: new Date('1996-04-05'), contractType: 'EMPLOYEE_W2', hasSignedContract: true, onboardingStatus: 'COMPLETED', isActive: true },
      { legalName: 'Melissa Brown', stageName: 'Topaz', email: 'topaz@demo.clubflow.com', phone: '555-0109', dateOfBirth: new Date('1995-12-20'), contractType: 'INDEPENDENT_CONTRACTOR_1099', hasSignedContract: true, onboardingStatus: 'COMPLETED', isActive: true },
      { legalName: 'Jennifer Wilson', stageName: 'Opal', email: 'opal@demo.clubflow.com', phone: '555-0110', dateOfBirth: new Date('1998-06-14'), contractType: 'INDEPENDENT_CONTRACTOR_1099', hasSignedContract: true, onboardingStatus: 'COMPLETED', isActive: true },

      // New entertainers (onboarding)
      { legalName: 'Rachel Anderson', stageName: 'Amber', email: 'amber@demo.clubflow.com', phone: '555-0111', dateOfBirth: new Date('1999-02-28'), contractType: null, hasSignedContract: false, onboardingStatus: 'DOCUMENTS_PENDING', isActive: false },
      { legalName: 'Sarah Taylor', stageName: 'Violet', email: 'violet@demo.clubflow.com', phone: '555-0112', dateOfBirth: new Date('1997-10-05'), contractType: null, hasSignedContract: false, onboardingStatus: 'IN_PROGRESS', isActive: false }
    ];

    const entertainers = [];
    for (const data of entertainerData) {
      const entertainer = await prisma.entertainer.create({
        data: {
          ...data,
          club: { connect: { id: club.id } },
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
      entertainers.push(entertainer);
    }

    console.log(`✅ Created ${entertainers.length} entertainers`);
    console.log(`  - ${entertainers.filter(e => e.onboardingStatus === 'COMPLETED').length} completed onboarding`);
    console.log(`  - ${entertainers.filter(e => e.onboardingStatus !== 'COMPLETED').length} pending onboarding`);
    console.log(`  - ${entertainers.filter(e => e.isActive).length} active in system\n`);

    // ============================================================
    // 2. VIP BOOTHS (check existing or create)
    // ============================================================
    console.log('🍾 Checking VIP Booths...');

    let vipBooths = await prisma.vipBooth.findMany({
      where: { clubId: club.id }
    });

    if (vipBooths.length === 0) {
      console.log('   Creating new VIP booths...');
      const vipBoothData = [
        { boothName: 'VIP 1', boothNumber: 1, capacity: 8, songRate: 50, isAvailable: true },
        { boothName: 'VIP 2', boothNumber: 2, capacity: 6, songRate: 40, isAvailable: true },
        { boothName: 'VIP 3', boothNumber: 3, capacity: 10, songRate: 60, isAvailable: true },
        { boothName: 'VIP 4', boothNumber: 4, capacity: 8, songRate: 50, isAvailable: true },
        { boothName: 'VIP 5', boothNumber: 5, capacity: 12, songRate: 75, isAvailable: true },
        { boothName: 'VIP 6', boothNumber: 6, capacity: 6, songRate: 40, isAvailable: true },
        { boothName: 'VIP 7', boothNumber: 7, capacity: 8, songRate: 50, isAvailable: true },
        { boothName: 'Champagne Room', boothNumber: 8, capacity: 4, songRate: 100, isAvailable: true }
      ];

      for (const data of vipBoothData) {
        const booth = await prisma.vipBooth.create({
          data: {
            ...data,
            club: { connect: { id: club.id } }
          }
        });
        vipBooths.push(booth);
      }
    }

    console.log(`✅ VIP Booths: ${vipBooths.length} available\n`);

    // ============================================================
    // 3. CREATE DJ QUEUE (Skip - requires manual check-in first)
    // ============================================================
    console.log('🎵 Skipping DJ Queue (requires entertainers to check in first)...\n');

    // ============================================================
    // 4. CREATE FEE TRANSACTIONS (Skip - requires check-ins first)
    // ============================================================
    console.log('💰 Skipping Fee Transactions (created automatically on check-in)...\n');

    // ============================================================
    // 5. REVENUE TRACKING (Skip - handled through transactions)
    // ============================================================
    console.log('📊 Skipping Revenue Records (tracked through VIP sessions and fees)...\n');
    const revenueCreated = 0;

    // ============================================================
    // 6. CREATE SHIFT RECORDS (Skip - created automatically on check-in)
    // ============================================================
    console.log('⏰ Skipping Shift Records (created automatically on check-in)...\n');

    // ============================================================
    // SUMMARY
    // ============================================================
    console.log('═══════════════════════════════════════════════════════');
    console.log('✅ DEMO DATA CREATION COMPLETE');
    console.log('═══════════════════════════════════════════════════════\n');

    console.log('Created:');
    console.log(`  • ${entertainers.length} entertainers`);
    console.log(`  • ${vipBooths.length} VIP booths`);
    console.log(`  • ${entertainers.filter(e => e.isActive).length} active entertainers ready to check in\n`);

    console.log('🎯 Ready for Demo!\n');
    console.log('Demo Highlights:');
    console.log('  ✅ 15 entertainers in system (13 ready, 2 onboarding)');
    console.log(`  ✅ ${vipBooths.length} VIP booths available for reservations`);
    console.log('  ✅ Mix of 1099 and W-2 entertainers');
    console.log('  ✅ 2 new entertainers in onboarding process');
    console.log('  ✅ Realistic names and contact information');
    console.log('\n🚀 Next Steps:');
    console.log('  1. Launch the frontend and backend');
    console.log('  2. Login as manager@demo.clubflow.com (password: demo123)');
    console.log('  3. Check in entertainers to activate DJ queue and fee tracking');
    console.log('  4. Create VIP sessions to demonstrate spending tracking');
    console.log('  5. Explore compliance dashboard with onboarding entertainers');

  } catch (error) {
    console.error('❌ Error creating demo data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });

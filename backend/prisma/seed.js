// ClubOps - Database Seed Script
// Populates database with demo data for presentations

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...\n');

  // Clear existing data (in reverse order of dependencies)
  console.log('🧹 Clearing existing data...');
  await prisma.djQueue.deleteMany({});
  await prisma.vipSession.deleteMany({});
  await prisma.dancerCheckIn.deleteMany({});
  await prisma.financialTransaction.deleteMany({});
  await prisma.cashDrawer.deleteMany({});
  await prisma.shift.deleteMany({});
  await prisma.songPlayLog.deleteMany({});
  await prisma.musicLibrary.deleteMany({});
  await prisma.vipBooth.deleteMany({});
  await prisma.dancer.deleteMany({});
  await prisma.auditLog.deleteMany({});
  await prisma.verificationAlert.deleteMany({});
  await prisma.anomalyReport.deleteMany({});
  await prisma.usageAnalytics.deleteMany({});
  await prisma.subscription.deleteMany({});
  await prisma.paymentMethod.deleteMany({});
  await prisma.clubUser.deleteMany({});
  await prisma.club.deleteMany({});

  // 1. Create Demo Club
  console.log('🏢 Creating demo club...');
  const club = await prisma.club.create({
    data: {
      name: 'Diamond Club',
      subdomain: 'diamond',
      subscriptionTier: 'enterprise',
      subscriptionStatus: 'active',
      barFeeAmount: 50.00,
      vipSongRate: 30.00,
      avgSongDuration: 210,
      settings: {
        timezone: 'America/New_York',
        currency: 'USD',
        openingTime: '20:00',
        closingTime: '04:00'
      }
    }
  });
  console.log(`   ✅ Created club: ${club.name} (${club.id})`);

  // 2. Create Club Users
  console.log('👥 Creating club users...');
  const passwordHash = await bcrypt.hash('password', 10);
  
  const users = await Promise.all([
    prisma.clubUser.create({
      data: {
        clubId: club.id,
        email: 'admin@clubops.com',
        passwordHash,
        role: 'OWNER',
        firstName: 'Tony',
        lastName: 'Manager',
        phone: '+1234567890',
        pin: '1234',
        isActive: true
      }
    }),
    prisma.clubUser.create({
      data: {
        clubId: club.id,
        email: 'manager@clubops.com',
        passwordHash,
        role: 'MANAGER',
        firstName: 'Sarah',
        lastName: 'Smith',
        phone: '+1234567891',
        pin: '5678',
        isActive: true
      }
    }),
    prisma.clubUser.create({
      data: {
        clubId: club.id,
        email: 'doorstaff@clubops.com',
        passwordHash,
        role: 'DOOR_STAFF',
        firstName: 'Mike',
        lastName: 'Johnson',
        phone: '+1234567892',
        pin: '9012',
        isActive: true
      }
    }),
    prisma.clubUser.create({
      data: {
        clubId: club.id,
        email: 'viphost@clubops.com',
        passwordHash,
        role: 'VIP_HOST',
        firstName: 'Jessica',
        lastName: 'Williams',
        phone: '+1234567893',
        pin: '3456',
        isActive: true
      }
    }),
    prisma.clubUser.create({
      data: {
        clubId: club.id,
        email: 'dj@clubops.com',
        passwordHash,
        role: 'DJ',
        firstName: 'DJ',
        lastName: 'Beats',
        phone: '+1234567894',
        pin: '7890',
        isActive: true
      }
    })
  ]);
  console.log(`   ✅ Created ${users.length} users`);

  // 3. Create Dancers with various license statuses
  console.log('💃 Creating dancers...');
  const now = new Date();
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
  const yesterday = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000);
  const sixMonthsFromNow = new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000);

  const dancers = await Promise.all([
    prisma.dancer.create({
      data: {
        clubId: club.id,
        stageName: 'Luna',
        legalName: 'Sarah Johnson',
        phone: '+1555000001',
        email: 'luna@example.com',
        licenseNumber: 'DL-2024-001',
        licenseExpiryDate: sixMonthsFromNow,
        licenseStatus: 'valid',
        photoUrl: 'https://api.dicebear.com/7.x/personas/svg?seed=Luna',
        isActive: true,
        preferredMusic: ['R&B', 'Hip-Hop', 'Pop']
      }
    }),
    prisma.dancer.create({
      data: {
        clubId: club.id,
        stageName: 'Crystal',
        legalName: 'Jessica Martinez',
        phone: '+1555000002',
        email: 'crystal@example.com',
        licenseNumber: 'DL-2024-002',
        licenseExpiryDate: thirtyDaysFromNow,
        licenseStatus: 'valid',
        photoUrl: 'https://api.dicebear.com/7.x/personas/svg?seed=Crystal',
        isActive: true,
        preferredMusic: ['EDM', 'House', 'Techno']
      }
    }),
    prisma.dancer.create({
      data: {
        clubId: club.id,
        stageName: 'Diamond',
        legalName: 'Maria Rodriguez',
        phone: '+1555000003',
        email: 'diamond@example.com',
        licenseNumber: 'DL-2024-003',
        licenseExpiryDate: sevenDaysFromNow,
        licenseStatus: 'valid',
        photoUrl: 'https://api.dicebear.com/7.x/personas/svg?seed=Diamond',
        isActive: true,
        preferredMusic: ['Latin', 'Reggaeton', 'Pop']
      }
    }),
    prisma.dancer.create({
      data: {
        clubId: club.id,
        stageName: 'Sapphire',
        legalName: 'Emily Chen',
        phone: '+1555000004',
        email: 'sapphire@example.com',
        licenseNumber: 'DL-2024-004',
        licenseExpiryDate: threeDaysFromNow,
        licenseStatus: 'valid',
        photoUrl: 'https://api.dicebear.com/7.x/personas/svg?seed=Sapphire',
        isActive: true,
        preferredMusic: ['R&B', 'Soul', 'Jazz']
      }
    }),
    prisma.dancer.create({
      data: {
        clubId: club.id,
        stageName: 'Ruby',
        legalName: 'Amanda Wilson',
        phone: '+1555000005',
        email: 'ruby@example.com',
        licenseNumber: 'DL-2024-005',
        licenseExpiryDate: yesterday,
        licenseStatus: 'expired',
        photoUrl: 'https://api.dicebear.com/7.x/personas/svg?seed=Ruby',
        isActive: true,
        preferredMusic: ['Hip-Hop', 'Trap', 'R&B']
      }
    }),
    prisma.dancer.create({
      data: {
        clubId: club.id,
        stageName: 'Pearl',
        legalName: 'Nicole Thompson',
        phone: '+1555000006',
        email: 'pearl@example.com',
        licenseNumber: 'DL-2024-006',
        licenseExpiryDate: sixMonthsFromNow,
        licenseStatus: 'valid',
        photoUrl: 'https://api.dicebear.com/7.x/personas/svg?seed=Pearl',
        isActive: true,
        preferredMusic: ['Pop', 'Dance', 'Electronic']
      }
    }),
    prisma.dancer.create({
      data: {
        clubId: club.id,
        stageName: 'Jade',
        legalName: 'Sophia Lee',
        phone: '+1555000007',
        email: 'jade@example.com',
        licenseNumber: 'DL-2024-007',
        licenseExpiryDate: sixMonthsFromNow,
        licenseStatus: 'valid',
        photoUrl: 'https://api.dicebear.com/7.x/personas/svg?seed=Jade',
        isActive: true,
        preferredMusic: ['K-Pop', 'Pop', 'Dance']
      }
    }),
    prisma.dancer.create({
      data: {
        clubId: club.id,
        stageName: 'Amber',
        legalName: 'Rachel Brown',
        phone: '+1555000008',
        email: 'amber@example.com',
        licenseNumber: 'DL-2024-008',
        licenseExpiryDate: sixMonthsFromNow,
        licenseStatus: 'valid',
        photoUrl: 'https://api.dicebear.com/7.x/personas/svg?seed=Amber',
        isActive: true,
        preferredMusic: ['Rock', 'Alternative', 'Indie']
      }
    })
  ]);
  console.log(`   ✅ Created ${dancers.length} dancers`);

  // 4. Create VIP Booths
  console.log('🎭 Creating VIP booths...');
  const vipBooths = await Promise.all([
    prisma.vipBooth.create({
      data: {
        clubId: club.id,
        boothName: 'VIP Suite 1',
        boothNumber: 1,
        capacity: 6,
        songRate: 30.00,
        isAvailable: true,
        isActive: true
      }
    }),
    prisma.vipBooth.create({
      data: {
        clubId: club.id,
        boothName: 'VIP Suite 2',
        boothNumber: 2,
        capacity: 4,
        songRate: 30.00,
        isAvailable: true,
        isActive: true
      }
    }),
    prisma.vipBooth.create({
      data: {
        clubId: club.id,
        boothName: 'Champagne Room',
        boothNumber: 3,
        capacity: 8,
        songRate: 50.00,
        isAvailable: true,
        isActive: true
      }
    }),
    prisma.vipBooth.create({
      data: {
        clubId: club.id,
        boothName: 'Private Room A',
        boothNumber: 4,
        capacity: 2,
        songRate: 25.00,
        isAvailable: true,
        isActive: true
      }
    }),
    prisma.vipBooth.create({
      data: {
        clubId: club.id,
        boothName: 'Private Room B',
        boothNumber: 5,
        capacity: 2,
        songRate: 25.00,
        isAvailable: true,
        isActive: true
      }
    })
  ]);
  console.log(`   ✅ Created ${vipBooths.length} VIP booths`);

  // 5. Create Music Library
  console.log('🎵 Creating music library...');
  const songs = await Promise.all([
    prisma.musicLibrary.create({
      data: {
        clubId: club.id,
        title: 'Blinding Lights',
        artist: 'The Weeknd',
        album: 'After Hours',
        durationSeconds: 200,
        fileFormat: 'mp3'
      }
    }),
    prisma.musicLibrary.create({
      data: {
        clubId: club.id,
        title: 'Levitating',
        artist: 'Dua Lipa',
        album: 'Future Nostalgia',
        durationSeconds: 203,
        fileFormat: 'mp3'
      }
    }),
    prisma.musicLibrary.create({
      data: {
        clubId: club.id,
        title: 'Savage',
        artist: 'Megan Thee Stallion',
        album: 'Suga',
        durationSeconds: 189,
        fileFormat: 'mp3'
      }
    }),
    prisma.musicLibrary.create({
      data: {
        clubId: club.id,
        title: 'WAP',
        artist: 'Cardi B ft. Megan',
        album: 'WAP Single',
        durationSeconds: 187,
        fileFormat: 'mp3'
      }
    }),
    prisma.musicLibrary.create({
      data: {
        clubId: club.id,
        title: 'Midnight City',
        artist: 'M83',
        album: 'Hurry Up, We\'re Dreaming',
        durationSeconds: 244,
        fileFormat: 'mp3'
      }
    }),
    prisma.musicLibrary.create({
      data: {
        clubId: club.id,
        title: 'Get Lucky',
        artist: 'Daft Punk',
        album: 'Random Access Memories',
        durationSeconds: 248,
        fileFormat: 'mp3'
      }
    }),
    prisma.musicLibrary.create({
      data: {
        clubId: club.id,
        title: 'Tití Me Preguntó',
        artist: 'Bad Bunny',
        album: 'Un Verano Sin Ti',
        durationSeconds: 244,
        fileFormat: 'mp3'
      }
    }),
    prisma.musicLibrary.create({
      data: {
        clubId: club.id,
        title: 'As It Was',
        artist: 'Harry Styles',
        album: 'Harry\'s House',
        durationSeconds: 167,
        fileFormat: 'mp3'
      }
    })
  ]);
  console.log(`   ✅ Created ${songs.length} songs`);

  // 6. Create DJ Queue entries
  console.log('📋 Creating DJ queue...');
  const queueEntries = await Promise.all([
    prisma.djQueue.create({
      data: {
        clubId: club.id,
        dancerId: dancers[0].id, // Luna
        stageName: 'Main Stage',
        position: 1,
        songRequest: 'Blinding Lights - The Weeknd',
        durationMinutes: 3,
        status: 'queued',
        startedAt: new Date()
      }
    }),
    prisma.djQueue.create({
      data: {
        clubId: club.id,
        dancerId: dancers[1].id, // Crystal
        stageName: 'Main Stage',
        position: 2,
        songRequest: 'Levitating - Dua Lipa',
        durationMinutes: 3,
        status: 'queued'
      }
    }),
    prisma.djQueue.create({
      data: {
        clubId: club.id,
        dancerId: dancers[5].id, // Pearl
        stageName: 'Main Stage',
        position: 3,
        songRequest: 'Get Lucky - Daft Punk',
        durationMinutes: 4,
        status: 'queued'
      }
    }),
    prisma.djQueue.create({
      data: {
        clubId: club.id,
        dancerId: dancers[6].id, // Jade
        stageName: 'Main Stage',
        position: 4,
        songRequest: 'As It Was - Harry Styles',
        durationMinutes: 3,
        status: 'queued'
      }
    }),
    prisma.djQueue.create({
      data: {
        clubId: club.id,
        dancerId: dancers[2].id, // Diamond
        stageName: 'Side Stage',
        position: 1,
        songRequest: 'Tití Me Preguntó - Bad Bunny',
        durationMinutes: 4,
        status: 'queued',
        startedAt: new Date()
      }
    }),
    prisma.djQueue.create({
      data: {
        clubId: club.id,
        dancerId: dancers[7].id, // Amber
        stageName: 'Side Stage',
        position: 2,
        songRequest: 'Midnight City - M83',
        durationMinutes: 4,
        status: 'queued'
      }
    })
  ]);
  console.log(`   ✅ Created ${queueEntries.length} queue entries`);

  // 7. Create a Subscription
  console.log('💳 Creating subscription...');
  const subscription = await prisma.subscription.create({
    data: {
      clubId: club.id,
      status: 'active',
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
      cancelAtPeriodEnd: false
    }
  });
  console.log('   ✅ Created subscription');

  // Print summary
  console.log('\n' + '='.repeat(50));
  console.log('🎉 SEED COMPLETE!\n');
  console.log('📊 Summary:');
  console.log(`   • Club: ${club.name}`);
  console.log(`   • Users: ${users.length}`);
  console.log(`   • Dancers: ${dancers.length}`);
  console.log(`   • VIP Booths: ${vipBooths.length}`);
  console.log(`   • Songs: ${songs.length}`);
  console.log(`   • Queue Entries: ${queueEntries.length}`);
  console.log('\n🔑 Login Credentials:');
  console.log('   Email: admin@clubops.com');
  console.log('   Password: password');
  console.log('='.repeat(50) + '\n');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

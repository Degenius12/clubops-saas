/**
 * Seed Demo Accounts for ClubFlow
 * Creates one demo account for each employee role
 *
 * Run with: node backend/scripts/seedDemoAccounts.js
 */

const bcrypt = require('bcryptjs')
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

const DEMO_ACCOUNTS = [
  {
    email: 'owner@demo.clubflow.com',
    password: 'demo123',
    name: 'Demo Owner',
    role: 'OWNER',
    phone: '+1-555-0001',
  },
  {
    email: 'manager@demo.clubflow.com',
    password: 'demo123',
    name: 'Demo Manager',
    role: 'MANAGER',
    phone: '+1-555-0002',
  },
  {
    email: 'dj@demo.clubflow.com',
    password: 'demo123',
    name: 'Demo DJ',
    role: 'DJ',
    phone: '+1-555-0003',
  },
  {
    email: 'viphost@demo.clubflow.com',
    password: 'demo123',
    name: 'Demo VIP Host',
    role: 'VIP_HOST',
    phone: '+1-555-0004',
  },
  {
    email: 'doorstaff@demo.clubflow.com',
    password: 'demo123',
    name: 'Demo Door Staff',
    role: 'DOOR_STAFF',
    phone: '+1-555-0005',
  },
  {
    email: 'bartender@demo.clubflow.com',
    password: 'demo123',
    name: 'Demo Bartender',
    role: 'BARTENDER',
    phone: '+1-555-0006',
  },
]

async function seedDemoAccounts() {
  console.log('🌱 Starting demo account seeding...\n')

  try {
    // First, find or create a demo club
    let demoClub = await prisma.club.findFirst({
      where: { name: 'Demo Club' }
    })

    if (!demoClub) {
      console.log('📍 Creating Demo Club...')
      demoClub = await prisma.club.create({
        data: {
          name: 'Demo Club',
          subdomain: 'demo',
          // Using default values: subscriptionTier: 'free', subscriptionStatus: 'active'
        }
      })
      console.log(`✅ Demo Club created: ${demoClub.name} (ID: ${demoClub.id})\n`)
    } else {
      console.log(`✅ Using existing Demo Club (ID: ${demoClub.id})\n`)
    }

    // Create or update demo accounts
    for (const account of DEMO_ACCOUNTS) {
      const { email, password, name, role, phone } = account

      // Check if account already exists
      const existingUser = await prisma.clubUser.findFirst({
        where: {
          clubId: demoClub.id,
          email: email
        }
      })

      if (existingUser) {
        console.log(`⚠️  User already exists: ${email}`)
        console.log(`   To reset password, manually delete and re-run this script\n`)
        continue
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10)

      // Split name into first and last
      const nameParts = name.split(' ')
      const firstName = nameParts[0]
      const lastName = nameParts.slice(1).join(' ') || null

      // Create user
      const user = await prisma.clubUser.create({
        data: {
          clubId: demoClub.id,
          email,
          passwordHash: hashedPassword,
          firstName,
          lastName,
          role,
          phone,
          isActive: true,
        }
      })

      console.log(`✅ Created ${role} account:`)
      console.log(`   Email: ${email}`)
      console.log(`   Password: ${password}`)
      console.log(`   Name: ${name}`)
      console.log(`   Club: ${demoClub.name}`)
      console.log(`   ID: ${user.id}\n`)
    }

    console.log('✨ Demo account seeding complete!\n')
    console.log('📋 Demo Account Summary:')
    console.log('━'.repeat(60))
    console.log('Role          | Email                       | Password')
    console.log('━'.repeat(60))
    DEMO_ACCOUNTS.forEach(acc => {
      const rolePadded = acc.role.padEnd(13)
      const emailPadded = acc.email.padEnd(27)
      console.log(`${rolePadded} | ${emailPadded} | demo123`)
    })
    console.log('━'.repeat(60))
    console.log('\n🎯 You can now log in with any of these accounts to test different role permissions!\n')

  } catch (error) {
    console.error('❌ Error seeding demo accounts:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

seedDemoAccounts()

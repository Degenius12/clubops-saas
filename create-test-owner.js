// Create test owner account for backup testing

const path = require('path');
process.chdir(path.join(__dirname, 'backend'));

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createTestOwner() {
  try {
    console.log('Creating test owner account...');
    
    // Hash the password
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    // Check if owner already exists
    const existing = await prisma.user.findUnique({
      where: { email: 'owner@test.com' }
    });
    
    if (existing) {
      console.log('Owner account already exists');
      return existing;
    }
    
    // Create the owner
    const owner = await prisma.user.create({
      data: {
        email: 'owner@test.com',
        password: hashedPassword,
        name: 'Test Owner',
        role: 'OWNER',
        isActive: true
      }
    });
    
    console.log('✅ Test owner account created successfully');
    console.log('Email: owner@test.com');
    console.log('Password: password123');
    
    return owner;
  } catch (error) {
    console.error('❌ Failed to create test owner:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestOwner();
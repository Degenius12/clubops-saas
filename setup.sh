#!/bin/bash
# 🚀 ClubOps SaaS - Environment Setup Script
# Run this before executing Claude Code agents

echo "🚀 Setting up ClubOps SaaS development environment..."

# Navigate to project root
cd "C:\Users\tonyt\ClubOps-SaaS" || exit

# Setup frontend dependencies
echo "📦 Installing frontend dependencies..."
cd frontend
npm install next@14.0.0 react@18.2.0 react-dom@18.2.0 
npm install @tailwindcss/forms tailwindcss autoprefixer postcss
npm install framer-motion lucide-react socket.io-client axios
npm install jwt-decode react-hook-form @hookform/resolvers zod
npm install react-beautiful-dnd recharts
npm install -D typescript @types/node @types/react @types/react-dom
npm install -D @types/react-beautiful-dnd eslint eslint-config-next

# Setup backend dependencies  
echo "⚙️ Installing backend dependencies..."
cd ../backend
npm install express socket.io cors helmet bcryptjs jsonwebtoken
npm install prisma @prisma/client multer rate-limiter-flexible
npm install express-validator nodemailer cron dotenv morgan
npm install compression pg paddle-sdk stripe
npm install -D nodemon jest supertest eslint

# Initialize Prisma
echo "🗄️ Initializing database..."
npx prisma init

# Create environment files
echo "🔧 Creating environment files..."
cat > .env << EOL
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/clubops_dev"

# JWT
JWT_SECRET="your-super-secure-jwt-secret-key-here"
JWT_EXPIRES_IN="7d"

# Paddle (Primary Payment Processor)
PADDLE_VENDOR_ID="your-paddle-vendor-id"
PADDLE_API_KEY="your-paddle-api-key"
PADDLE_WEBHOOK_SECRET="your-paddle-webhook-secret"

# Stripe (Backup Payment Processor)  
STRIPE_SECRET_KEY="sk_test_your-stripe-secret-key"
STRIPE_WEBHOOK_SECRET="whsec_your-stripe-webhook-secret"

# Email (Compliance Notifications)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"

# Application
NODE_ENV="development"
PORT="3001"
CLIENT_URL="http://localhost:3000"
EOL

cd ../frontend
cat > .env.local << EOL
# API Configuration
NEXT_PUBLIC_API_URL="http://localhost:3001"
NEXT_PUBLIC_SOCKET_URL="http://localhost:3001"

# Payment Configuration (Public Keys)
NEXT_PUBLIC_PADDLE_VENDOR_ID="your-paddle-vendor-id"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_your-stripe-public-key"

# Application Settings
NEXT_PUBLIC_APP_NAME="ClubOps SaaS"
NEXT_PUBLIC_APP_VERSION="1.0.0"
EOL

# Setup Tailwind config
cd ../frontend
cat > tailwind.config.js << EOL
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // ClubOps Brand Colors (Dark Theme)
        'club-dark': '#0a0a0a',
        'club-darker': '#050505', 
        'club-blue': '#2563eb',
        'club-gold': '#f59e0b',
        'club-red': '#ef4444',
        'club-gray': '#374151',
        'club-light': '#9ca3af'
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}
EOL

# Create basic Prisma schema
cd ../backend
cat > prisma/schema.prisma << EOL
// ClubOps SaaS Database Schema
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// Multi-tenant Club entity
model Club {
  id          String   @id @default(cuid())
  name        String
  subdomain   String   @unique
  tier        SubscriptionTier @default(FREE)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  // Relations
  users       User[]
  dancers     Dancer[]
  vipRooms    VIPRoom[]
  djQueue     DJQueueItem[]
  
  @@map("clubs")
}

enum SubscriptionTier {
  FREE
  BASIC  
  PRO
  ENTERPRISE
}

// User management with roles
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String
  name      String
  role      UserRole @default(MANAGER)
  clubId    String
  createdAt DateTime @default(now())
  
  club      Club @relation(fields: [clubId], references: [id], onDelete: Cascade)
  
  @@map("users")
}

enum UserRole {
  OWNER
  MANAGER  
  DJ
  DANCER
}

// Dancer management with compliance
model Dancer {
  id            String      @id @default(cuid())
  name          String
  licenseNumber String?
  licenseExpiry DateTime?
  status        DancerStatus @default(INACTIVE)
  checkInTime   DateTime?
  clubId        String
  createdAt     DateTime    @default(now())
  
  club          Club @relation(fields: [clubId], references: [id], onDelete: Cascade)
  
  @@map("dancers")
}

enum DancerStatus {
  ACTIVE
  INACTIVE  
  EXPIRED_LICENSE
  SUSPENDED
}

// VIP Room tracking
model VIPRoom {
  id          String    @id @default(cuid()) 
  name        String
  isOccupied  Boolean   @default(false)
  timerStart  DateTime?
  timerEnd    DateTime?
  clubId      String
  
  club        Club @relation(fields: [clubId], references: [id], onDelete: Cascade)
  
  @@map("vip_rooms")
}

// DJ Queue management  
model DJQueueItem {
  id          String   @id @default(cuid())
  songTitle   String
  artist      String
  requestedBy String?
  position    Int
  played      Boolean  @default(false)
  clubId      String
  createdAt   DateTime @default(now())
  
  club        Club @relation(fields: [clubId], references: [id], onDelete: Cascade)
  
  @@map("dj_queue")
}
EOL

echo "✅ Environment setup complete!"
echo ""
echo "🎯 Next Steps:"
echo "1. Update .env files with your actual credentials"
echo "2. Setup PostgreSQL database (Railway/Supabase)"
echo "3. Run 'npx prisma db push' to create tables"
echo "4. Open VS Code and start Claude Code agents:"
echo ""
echo "   code ClubOps-SaaS/"
echo ""
echo "5. Follow CLAUDE_CODE_COMMANDS.md for agent execution"
echo ""
echo "🚀 Ready for Claude Code implementation!"
#!/bin/bash

# ============================================
# ClubFlow Development Environment Setup
# ============================================

set -e

echo "🎪 ClubFlow Development Environment"
echo "===================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check Node.js
if command -v node &> /dev/null; then
    echo -e "${GREEN}✓${NC} Node.js: $(node --version)"
else
    echo -e "${RED}✗${NC} Node.js not found!"
    exit 1
fi

# Check npm
if command -v npm &> /dev/null; then
    echo -e "${GREEN}✓${NC} npm: $(npm --version)"
else
    echo -e "${RED}✗${NC} npm not found!"
    exit 1
fi

# Check for node_modules
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 Installing dependencies...${NC}"
    npm install
else
    echo -e "${GREEN}✓${NC} Dependencies installed"
fi

# Check for .env.local
if [ -f ".env.local" ]; then
    echo -e "${GREEN}✓${NC} Environment file found"
else
    echo -e "${YELLOW}⚠${NC} Warning: .env.local not found"
    echo "  Create from .env.example if available"
fi

# Check database connection
echo -e "\n📊 Checking database..."
if npx prisma db pull --force 2>/dev/null; then
    echo -e "${GREEN}✓${NC} Database connected"
else
    echo -e "${YELLOW}⚠${NC} Database check skipped or failed"
fi

# Generate Prisma client
echo -e "\n🔧 Generating Prisma client..."
npx prisma generate 2>/dev/null || echo -e "${YELLOW}⚠${NC} Prisma generate skipped"

# Kill any existing dev server on port 3000
echo -e "\n🔍 Checking for existing processes on port 3000..."
if lsof -i :3000 -t &> /dev/null; then
    echo -e "${YELLOW}⚠${NC} Killing existing process on port 3000"
    kill $(lsof -i :3000 -t) 2>/dev/null || true
    sleep 2
fi

# Start dev server
echo -e "\n🚀 Starting development server..."
npm run dev &
DEV_PID=$!

# Wait for server to be ready
echo "⏳ Waiting for server to start..."
sleep 5

# Check if server is running
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} Server is running!"
else
    echo -e "${YELLOW}⚠${NC} Server may still be starting..."
fi

echo -e "\n============================================"
echo -e "${GREEN}ClubFlow is ready for development!${NC}"
echo "============================================"
echo ""
echo "📍 Local URL:     http://localhost:3000"
echo "📊 Dashboard:     http://localhost:3000/dashboard"
echo "🔐 Login:         http://localhost:3000/login"
echo "🗄️ Prisma Studio: npx prisma studio"
echo ""
echo "💡 Tips:"
echo "   - Check claude-progress.txt for session notes"
echo "   - Review feature_list.json for pending work"
echo "   - Commit frequently with descriptive messages"
echo ""
echo "Server PID: $DEV_PID"
echo "To stop: kill $DEV_PID"

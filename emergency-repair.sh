#!/bin/bash
# CLUBOPS SAAS - EMERGENCY REPAIR DEPLOYMENT

echo "🚨 CLUBOPS EMERGENCY REPAIR DEPLOYMENT"
echo "====================================="

# Step 1: Backup current configs
echo "📁 Backing up current configurations..."
cp backend/vercel.json backend/vercel-backup.json 2>/dev/null || true
cp frontend/vercel.json frontend/vercel-backup.json 2>/dev/null || true

# Step 2: Apply fixed configurations
echo "🔧 Applying emergency fixes..."
cp backend/vercel-fixed.json backend/vercel.json
cp frontend/vercel-fixed.json frontend/vercel.json

# Step 3: Ensure dependencies are installed
echo "📦 Installing dependencies..."
cd backend && npm install --production
cd ../frontend && npm install

# Step 4: Build frontend
echo "🏗️ Building frontend..."
npm run build

# Step 5: Deploy backend first
echo "🚀 Deploying backend..."
cd ../backend
vercel --prod --confirm --yes || {
    echo "❌ Backend deployment failed!"
    exit 1
}

# Step 6: Deploy frontend
echo "🚀 Deploying frontend..."
cd ../frontend
vercel --prod --confirm --yes || {
    echo "❌ Frontend deployment failed!"
    exit 1
}

# Step 7: Test deployment
echo "🧪 Testing deployment..."
cd ..
node diagnostic-test.js

echo "✅ Emergency repair deployment complete!"
echo "🔗 Check the diagnostic results above for status"
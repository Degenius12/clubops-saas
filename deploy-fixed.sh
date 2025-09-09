#!/bin/bash

# ClubOps SaaS - Complete Deployment Script
# This script will deploy both frontend and backend to Vercel

echo "🚀 Starting ClubOps SaaS Deployment Process..."

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm install -g vercel
fi

echo "📦 Building and deploying backend..."
cd backend
vercel --prod --confirm

echo "✅ Backend deployed!"

echo "📦 Building and deploying frontend..."
cd ../frontend
vercel --prod --confirm

echo "✅ Frontend deployed!"

echo "🎉 Deployment complete!"
echo ""
echo "🔗 Your application URLs:"
echo "Frontend: https://frontend-o9bhynpim-tony-telemacques-projects.vercel.app"
echo "Backend: https://clubops-backend-qgwp5goeh-tony-telemacques-projects.vercel.app"
echo ""
echo "🧪 Test your deployment:"
echo "1. Visit the frontend URL"
echo "2. Try logging in with: admin@clubops.com / password"
echo "3. Check that all features work"

# Test the health endpoint
echo "🏥 Testing backend health..."
curl -X GET "https://clubops-backend-qgwp5goeh-tony-telemacques-projects.vercel.app/health"

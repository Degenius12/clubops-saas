#!/bin/bash
# ClubOps Production Deployment Script

echo "🚀 Starting ClubOps Production Deployment..."

# Set production environment
export NODE_ENV=production

echo "📦 Building Frontend with Production Config..."
cd frontend
# Copy production environment
cp .env.production .env
npm run build

echo "🔄 Deploying Frontend to Vercel..."
vercel --prod

echo "📦 Preparing Backend for Production..."
cd ../backend
# Copy production environment
cp .env.production .env

echo "🔄 Deploying Backend to Vercel..."
vercel --prod

echo "✅ Deployment Complete!"
echo "🌐 Frontend: https://frontend-o9bhynpim-tony-telemacques-projects.vercel.app"
echo "🔗 Backend: https://clubops-backend-qgwp5goeh-tony-telemacques-projects.vercel.app"
echo "🧪 Test the login at the frontend URL with admin@clubops.com"
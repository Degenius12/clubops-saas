# Quick Database Setup for ClubOps

## Option 1: Vercel Postgres (Easiest)
1. Go to https://vercel.com/dashboard
2. Click "Storage" tab
3. Click "Create Database" 
4. Select "Postgres"
5. Name it: "clubops-database"
6. Click "Create"
7. Go to the .env.local tab and copy the DATABASE_URL

## Option 2: Railway Postgres (Alternative)  
1. Go to https://railway.app/dashboard
2. Click "New Project"
3. Select "Deploy PostgreSQL"
4. Once deployed, click on "PostgreSQL" service
5. Go to "Variables" tab
6. Copy the DATABASE_URL value

## Import Your Schema (After database is created)
1. Connect to your database using the connection string
2. Run this SQL (copy from your schema.sql file):

```sql
-- Your complete schema is in: 
-- C:\Users\tonyt\ClubOps-SaaS\database\schema.sql
```

## Set Environment Variables in Vercel
1. Go to your Vercel project dashboard
2. Click "Settings" → "Environment Variables" 
3. Add these variables:
   - DATABASE_URL: (paste your database connection string)
   - JWT_SECRET: clubops-super-secret-jwt-key-2024-make-this-very-long-and-random-please
   - NODE_ENV: production
   - FRONTEND_URL: https://localhost:3000 (for now)

## Test Your Deployment
Once everything is set up, test with:
```bash
curl -X POST https://your-backend-url.vercel.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "clubName": "Demo Club", 
    "subdomain": "demo",
    "email": "owner@demo.com",
    "password": "password123",
    "firstName": "John",
    "lastName": "Smith"
  }'
```

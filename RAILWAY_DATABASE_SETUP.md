# Railway PostgreSQL Setup - Step by Step Guide

## 🚀 QUICK 2-MINUTE DATABASE SETUP

### Step 1: Go to Railway
1. Open: https://railway.app/new
2. Sign in with GitHub (if needed)

### Step 2: Create PostgreSQL Database
1. Click **"Deploy PostgreSQL"** (the purple database icon)
2. Wait 30 seconds for deployment to complete
3. ✅ Your database is ready!

### Step 3: Get Your Connection String
1. Click on the **PostgreSQL** service (purple box)
2. Go to **"Variables"** tab at the top
3. Find **DATABASE_URL** 
4. Click the **👁️ eye icon** to reveal the full URL
5. Click **📋 copy icon** to copy the connection string

**Your DATABASE_URL looks like:**
`postgresql://postgres:PASSWORD@HOST:5432/railway`

### Step 4: Import Your Database Schema
1. Still in Railway, go to **"Query"** tab
2. Copy the contents of your schema file: 
   `C:\Users\tonyt\ClubOps-SaaS\database\schema.sql`
3. Paste it into the Query box
4. Click **"Run Query"**
5. ✅ Your tables are created!

### Step 5: Add to Vercel Environment Variables
1. Go to your Vercel project settings
2. Environment Variables section  
3. Add:
   - **Key**: `DATABASE_URL`
   - **Value**: [paste the connection string from Railway]

## 🎯 ALTERNATIVE: Use Schema from File
Instead of step 4 above, you can:
1. Use any PostgreSQL client (like pgAdmin or DBeaver)
2. Connect using the Railway connection string
3. Run the schema.sql file

## ✅ WHAT YOU'LL HAVE
- PostgreSQL database running on Railway
- All your tables created (clubs, dancers, users, etc.)
- Connection string ready for Vercel
- Multi-tenant database ready for your SaaS

**Total time: 2-3 minutes max!**

## 🆘 TROUBLESHOOTING
- **Can't find DATABASE_URL**: Check the Variables tab in Railway
- **Schema errors**: Make sure you copied the complete schema.sql file
- **Connection issues**: Verify the connection string format includes password

**Railway is much simpler than other database providers - just click PostgreSQL and you're done!**

# Alternative Schema Import Methods

## Method 1: Using pgAdmin or DBeaver
1. Download pgAdmin (free): https://www.pgadmin.org/download/
2. Connect using your DATABASE_URL
3. Paste and run the complete schema.sql

## Method 2: Using Command Line (if you have psql)
```bash
psql "postgresql://postgres:zylooEZsbSQiqNmnwTeoCtYgVjTpIKgR@EXTERNAL_HOST:5432/railway" -f "C:\Users\tonyt\ClubOps-SaaS\database\schema.sql"
```

## Method 3: Using VS Code Extension
1. Install "PostgreSQL" extension in VS Code
2. Connect using your DATABASE_URL
3. Run the schema queries

## What We Need:
1. ✅ Your DATABASE_URL (you have this)
2. 🔄 External hostname version (for Vercel)
3. 🔄 Schema imported (using any method above)

Your current URL: 
postgresql://postgres:zylooEZsbSQiqNmnwTeoCtYgVjTpIKgR@postgres.railway.internal:5432/railway

We need the external version for Vercel!

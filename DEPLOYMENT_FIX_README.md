# ClubOps Deployment Fix - Quick Reference
## Created: December 14, 2025

## 🎯 Purpose
These scripts fix the frontend-backend URL synchronization issue that prevents login.

## 📁 Files Created

| File | Description |
|------|-------------|
| `RUN_FIX.bat` | **Double-click this** - Easiest option, runs PowerShell script |
| `Fix-Deployment.ps1` | Full PowerShell script with all features |
| `FIX_DEPLOYMENT.bat` | Alternative batch script (if PowerShell is restricted) |

## 🚀 Quick Start

### Option 1: Double-Click (Recommended)
1. Navigate to `C:\Users\tonyt\ClubOps-SaaS\`
2. Double-click `RUN_FIX.bat`
3. Follow the prompts

### Option 2: PowerShell Direct
```powershell
cd C:\Users\tonyt\ClubOps-SaaS
.\Fix-Deployment.ps1
```

### Option 3: PowerShell with Options
```powershell
# Skip Vercel env var updates (just rebuild and deploy)
.\Fix-Deployment.ps1 -SkipVercelEnv

# Only update local files (no deployment)
.\Fix-Deployment.ps1 -LocalOnly

# Use a different backend URL
.\Fix-Deployment.ps1 -BackendUrl "https://your-custom-backend.vercel.app"
```

## 🔧 What the Script Does

1. ✅ Checks prerequisites (Node.js, npm, Vercel CLI)
2. ✅ Verifies backend is accessible
3. ✅ Updates local `.env` files with correct backend URL
4. ✅ Updates Vercel environment variables
5. ✅ Builds the frontend
6. ✅ Deploys to Vercel production
7. ✅ Falls back to GitHub push if direct deploy fails

## 🧪 After Running the Script

### Verify the Fix
1. Wait 1-2 minutes for deployment
2. Clear browser cache: `Ctrl+Shift+Delete`
3. Visit the frontend URL
4. Login with test credentials:
   - Email: `admin@clubops.com`
   - Password: `password`

### Manual Verification Commands
```bash
# Check backend health
curl https://clubops-backend.vercel.app/health

# Test login API
curl -X POST https://clubops-backend.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@clubops.com","password":"password"}'
```

## ❌ Troubleshooting

### "Vercel CLI not found"
```bash
npm install -g vercel
```

### "Not logged in to Vercel"
```bash
vercel login
```

### "Permission denied" (PowerShell)
```powershell
Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope CurrentUser
```

### Script fails but files updated
The script still updated your local files. You can:
1. Commit and push to GitHub (triggers auto-deploy)
2. Or manually run: `vercel --prod` in the frontend directory

## 📊 Current Configuration

| Setting | Value |
|---------|-------|
| Backend URL | `https://clubops-backend.vercel.app` |
| Frontend Project | `C:\Users\tonyt\ClubOps-SaaS\frontend` |
| Backend Project | `C:\Users\tonyt\ClubOps-SaaS\backend` |

## 🔗 Related URLs

- Vercel Dashboard: https://vercel.com/tony-telemacques-projects
- GitHub Repo: https://github.com/Degenius12/clubops-saas
- Backend Health: https://clubops-backend.vercel.app/health

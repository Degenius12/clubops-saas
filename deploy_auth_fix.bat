@echo off
cd /d C:\Users\tonyt\ClubOps-SaaS

echo Removing invalid file...
del invalid_file.txt

echo Adding critical environment files...
git add frontend/.env.production
git add backend/.env.production
git add FINAL_PROJECT_HANDOFF.md
git add IMMEDIATE_LOGIN_SOLUTION.md

echo Committing environment updates...
git commit -m "Fix: Update production environment files for authentication"

echo Pushing critical fixes to Vercel...
git push origin main

echo Done! Authentication fix deployed.

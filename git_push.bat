@echo off
cd /d C:\Users\tonyt\ClubOps-SaaS
git add -A
git commit -m "fix: sync API URL and add deployment scripts"
git push origin main
echo Done!

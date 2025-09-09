# 🚀 ClubOps SaaS - Claude Code Execution Commands
**Phase 2: External Agent Implementation**
**Generated**: September 3, 2025

---

## ⚡ QUICK START - Copy/Paste Commands

### 🔄 AGENT 1: DATABASE SETUP
```bash
# Open Claude Code in VS Code
# Prompt: "Initialize PostgreSQL database with Prisma for ClubOps SaaS multi-tenant architecture"

cd ClubOps-SaaS/backend
npm install prisma @prisma/client pg
npx prisma init

# Claude Code Prompt:
CONTEXT: ClubOps SaaS - $21B market opportunity gentlemen's club management
TASK: Create complete Prisma schema for multi-tenant SaaS with these entities:
- Club (tenant isolation)
- Dancer (license compliance) 
- VIPRoom (timer tracking)
- DJQueue (real-time updates)
- User (role-based auth)
- Subscription (billing tiers)

REQUIREMENTS:
- Multi-tenant data isolation
- License expiration tracking
- Real-time capable fields
- Subscription tier enforcement
- Performance optimized indexes

OUTPUT: Complete schema.prisma file with migrations
```

### 🔄 AGENT 2: BACKEND API
```bash
# Claude Code Prompt:
CONTEXT: ClubOps SaaS backend - Node.js + Express + Socket.IO + JWT
TASK: Create production-ready API server with these features:

ENDPOINTS REQUIRED:
- Authentication (register-club, login, JWT validation)
- Dancers (CRUD + license compliance checking)
- DJ Queue (real-time drag-and-drop management)
- VIP Rooms (timer controls + status updates) 
- Compliance (automated alerts + license tracking)
- Billing (Paddle webhook integration)

FEATURES:
- Multi-tenant request isolation
- Rate limiting and security
- WebSocket for real-time updates
- License expiration automation
- Payment webhook handling

OUTPUT: Complete backend server structure with all routes
```

### 🔄 AGENT 3: FRONTEND APPLICATION  
```bash
# Claude Code Prompt:
CONTEXT: ClubOps SaaS frontend - Next.js + React + Tailwind + Magic UI
TASK: Build complete dashboard application with dark theme

PAGES REQUIRED:
- /dashboard (main club management interface)
- /dancers (check-in, license management) 
- /dj-queue (drag-and-drop music queue)
- /vip-rooms (timer management interface)
- /analytics (charts and reporting)
- /settings (club configuration)
- /billing (subscription management)

FEATURES:
- Dark theme with blue/gold/red accents
- Real-time Socket.IO integration
- Drag-and-drop DJ queue
- VIP room timers with notifications
- Mobile-responsive design
- Magic UI components integration

OUTPUT: Complete Next.js application with all pages
```

### 🔄 AGENT 4: DEPLOYMENT SETUP
```bash
# Claude Code Prompt:
CONTEXT: ClubOps SaaS deployment - Vercel + Railway production setup
TASK: Create complete production deployment configuration

REQUIREMENTS:
- Vercel.json for frontend deployment
- Railway setup for PostgreSQL + backend
- Environment variables configuration  
- SSL certificates and security
- GitHub Actions CI/CD pipeline
- Error monitoring setup

INTEGRATIONS:
- Database: Railway PostgreSQL
- Frontend: Vercel (Next.js)
- Backend: Railway (Node.js)
- Payments: Paddle + Stripe
- Monitoring: Vercel Analytics

OUTPUT: Complete deployment configuration and setup scripts
```

---

## 🎯 EXECUTION SEQUENCE (45 Minutes)

### 1️⃣ FOUNDATION (15 mins)
```bash
# Terminal Command:
code ClubOps-SaaS/

# Run Database Agent first
# Run Backend Agent second  
# Test API endpoints
```

### 2️⃣ APPLICATION (20 mins)
```bash
# Run Frontend Agent
# Integrate Socket.IO real-time features
# Test drag-and-drop functionality
# Verify mobile responsiveness
```

### 3️⃣ DEPLOYMENT (10 mins)
```bash  
# Run Deployment Agent
# Configure production environment
# Deploy to Vercel + Railway
# Test production deployment
```

---

## 📋 CRITICAL SUCCESS CHECKPOINTS

### ✅ Database Complete:
- [ ] Multi-tenant schema deployed
- [ ] License compliance fields active
- [ ] Real-time capabilities enabled

### ✅ Backend Complete:
- [ ] Authentication working
- [ ] WebSocket real-time active  
- [ ] License checking automated
- [ ] Payment webhooks functional

### ✅ Frontend Complete:
- [ ] All 7 pages responsive
- [ ] Drag-and-drop queue working
- [ ] VIP timers functional
- [ ] Dark theme consistent

### ✅ Deployment Complete:
- [ ] Production URL accessible
- [ ] Database connected
- [ ] SSL certificates active
- [ ] CI/CD pipeline working

---

## 🚨 EMERGENCY COMMANDS

### If Database Issues:
```bash
npx prisma db reset
npx prisma db push
npx prisma generate
```

### If Deployment Issues:
```bash
vercel --prod
railway up
```

### If Real-time Issues:
```bash
# Check Socket.IO connection
npm install socket.io-client@latest
```

---

## 🎯 FINAL VALIDATION

### Test These Features:
1. **Multi-tenant Registration**: Create 2 clubs, verify data isolation
2. **Dancer Check-in**: Add dancer, verify license compliance alert
3. **DJ Queue**: Drag-and-drop songs, verify real-time updates
4. **VIP Rooms**: Start timer, verify countdown and notifications  
5. **Billing**: Test subscription upgrade flow
6. **Mobile**: Verify responsive design on tablet/phone

### Success Criteria:
- All features functional in production
- Performance: < 3 second load times
- Security: Authentication and authorization working
- Real-time: Socket.IO updates across all clients
- Compliance: License expiration alerts active

---

**🚀 Ready for immediate Claude Code execution!**
**Target: Deployable MVP in 45 minutes**
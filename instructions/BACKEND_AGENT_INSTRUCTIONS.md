# BACKEND AGENT - ClubOps API + SaaS Infrastructure

## CONTEXT & REQUIREMENTS  
Create backend API combining main app functionality with SaaS features.
Support multi-tenant architecture with subscription-based access control.

### Core App API Endpoints (from PRD):
- Dancer management (check-in, compliance, licensing)
- DJ queue operations (drag-and-drop, music metadata)
- VIP room management (status, timing, assignments) 
- Financial tracking (bar fees, revenue reporting)
- Music file processing (MP3/AAC/FLAC/WAV optimization)
- Offline sync capabilities (queue and sync operations)

### SaaS Backend Features Required:
- Multi-tenant middleware (club isolation)
- Authentication system with JWT
- Subscription management endpoints  
- Payment processing (Stripe webhooks)
- Usage analytics collection
- Rate limiting by subscription tier
- Feature flag enforcement

## TOOL: Claude Code (VS Code Extension)

## TASK: Create Node.js API server

### Step 1: Server Setup
```bash  
cd C:\Users\tonyt\ClubOps-SaaS\backend
npm init -y
npm install express cors helmet dotenv bcryptjs jsonwebtoken
npm install multer sharp ffmpeg-static @prisma/client stripe
npm install socket.io redis ioredis
npm install express-rate-limit express-validator
```

### Step 2: Core API Routes  
Create RESTful endpoints for main app:

1. **auth.js** - JWT authentication + club registration
2. **dancers.js** - CRUD + license compliance tracking
3. **dj-queue.js** - Queue management + real-time updates  
4. **music.js** - File upload + format conversion + metadata
5. **vip-rooms.js** - Room status + timer management
6. **financial.js** - Transaction logging + revenue reports
7. **sync.js** - Offline data synchronization

### Step 3: SaaS Infrastructure Routes
8. **subscriptions.js** - Billing + tier management  
9. **analytics.js** - Usage tracking + reporting
10. **admin.js** - Multi-tenant administration  
11. **webhooks.js** - Stripe payment processing
12. **feature-flags.js** - Subscription-based access control

### Step 4: Middleware & Services
- **multiTenant.js** - Club isolation middleware
- **rateLimiter.js** - Subscription-based rate limiting
- **fileProcessor.js** - Audio format conversion  
- **realtime.js** - Socket.IO for live updates
- **caching.js** - Redis for performance optimization

## SUCCESS CRITERIA:
- [ ] All main app API endpoints functional
- [ ] Multi-tenant architecture implemented  
- [ ] Subscription management working
- [ ] Payment processing integrated
- [ ] Real-time features operational (WebSocket)
- [ ] File processing for music formats
- [ ] Rate limiting and security implemented

Save to: `C:\Users\tonyt\ClubOps-SaaS\backend\src\`
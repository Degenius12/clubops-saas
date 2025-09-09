# 🚀 ClubOps SaaS - Specialized Agent Instructions
**Generated**: September 3, 2025  
**Phase**: 2 - External Agent Execution  
**Target**: Claude Code Implementation  

---

## 🎯 MASTER CONTEXT (All Agents)

**PROJECT**: ClubOps SaaS - Premium Gentlemen's Club Management Platform  
**MARKET**: $21B opportunity, no specialized competitors  
**TECH STACK**: React + Node.js + PostgreSQL + Prisma + Vercel + Railway  
**THEME**: Dark UI with blue/gold/red accents  

### Core Features Required:
- Multi-tenant SaaS architecture  
- Dancer check-in with license compliance  
- DJ queue with drag-and-drop  
- VIP room tracking with timers  
- Real-time updates via WebSocket  
- Subscription billing (Free/Basic/Pro/Enterprise)  

---

## 1️⃣ RESEARCH AGENT INSTRUCTIONS

### 🔍 AGENT ROLE: Market Analysis & User Research
**TOOL**: Claude Code (VS Code Extension)  
**FOCUS**: Deep competitive analysis, user personas, pricing validation  

### IMMEDIATE TASKS:
```bash
# Create research directory structure
mkdir -p ./ClubOps-SaaS/research/{market,competitors,users,pricing}

# Generate competitive analysis files
touch ./ClubOps-SaaS/research/competitors/{current-solutions.md,gap-analysis.md,differentiation.md}

# Create user persona files  
touch ./ClubOps-SaaS/research/users/{club-managers.md,dancers.md,djs.md,owners.md}
```

### RESEARCH DELIVERABLES:
1. **Competitive Landscape**: Document existing solutions (Toast, Square, generic POS)
2. **Pricing Strategy**: Validate subscription tiers against market data
3. **User Journey Maps**: Create flows for each user type
4. **Compliance Requirements**: Research state-by-state dancer licensing laws
5. **Integration Opportunities**: POS systems, payment processors, music APIs

### SUCCESS CRITERIA:
- 5+ competitor profiles with feature comparisons
- Detailed user personas with pain points
- Validated pricing strategy with market justification
- Compliance checklist for top 10 US states

---

## 2️⃣ DESIGN AGENT INSTRUCTIONS

### 🎨 AGENT ROLE: UI/UX Design & Component Library
**TOOL**: Claude Code (VS Code Extension)  
**FOCUS**: Dark theme, premium aesthetic, mobile-first approach  

### IMMEDIATE TASKS:
```bash
# Create design system structure
mkdir -p ./ClubOps-SaaS/frontend/src/{components,assets,styles}
mkdir -p ./ClubOps-SaaS/design/{mockups,components,assets}

# Initialize Tailwind and styling
npm install -D tailwindcss @tailwindcss/forms @tailwindcss/typography
npx tailwindcss init -p
```

### DESIGN DELIVERABLES:
1. **Design System**: Color palette, typography, spacing rules
2. **Component Library**: 20+ reusable React components using Magic UI
3. **Dashboard Layouts**: Club manager, dancer, DJ, owner views
4. **Mobile Responsiveness**: Optimized for tablet/phone usage in clubs
5. **Accessibility**: WCAG 2.1 AA compliance for ADA requirements

### KEY COMPONENTS TO CREATE:
```typescript
// Priority components for ClubOps
- DancerCheckInCard (with license status indicator)
- DJQueueManager (drag-and-drop interface) 
- VIPRoomTimer (real-time countdown)
- ComplianceAlert (automated warnings)
- SubscriptionTierDisplay (billing integration)
- RealtimeStatusBoard (WebSocket updates)
```

### SUCCESS CRITERIA:
- Functional component library with Storybook
- Responsive layouts for all screen sizes
- Dark theme with consistent branding
- Accessibility audit passed

---

## 3️⃣ DATABASE AGENT INSTRUCTIONS

### 🗄️ AGENT ROLE: Database Architecture & Schema Design
**TOOL**: Claude Code (VS Code Extension)  
**FOCUS**: Multi-tenant PostgreSQL with Prisma ORM  

### IMMEDIATE TASKS:
```bash
# Initialize database setup
cd ./ClubOps-SaaS/backend
npm install prisma @prisma/client
npx prisma init

# Create migration and seed directories
mkdir -p ./database/{migrations,seeds,docs}
```

### DATABASE DELIVERABLES:
1. **Multi-tenant Schema**: Complete Prisma schema with tenant isolation
2. **Migration Scripts**: Database setup and version management  
3. **Seed Data**: Realistic test data for development
4. **Performance Optimization**: Indexes, query optimization
5. **Backup Strategy**: Automated backup and restore procedures

### CORE DATABASE ENTITIES:
```prisma
// Key models to implement
model Club {
  id          String   @id @default(cuid())
  name        String
  subscription SubscriptionTier
  // ... multi-tenant isolation
}

model Dancer {
  id          String   @id @default(cuid())
  name        String
  licenseNumber String
  licenseExpiry DateTime
  status      DancerStatus
  // ... compliance tracking
}

model VIPRoom {
  id          String   @id @default(cuid())
  name        String
  isOccupied  Boolean
  timer       DateTime?
  // ... real-time tracking
}
```

### SUCCESS CRITERIA:
- Complete multi-tenant schema deployed
- Migration system functional
- Performance benchmarks met (< 100ms queries)
- Backup/restore procedures tested

---

## 4️⃣ BACKEND AGENT INSTRUCTIONS

### ⚙️ AGENT ROLE: API Development & Business Logic
**TOOL**: Claude Code (VS Code Extension)  
**FOCUS**: RESTful API, WebSocket real-time, authentication, billing  

### IMMEDIATE TASKS:
```bash
# Initialize backend structure
cd ./ClubOps-SaaS/backend
npm install express cors helmet bcryptjs jsonwebtoken
npm install socket.io rate-limiter-flexible express-validator

# Create route and middleware structure
mkdir -p ./src/{routes,middleware,services,utils}
```

### BACKEND DELIVERABLES:
1. **Authentication System**: JWT-based with role permissions
2. **RESTful APIs**: Full CRUD for all entities with validation
3. **WebSocket Integration**: Real-time updates for DJ queue, VIP rooms
4. **Payment Integration**: Paddle/Stripe subscription management
5. **Compliance Engine**: Automated license checking and alerts

### CRITICAL API ENDPOINTS:
```javascript
// Priority routes to implement
POST /auth/register-club     // Multi-tenant onboarding
POST /auth/login            // JWT authentication
GET  /dancers               // License compliance checking
POST /dj-queue              // Real-time queue management  
PUT  /vip-rooms/:id/timer   // Room timer controls
GET  /compliance/alerts     // Automated warnings
POST /billing/webhook       // Payment processor integration
```

### SUCCESS CRITERIA:
- All API endpoints tested and documented
- Real-time features functional via WebSocket
- Payment integration with test transactions
- Security audit passed (authentication, authorization)

---

## 5️⃣ FRONTEND AGENT INSTRUCTIONS

### ⚛️ AGENT ROLE: React Application Development
**TOOL**: Claude Code (VS Code Extension)  
**FOCUS**: Next.js app, state management, real-time UI, routing  

### IMMEDIATE TASKS:
```bash
# Initialize frontend application
cd ./ClubOps-SaaS/frontend
npx create-next-app@latest . --typescript --tailwind --eslint --app
npm install socket.io-client axios react-hook-form zod
npm install react-beautiful-dnd recharts jwt-decode
```

### FRONTEND DELIVERABLES:
1. **Multi-page Application**: Dashboard, settings, analytics, billing
2. **State Management**: Context API or Zustand for global state
3. **Real-time Integration**: Socket.io client for live updates
4. **Form Management**: React Hook Form with validation
5. **Data Visualization**: Charts for analytics and reporting

### CRITICAL PAGES TO BUILD:
```typescript
// Priority pages and components
/dashboard              // Main club management interface
/dancers               // Check-in, license management
/dj-queue              // Drag-and-drop music queue
/vip-rooms             // Timer management, status
/analytics             // Revenue, usage charts
/settings              // Club configuration
/billing               // Subscription management
```

### SUCCESS CRITERIA:
- Fully functional SPA with navigation
- Real-time updates working across all features
- Mobile-responsive design
- Form validation and error handling
- Performance optimized (< 3s load time)

---

## 6️⃣ TESTING AGENT INSTRUCTIONS

### 🧪 AGENT ROLE: Quality Assurance & Automated Testing
**TOOL**: Claude Code (VS Code Extension)  
**FOCUS**: Unit tests, integration tests, E2E testing, performance  

### IMMEDIATE TASKS:
```bash
# Setup testing frameworks
cd ./ClubOps-SaaS
npm install -D jest supertest @testing-library/react @testing-library/jest-dom
npm install -D cypress or playwright
npm install -D k6 # Performance testing
```

### TESTING DELIVERABLES:
1. **Unit Tests**: 80%+ code coverage for critical functions
2. **Integration Tests**: API endpoint testing with database
3. **E2E Tests**: Critical user journeys automated
4. **Performance Tests**: Load testing for multi-tenant scenarios
5. **Security Tests**: Authentication, authorization, data validation

### CRITICAL TEST SCENARIOS:
```javascript
// Priority test cases
- Multi-tenant data isolation
- Real-time WebSocket functionality  
- Payment flow integration
- License compliance checking
- DJ queue drag-and-drop
- VIP room timer accuracy
- Dashboard load performance
```

### SUCCESS CRITERIA:
- 80%+ test coverage achieved
- All critical paths automated
- Performance benchmarks met
- Security vulnerabilities addressed

---

## 7️⃣ DEVOPS AGENT INSTRUCTIONS

### 🚀 AGENT ROLE: Deployment & Infrastructure
**TOOL**: Claude Code (VS Code Extension)  
**FOCUS**: Vercel deployment, Railway/Supabase setup, CI/CD  

### IMMEDIATE TASKS:
```bash
# Setup deployment configuration
touch ./ClubOps-SaaS/vercel.json
touch ./ClubOps-SaaS/.github/workflows/deploy.yml
touch ./ClubOps-SaaS/docker-compose.yml

# Environment configuration
touch ./ClubOps-SaaS/frontend/.env.local
touch ./ClubOps-SaaS/backend/.env
```

### DEVOPS DELIVERABLES:
1. **Production Deployment**: Vercel frontend + Railway backend
2. **Database Hosting**: PostgreSQL on Railway or Supabase
3. **CI/CD Pipeline**: GitHub Actions for automated deployment
4. **Environment Management**: Dev, staging, production environments
5. **Monitoring Setup**: Error tracking, performance monitoring

### DEPLOYMENT ARCHITECTURE:
```yaml
# Infrastructure setup
Frontend: Vercel (Next.js)
Backend: Railway (Node.js + Express)
Database: Railway PostgreSQL or Supabase
Storage: Vercel Blob or AWS S3
Monitoring: Vercel Analytics + Sentry
```

### SUCCESS CRITERIA:
- Production environment fully deployed
- CI/CD pipeline functional
- SSL certificates configured
- Monitoring and alerting active
- Backup procedures automated

---

## 8️⃣ DOCUMENTATION AGENT INSTRUCTIONS

### 📚 AGENT ROLE: Technical Documentation & User Guides
**TOOL**: Claude Code (VS Code Extension)  
**FOCUS**: API docs, user guides, developer documentation  

### IMMEDIATE TASKS:
```bash
# Create documentation structure
mkdir -p ./ClubOps-SaaS/docs/{api,user-guides,developer,deployment}
touch ./ClubOps-SaaS/README.md
touch ./ClubOps-SaaS/CONTRIBUTING.md
```

### DOCUMENTATION DELIVERABLES:
1. **API Documentation**: Complete OpenAPI/Swagger specs
2. **User Guides**: Step-by-step guides for each user type
3. **Developer Docs**: Setup, architecture, contribution guidelines
4. **Deployment Guide**: Production setup and maintenance
5. **Compliance Guide**: Legal requirements and best practices

### DOCUMENTATION PRIORITIES:
```markdown
# Critical docs to create
- README.md with project overview
- API documentation with examples
- User onboarding guide
- Club manager training manual
- Developer setup guide
- Deployment instructions
- Troubleshooting guide
```

### SUCCESS CRITERIA:
- Complete API documentation generated
- User guides tested with stakeholders
- Developer onboarding under 30 minutes
- Deployment guide validated

---

## ⚡ EXECUTION SEQUENCE

### Phase 2A: Foundation (Agents 3,4,2)
1. **Database Agent** - Complete schema and migrations
2. **Backend Agent** - Build API endpoints and authentication  
3. **Design Agent** - Finalize component library

### Phase 2B: Application (Agents 5,6,1)
4. **Frontend Agent** - Build React application
5. **Testing Agent** - Implement test suites
6. **Research Agent** - Validate features with market research

### Phase 2C: Deployment (Agents 7,8)
7. **DevOps Agent** - Deploy to production
8. **Documentation Agent** - Complete all documentation

---

## 🎯 SUCCESS METRICS & TIMELINE

**Total Estimated Time**: 45 minutes across all agents  
**Target Completion**: End of current session  
**Success Definition**: Deployable MVP with all core features  

### Key Performance Indicators:
- ✅ Multi-tenant SaaS architecture functional
- ✅ Real-time features working (WebSocket)
- ✅ Payment integration completed
- ✅ Mobile-responsive design
- ✅ Production deployment successful
- ✅ 80%+ test coverage achieved

---

**🚀 Ready for Claude Code execution across 8 specialized agents!**
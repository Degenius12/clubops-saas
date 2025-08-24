# TESTING AGENT - ClubOps Quality Assurance + SaaS Testing

## CONTEXT & REQUIREMENTS
Create comprehensive test suite for ClubOps main app features + SaaS functionality.
Ensure all PRD requirements work correctly across subscription tiers.

### Core App Testing (from PRD):
- Dancer check-in flow with license compliance alerts
- DJ queue drag-and-drop functionality + music player
- VIP room status management + timer accuracy
- Financial tracking calculations + bar fee collection
- Offline functionality + data synchronization
- Premium UI responsiveness (dark theme, animations)

### SaaS Testing Requirements:
- Multi-tenant data isolation verification
- Subscription lifecycle testing (signup → upgrade → cancel)
- Payment processing scenarios (success/failure/webhooks)
- Feature access control by subscription tier
- Usage analytics accuracy
- Performance under multi-club load

## TOOL: Claude Code (VS Code Extension)

## TASK: Create complete test infrastructure

### Step 1: Frontend Testing Setup
```bash
cd C:\Users\tonyt\ClubOps-SaaS\frontend
npm install @testing-library/react @testing-library/jest-dom
npm install @testing-library/user-event msw playwright
npm install jest-environment-jsdom
```

### Step 2: Core App Feature Tests
Create test files for main app functionality:

1. **DancerCheckin.test.tsx** - License alerts, compliance blocking
2. **DJQueue.test.tsx** - Drag-and-drop, queue reordering 
3. **MusicPlayer.test.tsx** - Audio format support, playback controls
4. **VIPRooms.test.tsx** - Status updates, timer functionality
5. **FinancialDashboard.test.tsx** - Revenue calculations, reporting
6. **OfflineSync.test.tsx** - Data caching, synchronization

### Step 3: SaaS Feature Tests  
7. **Auth.test.tsx** - Login/logout, JWT handling
8. **Subscriptions.test.tsx** - Tier upgrades, feature gates
9. **Billing.test.tsx** - Payment processing, invoice generation
10. **Analytics.test.tsx** - Usage tracking, data accuracy
11. **MultiTenant.test.tsx** - Data isolation verification

### Step 4: End-to-End Testing
Create Playwright tests for complete user journeys:

- **club-onboarding.spec.ts** - Full signup → setup → first use
- **dancer-management.spec.ts** - Complete dancer lifecycle
- **subscription-upgrade.spec.ts** - Free → Pro tier upgrade
- **offline-mode.spec.ts** - Disconnect → work offline → sync

### Step 5: Performance & Load Testing
- API response time testing (< 200ms for core operations)
- Multi-tenant performance under load
- Memory usage monitoring (offline data caching)
- WebSocket connection stability

## SUCCESS CRITERIA:
- [ ] 90%+ test coverage for core app features
- [ ] All SaaS functionality thoroughly tested
- [ ] Multi-tenant data isolation verified
- [ ] Payment processing scenarios covered
- [ ] End-to-end user journeys working
- [ ] Performance benchmarks met

Save to: `C:\Users\tonyt\ClubOps-SaaS\tests\`
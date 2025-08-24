# FRONTEND AGENT - ClubOps Premium UI + SaaS Dashboard

## CONTEXT & REQUIREMENTS
Build the frontend for ClubOps combining main app functionality with SaaS interface.
Based on Superdesign specs: Dark theme, metallic blue/gold/deep red accents, premium animations.

### Core App Features (from PRD):
- Dancer check-in with license compliance alerts (red blocking alerts)
- DJ queue with drag-and-drop interface + music player
- VIP room real-time status display with timers
- Financial tracking widgets with bar fee collection
- Dancer onboarding portal (application & contract signing)
- Offline functionality with local data caching

### SaaS Features Required:
- User authentication and onboarding flow
- Subscription management dashboard (Free/Basic/Pro/Enterprise)
- Usage analytics and reporting interface
- Payment/billing integration (Stripe)
- Admin panel for club management
- Feature gates based on subscription tiers

## TOOL: Claude Code (VS Code Extension)

## TASK: Create complete React.js frontend

### Step 1: Project Setup
```bash
cd C:\Users\tonyt\ClubOps-SaaS\frontend
npx create-react-app . --template typescript
npm install @tailwindcss/forms @headlessui/react framer-motion
npm install react-router-dom @reduxjs/toolkit react-redux
npm install react-beautiful-dnd react-player stripe
```

### Step 2: Core App Components
Create components matching PRD requirements:

1. **DancerCheckin.tsx** - License compliance with color-coded alerts
2. **DJQueue.tsx** - Drag-and-drop with premium animations  
3. **MusicPlayer.tsx** - Multi-format audio support (MP3/AAC/FLAC/WAV)
4. **VIPRooms.tsx** - Real-time status + timer display
5. **FinancialDashboard.tsx** - Revenue tracking with number tickers
6. **DancerOnboarding.tsx** - Application portal with digital contracts

### Step 3: SaaS Interface Components  
7. **AuthFlow.tsx** - Login/signup with social authentication
8. **SubscriptionDashboard.tsx** - Tier management + upgrade prompts
9. **UsageAnalytics.tsx** - Charts and metrics display
10. **BillingPanel.tsx** - Payment methods + invoice history
11. **AdminDashboard.tsx** - Multi-tenant club management

### Step 4: Premium Styling (Dark Theme)
- Tailwind config with custom colors (metallic blue/gold/deep red)
- Magic UI components integration (neon-gradient-card, animated-beam)
- Smooth animations using Framer Motion
- Responsive design optimized for touch devices

## SUCCESS CRITERIA:
- [ ] All main app features from PRD implemented
- [ ] SaaS dashboard fully functional  
- [ ] Premium dark theme with specified accent colors
- [ ] Responsive design (mobile-first)
- [ ] Offline functionality working
- [ ] Feature gates for subscription tiers

Save to: `C:\Users\tonyt\ClubOps-SaaS\frontend\src\`
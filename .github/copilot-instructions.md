# ClubFlow SaaS - AI Coding Agent Instructions

## Project Overview
ClubFlow is a multi-tenant SaaS platform for gentlemen's club management with enterprise-grade features including dancer management, DJ queue systems, VIP booth tracking, fraud prevention, and real-time analytics.

**Tech Stack**: React 18 + TypeScript + Vite (frontend) | Node.js + Express + Prisma + PostgreSQL (backend) | Vercel deployment

## Architecture Principles

### Multi-Tenant Design
- **Club-scoped data**: All entities belong to a `Club` with `clubId` foreign keys
- **Subdomain isolation**: Each club has unique subdomain routing
- **Shared database**: Single PostgreSQL instance with row-level isolation
- **Reference**: `backend/prisma/schema.prisma` - Club model and relations

### Role-Based Access Control
**Hierarchy**: Owner > Super Manager > Manager > Door Staff > VIP Host > DJ > Bartender
- **JWT authentication** with role claims
- **API middleware** validates permissions per endpoint
- **UI components** conditionally render based on user role
- **Reference**: `backend/middleware/auth.js`, `frontend/src/contexts/AuthContext.tsx`

### Active Shift Management
- **One active shift per club** at any time (enforced in database and UI)
- **Shift levels**: 1, 2, 3, 4+ with configurable names
- **EOS reports**: End-of-shift financial reconciliation with discrepancy tracking
- **Reference**: `backend/routes/shift-management.js`, `frontend/src/components/shift/ShiftControl.tsx`

## Critical Development Workflows

### Session Handoff Protocol
**Before ending any coding session**:
1. Update `claude-progress.txt` with completed work and next priorities
2. Update `feature_list.json` - ONLY change `"passes": false` to `"passes": true`
3. Commit with descriptive message
4. Ensure dev servers restart cleanly

### Database Schema Changes
```bash
# After modifying backend/prisma/schema.prisma
npx prisma db push    # Push schema to database
npx prisma generate   # Regenerate Prisma client
```

### Development Environment
```bash
npm run dev              # Start both frontend (port 3000) and backend (port 8000)
npm run dev:frontend     # Frontend only
npm run dev:backend      # Backend only
```

### Testing Requirements
- **UI-first testing**: All features must pass end-to-end UI tests with Puppeteer
- **Browser validation**: Check console for errors, test mobile responsiveness
- **Happy + error paths**: Test both successful flows and failure scenarios
- **Reference**: `comprehensive-test-suite.js`, `test-*.js` files

## Code Patterns & Conventions

### Component Structure
```tsx
// 1. Props interface first
interface ComponentNameProps {
  requiredProp: string;
  optionalProp?: number;
}

// 2. Component with explicit return type
export function ComponentName({ requiredProp, optionalProp }: ComponentNameProps): JSX.Element {
  // 3. Hooks second
  const [state, setState] = useState(initialValue);
  const dispatch = useDispatch<AppDispatch>();

  // 4. Handlers third
  const handleAction = async () => {
    try {
      // Implementation
    } catch (error) {
      console.error('Error:', error);
    }
  };

  // 5. Render last
  return (
    // JSX
  );
}
```

### API Route Pattern
```javascript
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    // Input validation...

    // Business logic...

    return NextResponse.json({ data: result });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

### File Naming Conventions
- **Components**: `PascalCase.tsx` (e.g., `DancerManagement.tsx`)
- **Utilities**: `camelCase.ts` (e.g., `formatCurrency.ts`)
- **API routes**: `kebab-case` (e.g., `/api/dancer-check-in`)
- **Database models**: Prisma PascalCase with `@map("snake_case")`

### State Management
- **Redux Toolkit** for global state
- **Club-scoped data**: All API calls include `clubId` from user context
- **Real-time updates**: Socket.io integration for live features
- **Reference**: `frontend/src/store/`, `frontend/src/services/api.ts`

## Key Integration Points

### Authentication Flow
- **JWT tokens** stored in localStorage
- **Auto-refresh** on token expiry
- **Role-based routing** guards
- **Reference**: `frontend/src/contexts/AuthContext.tsx`, `backend/middleware/auth.js`

### Database Relations
- **Club → Users**: One club, many users (role-based)
- **Club → Dancers**: One club, many dancers (with check-in tracking)
- **Club → VIP Sessions**: Fraud detection with anomaly reporting
- **Club → Shifts**: One active shift enforcement
- **Reference**: `backend/prisma/schema.prisma` relationship definitions

### Real-Time Features
- **DJ Queue**: Live drag-and-drop with Socket.io
- **VIP Sessions**: Real-time spend tracking and alerts
- **Shift Management**: Live status updates across clients
- **Reference**: `frontend/src/services/socket.ts`, `backend/src/server.js`

## Fraud Prevention System

### VIP Session Monitoring
- **Automatic anomaly detection**: Song count variance analysis
- **Verification alerts**: Manager review workflow for discrepancies
- **Audit logging**: All financial transactions tracked
- **Reference**: `backend/models/verificationAlert.js`, `frontend/src/components/vip/VipSessionVerification.tsx`

### Data Integrity Checks
- **Check-in/out validation**: Prevents double-checkins
- **Financial reconciliation**: EOS reports with discrepancy flagging
- **License compliance**: Automatic expiry alerts
- **Reference**: `backend/routes/fraud-prevention.js`

## Deployment & Environment

### Vercel Configuration
- **Automatic deployments** on push to main branch
- **Environment variables** configured per deployment
- **Serverless functions** in `/backend/api/`
- **Reference**: `vercel.json`, `.env.example`

### Environment Variables Required
```env
# Backend
DATABASE_URL=postgresql://...
JWT_SECRET=...
FRONTEND_URL=https://...

# Frontend
VITE_API_URL=https://...
VITE_APP_NAME=ClubFlow
```

## Common Pitfalls to Avoid

1. **Multi-tenant violations**: Always scope queries by `clubId`
2. **Role confusion**: Test all features with different user roles
3. **Shift conflicts**: Only one active shift per club allowed
4. **Real-time sync**: Use Socket.io for live updates, not polling
5. **UI testing**: Never skip Puppeteer end-to-end validation
6. **Session handoff**: Always update progress tracking files

## Essential Files for Understanding
- `backend/prisma/schema.prisma` - Complete data model
- `frontend/src/store/slices/` - Redux state structure
- `backend/routes/` - API endpoint organization
- `frontend/src/components/dashboard/` - Main UI architecture
- `feature_list.json` - Complete feature inventory
- `CLAUDE.md` - Development conventions and patterns</content>
<parameter name="filePath">c:\Users\tonyt\clubflow\.github\copilot-instructions.md
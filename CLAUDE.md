# ClubFlow Development Guide

## Project Overview
ClubFlow (formerly ClubOps) is a comprehensive SaaS platform for gentlemen's club management.

**Domain**: clubflowapp.com
**Repository**: [GitHub repo URL]
**Deployment**: Vercel

## Tech Stack
- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API routes, Prisma ORM
- **Database**: PostgreSQL (Vercel Postgres or Supabase)
- **Auth**: NextAuth.js
- **Deployment**: Vercel

## Development Commands
```bash
npm run dev          # Start dev server (port 3000)
npm run build        # Production build
npm run lint         # Run ESLint
npx prisma studio    # Open database GUI
npx prisma db push   # Push schema changes
npx prisma generate  # Generate Prisma client
```

## Environment Variables Required
```
DATABASE_URL=
NEXTAUTH_SECRET=
NEXTAUTH_URL=http://localhost:3000
```

## Key Modules

### Authentication
- Role-based: Owner > Manager > DJ > Dancer
- Session-based with NextAuth
- `/api/auth/*` routes

### Entertainer Management
- CRUD operations for entertainers
- Check-in/check-out tracking
- Performance history

### DJ Queue System
- Real-time queue management
- Multi-stage support
- Drag-and-drop reordering

### VIP Booth Tracking
- Reservations with minimums
- Real-time spend tracking
- Automated alerts

### Fraud Prevention
- Pattern detection algorithms
- Tip-out discrepancy tracking
- Audit logging

### Revenue Dashboard
- Real-time revenue tracking
- Historical analytics
- Export capabilities

## Code Conventions

### File Naming
- Components: PascalCase (`DancerCard.tsx`)
- Utilities: camelCase (`formatCurrency.ts`)
- API routes: kebab-case (`/api/entertainer-check-in`)

### Component Structure
```tsx
// Props interface first
interface DancerCardProps {
  entertainer: Dancer;
  onCheckIn: () => void;
}

// Component with explicit return type
export function DancerCard({ entertainer, onCheckIn }: DancerCardProps): JSX.Element {
  // Hooks first
  const [isLoading, setIsLoading] = useState(false);
  
  // Handlers
  const handleCheckIn = async () => {
    // ...
  };
  
  // Render
  return (
    // ...
  );
}
```

### API Route Pattern
```typescript
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();
    // Validate input...
    // Perform operation...
    
    return NextResponse.json({ data });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

## Testing Requirements

1. **All features must be tested through the UI**
2. Use Puppeteer for automated browser testing
3. Check both happy path and error cases
4. Verify mobile responsiveness
5. Check browser console for errors

## Session Handoff Protocol

Before ending a coding session:

1. Update `claude-progress.txt` with:
   - What was completed
   - What's next priority
   - Any blockers or issues

2. Update `feature_list.json`:
   - ONLY change `"passes": false` to `"passes": true`
   - NEVER delete or modify feature descriptions

3. Commit all changes with descriptive message

4. Ensure dev server can restart cleanly

## Known Issues / Tech Debt

[Document any known issues here]

## Resources

- Notion tracker: [link]
- Design system: [link]
- API documentation: [link]

---

@~/.claude/rules/typescript.md
@./feature_list.json

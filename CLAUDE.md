# ClubFlow Development Guide

## Project
ClubFlow — SaaS platform for gentlemen's club management.
- **Domain**: clubflowapp.com
- **Deployment**: Vercel

## Tech Stack
- **Frontend**: React 18 + Vite (SPA), TypeScript, Tailwind CSS, Redux Toolkit
- **Backend**: Express.js, Prisma ORM, Socket.io (real-time)
- **Database**: PostgreSQL (Vercel Postgres / Supabase)
- **Auth**: JWT (roles: Owner > Manager > DJ > Dancer)
- **PWA**: manifest.json, service worker, push notifications, offline support

## Key Modules
- **Entertainer Management** — CRUD, check-in/out, performance history
- **DJ Queue** — real-time queue, multi-stage, drag-and-drop
- **VIP Booth Tracking** — reservations, spend tracking, alerts
- **Fraud Prevention** — pattern detection, tip-out discrepancy, audit logs
- **Revenue Dashboard** — real-time tracking, analytics, export

## Commands
```bash
npm run dev          # Frontend (Vite) + Backend (Express) concurrently
npm run build        # Production build (tsc + vite build)
npm run lint         # ESLint
npx prisma studio    # Database GUI
npx prisma db push   # Push schema changes
npx prisma generate  # Generate Prisma client
```

## Env Vars
```
DATABASE_URL=
NEXTAUTH_SECRET=
NEXTAUTH_URL=http://localhost:3000
```

## Session Tracking
- `claude-progress.txt` — what's done, what's next, blockers
- `feature_list.json` — feature checklist (flip `passes` to `true`, never delete)
- `.claude/STATUS.md` — project state, session log, completed phases
- `.claude/session-state.json` — file checksums + protection levels

## Reference Docs (read on-demand)
- `docs/typescript-standards.md` — type safety, naming, imports, patterns
- `docs/session-tracking-guide.md` — handoff protocol, STATUS.md templates, protection system
- `docs/BERG_INTEGRATION_TECHNICAL_SPEC.md` — Berg POS integration spec
- `docs/CLUB_ONBOARDING.md` — club onboarding flow
- `docs/SECURITY_DASHBOARD_GUIDE.md` — security dashboard reference

## Rules (auto-loaded)
- `.claude/rules/code-protection.md` — read before edit, protect recent code
- `.claude/rules/session-tracking.md` — update tracking files after changes

## Workflow
Artifacts: `docs/workflow/` | Start: `/workflow` to assess scope and route.

## Status
See `.claude/STATUS.md` and `claude-progress.txt` for current state.

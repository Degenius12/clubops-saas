# ClubOps Comprehensive Testing - Execute Now

## Context
ClubOps is a SaaS platform for gentlemen's club management. It's ~95% complete and needs comprehensive testing before investor demos.

## Your Task
Execute the test plan at: `C:\Users\tonyt\ClubOps-SaaS\test-plan\CLUBOPS_TEST_PLAN.md`

## Production URLs
- **Frontend**: https://clubops-saas-platform.vercel.app
- **Backend**: https://clubops-backend.vercel.app

## Test Credentials
- Email: admin@clubops.com
- Password: admin123

## Critical Instructions

### 1. Read the test plan first
```
Use Desktop Commander to read: C:\Users\tonyt\ClubOps-SaaS\test-plan\CLUBOPS_TEST_PLAN.md
```

### 2. Execute in phases with MANDATORY checkpoints
- Complete Phase 1 → Save results → Summarize → Wait for my "continue"
- Complete Phase 2 → Save results → Summarize → Wait for my "continue"
- (repeat for all 7 phases)

### 3. Save ALL results to files immediately
Save each phase's results to:
```
C:\Users\tonyt\ClubOps-SaaS\test-results\phase1-environment.md
C:\Users\tonyt\ClubOps-SaaS\test-results\phase2-api-tests.md
C:\Users\tonyt\ClubOps-SaaS\test-results\phase3-ui-tests.md
C:\Users\tonyt\ClubOps-SaaS\test-results\phase4-integration.md
C:\Users\tonyt\ClubOps-SaaS\test-results\phase5-e2e-flows.md
C:\Users\tonyt\ClubOps-SaaS\test-results\phase6-edge-cases.md
C:\Users\tonyt\ClubOps-SaaS\test-results\MASTER-REPORT.md
```

### 4. Prevent context overflow
- Use Playwright `browser_snapshot` sparingly (token-heavy)
- Prefer targeted element checks over full page snapshots
- Keep summaries concise
- If approaching limits, save progress and alert me

## Known Issues to Specifically Test
1. JavaScript errors on Dancers page
2. "Dancers paying bar fees" functionality
3. CORS configuration
4. Authentication token persistence

## Tools to Use
- **Playwright**: browser_navigate, browser_snapshot, browser_click, browser_type, browser_fill_form
- **Desktop Commander**: write_file (for saving results), read_file (for test plan)
- **Web tools**: web_fetch for API endpoint testing

## Start Now
1. Create the test-results directory
2. Read the test plan
3. Execute Phase 1: Environment Verification
4. Save results
5. Give me a summary and wait for "continue"

Begin!

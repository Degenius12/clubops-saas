# Browser Testing Skill

## Purpose
Verify features work correctly through actual browser interaction, not just code inspection.

## Tools
- Puppeteer MCP (preferred)
- Manual browser testing
- Console error checking

## Testing Workflow

### 1. Start with Smoke Test
Before any feature testing, verify the app loads:
```
1. Navigate to homepage
2. Check for console errors
3. Verify page renders without crash
4. Check network tab for failed requests
```

### 2. Feature Testing Pattern
For each feature in `feature_list.json`:
```
1. Read the test steps from the feature
2. Execute each step in the browser
3. Verify expected outcomes
4. Check console for errors
5. Document pass/fail with evidence
```

### 3. Test on Multiple Viewports
```
Desktop: 1920x1080
Tablet: 768x1024
Mobile: 375x667
```

### 4. Common Checks

#### Authentication Tests
- Login with valid credentials → redirects to dashboard
- Login with invalid credentials → shows error message
- Session expires → redirects to login
- Protected routes require auth

#### Form Tests
- Submit with valid data → success feedback
- Submit with invalid data → validation errors
- Submit with empty required fields → shows required
- Form state persists during navigation (if expected)

#### Data Display Tests
- Data loads and displays correctly
- Empty state shows appropriate message
- Loading state appears during fetch
- Error state shows when API fails

#### Navigation Tests
- All links work correctly
- Back button behaves as expected
- Deep links work directly

### 5. Error Detection

#### Console Errors
Watch for:
- React hydration errors
- Unhandled promise rejections
- 404 for resources
- CORS errors
- TypeScript runtime errors

#### Network Errors
Check Network tab for:
- Failed API calls (4xx, 5xx)
- Slow responses (>3 seconds)
- Missing resources

### 6. Documentation Format

```markdown
## Test Report: Feature #[id]

**Feature**: [description]
**Date**: [timestamp]
**Tester**: [agent name]

### Test Steps
| Step | Action | Expected | Actual | Status |
|------|--------|----------|--------|--------|
| 1    | [action] | [expected] | [what happened] | ✅/❌ |

### Console Errors
- [list any errors or "None"]

### Screenshots
- [if captured]

### Notes
- [any observations]

### Result: ✅ PASS / ❌ FAIL / ⚠️ PARTIAL
```

## Puppeteer MCP Commands

### Navigation
```javascript
await page.goto('http://localhost:3000/login');
await page.waitForSelector('.dashboard');
```

### Interactions
```javascript
await page.click('button[type="submit"]');
await page.type('input[name="email"]', 'test@example.com');
await page.select('select#role', 'manager');
```

### Assertions
```javascript
const text = await page.textContent('.success-message');
expect(text).toContain('Success');

const isVisible = await page.isVisible('.error-alert');
```

### Screenshots
```javascript
await page.screenshot({ path: 'test-result.png' });
```

## Mobile Testing

### Viewport Simulation
```javascript
await page.setViewportSize({ width: 375, height: 667 });
```

### Touch Events
```javascript
await page.tap('.mobile-menu-button');
```

## Performance Checks

### Load Time
- First Contentful Paint < 2s
- Time to Interactive < 4s
- Largest Contentful Paint < 3s

### Memory Leaks
- Monitor memory in dev tools during extended use
- Check for growing memory after navigation

## Accessibility Quick Checks

1. Tab navigation works logically
2. Focus indicators are visible
3. Images have alt text
4. Color contrast is sufficient
5. Screen reader announces content

---

**Remember**: A feature only passes when it works in the browser, not when the code looks correct.

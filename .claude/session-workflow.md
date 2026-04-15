# Claude Code + Notion Session Workflow

## Session Start Protocol

### 1. You share current status from Notion (quick copy/paste):
```
PROJECT: ClubFlow
CURRENT TASKS:
- [ ] Task 1 name
- [ ] Task 2 name
- [x] Completed task name

NOTES:
Any important context or blockers
```

### 2. I acknowledge and we start working

---

## During Session

I'll track:
- ✅ Tasks completed
- 🔄 Tasks in progress
- 📝 New tasks discovered
- 🐛 Issues/blockers encountered
- 💡 Decisions made
- 📚 Documentation updates

---

## Session End Protocol

### I generate this update for you to paste into Notion:

```markdown
## Session: [Date] - [Project Name]

### ✅ Completed
- Task name 1
- Task name 2

### 🔄 In Progress
- Task name 3 (50% done - next: specific action)

### 📝 New Tasks Identified
- [ ] New task 1
- [ ] New task 2

### 💡 Key Decisions
- Decision 1: explanation
- Decision 2: explanation

### 📚 Files Changed
- `path/to/file1.ts` - what changed
- `path/to/file2.tsx` - what changed

### 🎯 Next Session Priority
1. Most important thing to do next
2. Second priority
3. Third priority

### 🐛 Blockers/Issues
- Issue 1 (if any)

### 📊 Progress
- Feature X: 75% complete
- Feature Y: Started

---
**Total time**: ~X hours
**Commits**: [link to commits if pushed]
```

---

## Quick Start Example

### You paste at start:
```
PROJECT: ClubFlow
CURRENT TASKS:
- [ ] Add push notification browser testing
- [ ] Fix shift scheduling calendar view
- [x] Backup system completed

NOTES:
Push notifications need testing in actual browser, not just backend
```

### I respond:
```
Got it! Current focus:
1. ✅ Backup system is done
2. 🎯 Push notification browser testing (priority)
3. 🎯 Shift scheduling calendar view

Let's start with push notification testing. I'll verify the browser
integration and create test cases.
```

### At end, I generate:
```markdown
## Session: 2025-12-31 - ClubFlow

### ✅ Completed
- Push notification browser testing (feature #34 now passing)
- Created comprehensive test suite with HTML test page

### 📝 New Tasks Identified
- [ ] Add service worker offline support
- [ ] Create notification permission UI flow

### 💡 Key Decisions
- Used web-push library for VAPID key generation
- Stored subscription in browser localStorage for demo

### 📚 Files Changed
- `test-push-notifications-browser.html` - New browser test page
- `backend/routes/push-notifications.js` - Added subscription endpoint

### 🎯 Next Session Priority
1. Shift scheduling calendar view
2. Service worker for offline notifications
3. Deploy push notification feature to staging

### 📊 Progress
- Push Notifications: 90% complete (just needs UI polish)
- Shift Scheduling: 60% complete (backend done, UI in progress)
```

---

## Tips for Notion Integration

### In Your Notion Tasks Database:
1. Mark completed tasks as "Done"
2. Copy new tasks from "New Tasks Identified" section
3. Update task notes with any context from "Key Decisions"

### In Your Notion Session Log:
1. Create new entry with the date
2. Paste the entire session summary
3. Link to the project

### For Daily TickTick Planning:
Use the "🎯 Next Session Priority" section to pull top 3-5 items into TickTick for tomorrow

---

## Session Start Shortcuts

**Minimal version** (if in a hurry):
```
PROJECT: ClubFlow
TODO: Fix X, Build Y
LAST SESSION: Completed Z
```

**With context** (preferred):
```
PROJECT: ClubFlow
WORKING ON: Feature name
CURRENT TASKS:
- [ ] Specific task 1
- [ ] Specific task 2

CONTEXT: Any important info I should know
```

---

## Future Automation Ideas

Once MCP Notion integration is working:
- Auto-read tasks from Notion at session start
- Auto-update task status as we work
- Auto-log session summary to Notion
- Generate daily report for TickTick automatically

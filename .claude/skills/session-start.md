# Session Start - ClubFlow Continuity Check

## Purpose
Automatically run at the start of every session to prevent duplicate work and ensure session continuity.

## When to Use
- **Auto-trigger**: This skill should run AUTOMATICALLY at the start of every new session
- **Manual trigger**: User can type `/session-start` to run manually

## Instructions

When this skill is invoked, follow these steps **before doing any work**:

### Step 1: Read Project Status
```
Read .claude/STATUS.md
Read .claude/session-state.json
```

### Step 2: Analyze User Request
Compare the user's request against:
1. **Completed Features** section in STATUS.md
2. **Recent Sessions** section to see if similar work was just done
3. **Git Safety Window** to check if related files were recently modified
4. **Protected Paths** and **Checksums** to see if files are locked

### Step 3: Check for Duplicate Work
Ask yourself:
- Has this feature already been implemented?
- Were these files modified in the last 3 commits?
- Is there a protection lock on the files I need to modify?
- Did a recent session already do this work?

### Step 4: Alert User if Duplicate Detected
If you find ANY evidence that the requested work is already done:

**STOP immediately and tell the user:**

```
⚠️ **Session Continuity Alert**

I found evidence this work may already be complete:

[Explain what you found - reference specific sections of STATUS.md]

Evidence:
- [List specific evidence: completed feature #, recent commit, locked file, etc.]

Would you like me to:
1. Verify the existing implementation is working
2. Proceed anyway (if you're sure it needs to be redone)
3. Do something different

Please confirm before I proceed.
```

### Step 5: If Clear to Proceed
If no duplicates found:
- Note the session number from session-state.json
- Increment it for this session
- Proceed with the user's request
- Remember to update STATUS.md at session end

## Example Scenarios

### ✅ Good - Prevent Duplicate
```
User: "Implement shift management system"

ACTION: Read STATUS.md → Find Phase 6 shows Features #21-23 complete
        Read session #47 notes → Shift management implemented Jan 1-2
        Check git → Files exist with recent commits

RESPONSE: "⚠️ Shift management is already complete (Features #21-23, Session #47, Jan 1-2, 2026).
          Files: backend/routes/scheduled-shifts.js (locked until 2026-01-09)
          Would you like me to verify it's working or enhance it?"
```

### ✅ Good - Clear to Proceed
```
User: "Add Berg liquor control integration"

ACTION: Read STATUS.md → Feature #48 (POS integration) shows "passes": false
        No protected files related to Berg
        No recent sessions on this topic

RESPONSE: Proceed with Berg integration implementation
```

### ❌ Bad - Didn't Check
```
User: "Implement shift management"

ACTION: Immediately start coding without checking STATUS.md

RESULT: Duplicate work, wasted time, user frustration
```

## Success Criteria
- ✅ Prevented at least one duplicate work attempt
- ✅ User is aware of what's already complete
- ✅ Protected files are not accidentally modified
- ✅ Session continuity is maintained

## Notes
- This skill is **CRITICAL** for preventing wasted work
- Always run BEFORE starting any coding work
- Better to be cautious and ask than to redo work
- Reference specific line numbers/commits as evidence

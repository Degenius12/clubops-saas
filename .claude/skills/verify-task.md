# Verify Task - Check if Work Already Complete

## Purpose
Verify if a specific task/feature is already implemented before starting work.

## When to Use
- Before implementing any feature
- When user requests work that sounds familiar
- When modifying files that might be protected
- User can trigger with `/verify-task <feature description>`

## Instructions

### Step 1: Identify What to Verify
Extract from user request:
- Feature name/number (e.g., "Feature #21")
- File paths mentioned
- Functionality described

### Step 2: Check Multiple Sources

#### A. Check feature_list.json
```bash
Read feature_list.json
Search for feature by ID or description
Check "passes" field (true = complete, false = pending)
```

#### B. Check STATUS.md
```
Read .claude/STATUS.md
Search "Completed Features" section
Look for matching feature numbers or descriptions
Check protection dates and lock reasons
```

#### C. Check Git History
```bash
git log --oneline --all --grep="<feature keyword>" | head -10
git log --oneline --since="2 weeks ago" | head -20
```

#### D. Check File Existence
```bash
# If feature involves specific files, check if they exist
ls -la backend/routes/<related-file>.js
ls -la frontend/src/components/<related-component>/
```

#### E. Check Checksums
```
Read .claude/session-state.json
Look in "checksums" section for related files
If file has checksum = it exists and is protected
Check lockedUntil date
```

### Step 3: Compile Evidence

Create a verification report:

```markdown
## Verification Report: <Feature Name>

### Status: [✅ COMPLETE | ⏳ PARTIAL | ❌ NOT STARTED]

### Evidence Found:
1. **feature_list.json**: Feature #X shows "passes": true/false
2. **STATUS.md**: Listed in "Phase Y: <Name>" (line XXX)
   - Protection level: CRITICAL/HIGH
   - Locked until: YYYY-MM-DD
3. **Git History**:
   - Commit: `abc123 - feat: implement feature X`
   - Date: YYYY-MM-DD
4. **Files**:
   - `path/to/file.js` - EXISTS (SHA256: xxx, locked)
   - `path/to/component.tsx` - EXISTS
5. **Session History**: Session #XX implemented this (YYYY-MM-DD)

### Recommendation:
[STOP - Already complete | PROCEED - Not implemented | VERIFY - Needs testing]

### Next Steps:
[Specific actions based on status]
```

### Step 4: Present Findings to User

**If COMPLETE:**
```
✅ **Task Verification: ALREADY COMPLETE**

Feature X is fully implemented and protected.

Evidence:
- feature_list.json: Feature #X "passes": true
- Git: Committed abc123 on YYYY-MM-DD
- Files: Protected until YYYY-MM-DD

Would you like me to:
1. Test the existing implementation
2. Enhance it with new functionality
3. Fix a bug in the existing code
```

**If NOT STARTED:**
```
✅ **Task Verification: CLEAR TO PROCEED**

Feature X has not been implemented.

Evidence:
- feature_list.json: Feature #X "passes": false
- No related files found
- No matching git commits

Ready to implement!
```

**If PARTIAL:**
```
⚠️ **Task Verification: PARTIALLY COMPLETE**

Some work exists but feature is incomplete.

Evidence:
- Backend exists but frontend pending
- Files created but tests failing
- Feature marked incomplete in feature_list.json

Recommend completing the existing work rather than starting over.
```

## Example Usage

### Example 1: Feature Already Complete
```
User: "Implement shift scheduling"

Verification Process:
1. feature_list.json → Feature #21 "passes": true
2. STATUS.md → Phase 6: Shift Management (100% Complete)
3. Git → Commit 66a84f8 "feat(shift-management): Add POS-style shift management system"
4. Files → backend/routes/scheduled-shifts.js (24KB, locked until 2026-01-09)

Report: ✅ COMPLETE - Stop immediately, show evidence to user
```

### Example 2: Feature Not Started
```
User: "Add Berg liquor control integration"

Verification Process:
1. feature_list.json → Feature #48 "passes": false
2. STATUS.md → Listed as "Pending Task"
3. Git → No commits matching "berg" or "liquor"
4. Files → No berg-integration files found

Report: ✅ CLEAR TO PROCEED - New feature, safe to implement
```

### Example 3: Partial Implementation
```
User: "Finish push notifications"

Verification Process:
1. feature_list.json → Feature #34 "passes": false
2. STATUS.md → Backend complete, frontend pending
3. Git → Backend files committed, frontend not
4. Files → backend/routes/push-notifications.js exists

Report: ⚠️ PARTIAL - Complete the remaining frontend work
```

## Integration with session-start

This skill is more focused than session-start:
- **session-start**: Broad check at session beginning
- **verify-task**: Deep dive into specific feature/task

Both should be used together for maximum protection.

## Success Criteria
- ✅ Accurate identification of implementation status
- ✅ Specific file/commit evidence provided
- ✅ Clear recommendation (STOP/PROCEED/VERIFY)
- ✅ User makes informed decision

## Notes
- Always check ALL sources (feature_list, STATUS, git, files)
- Provide specific evidence with line numbers/commit hashes
- Better to over-verify than to duplicate work
- Update STATUS.md if you find discrepancies

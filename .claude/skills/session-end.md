# Session End - Update Project Status

## Purpose
Automatically run at the end of every session to update STATUS.md and session-state.json with completed work.

## When to Use
- **Auto-trigger**: Should run AUTOMATICALLY at session end
- **Manual trigger**: User can type `/session-end` before ending session
- After completing any significant work
- Before user says "goodbye" or closes session

## Instructions

### Step 1: Gather Session Information

Collect the following data:

```bash
# 1. What was done this session?
- Files modified (use git status)
- Features completed
- Bugs fixed
- New files created

# 2. Git commits made
git log --oneline -n 3

# 3. Current state
- Any pending work?
- Any blockers encountered?
- What's next priority?
```

### Step 2: Update session-state.json

Add new session entry:

```json
{
  "sessionId": "49",
  "startTime": "2026-01-09T23:00:00Z",
  "endTime": "2026-01-10T02:30:00Z",
  "objective": "<Brief description of session goal>",
  "filesModified": [
    "<list of all files changed>"
  ],
  "commitsCreated": ["<commit hashes>"],
  "outcome": "<Success/Partial/Blocked> - <brief summary>"
}
```

#### Calculate New Checksums for Modified Files

For any file you modified:
```bash
cd <directory>
sha256sum <filename>
```

Add/update in session-state.json checksums section:
```json
"path/to/file.js": {
  "sha256": "<calculated hash>",
  "size": <file size in bytes>,
  "lastModified": "2026-01-10T00:00:00Z",
  "lockedUntil": "2026-01-17T00:00:00Z",
  "lockReason": "<what was implemented>",
  "protectionLevel": "high"
}
```

**Protection Period Guidelines:**
- **critical**: 30 days (major features, core infrastructure)
- **high**: 7 days (significant features, new routes)
- **medium**: 3 days (minor changes, bug fixes)

### Step 3: Update STATUS.md

#### A. Update Header Information
```markdown
**Last Updated:** <current date>
**Session Number:** <increment by 1>
**Current Phase:** <current work focus>
**Completion:** <recalculate percentage>
```

#### B. Add to "Recent Sessions" Section

Add new session at the top (keep last 5):

```markdown
### Session #XX: <Title>
**Date:** <session date>
**Duration:** <hours/minutes>
**Objective:** <what was the goal>

**Outcome:** ✅ Complete Success / ⏳ Partial / ❌ Blocked
- <bullet point of what was accomplished>
- <files created/modified>
- <features completed>

**Files Modified:** X files
**Files Created:** Y new files
**Commits:** <commit hashes>

**Evidence:** <reference to documentation/commits>
```

#### C. Update "Completed Features" Section

If features were completed:

```markdown
### Phase X: <Feature Name> (100% Complete) ⭐
**Completed:** <Date>
**Session:** #XX
**Status:** RECENTLY COMPLETED - Protected until YYYY-MM-DD

**Features:**
- ✅ #XX: <feature description>

**Backend Implementation:**
- `path/to/file.js` - <description>

**Frontend Implementation:**
- `path/to/component.tsx` - <description>

**Critical Files (Protected until YYYY-MM-DD):**
- <list files with paths>

**Commits:**
- `abc123 - <commit message>`

**Protection Level:** CRITICAL/HIGH
**Evidence:** <documentation file or git commits>
```

#### D. Update "Pending Tasks" Section

Remove completed tasks, add any new ones discovered:

```markdown
### Remaining Product Features (X features)

#### 1. Feature #XX: <Name>
**Priority:** High/Medium/Low
**Status:** Pending/In Progress
**Estimated Effort:** X days
```

#### E. Update File Checksums Section

Update with any new checksums calculated:

```markdown
### Critical Backend Routes
- `path/to/file.js`: abc123...def (updated YYYY-MM-DD)
```

### Step 4: Validate Updates

Check that STATUS.md is consistent:
- [ ] Session number incremented
- [ ] "Recent Sessions" has new entry
- [ ] Completed features marked with ✅
- [ ] Protected files have lock dates
- [ ] Pending tasks reflect current state
- [ ] File checksums match session-state.json

### Step 5: Create Summary for User

Present completion summary:

```markdown
## Session Complete! 🎉

### Session #XX Summary

**Completed:**
- ✅ <Major accomplishment 1>
- ✅ <Major accomplishment 2>
- ✅ <Feature XX implemented>

**Files Modified:** X files
**New Files:** Y files
**Commits:** Z commits

**Protected Until:** YYYY-MM-DD
- <list of locked files>

**Next Session Priority:**
1. <Top priority task>
2. <Second priority>

**Status Updated:**
- ✅ .claude/STATUS.md
- ✅ .claude/session-state.json
- ✅ feature_list.json (if applicable)

Everything is documented for perfect handoff! 📝
```

## Example Session End

```markdown
User: "Great work! Let's call it a day."

ACTION: Run session-end skill

STEPS:
1. Gather info:
   - Modified: backend/routes/berg-integration.js (NEW)
   - Modified: backend/services/bergIntegrationService.js (NEW)
   - Modified: backend/prisma/schema.prisma
   - Commits: abc123 "feat(berg): Add Berg integration foundation"

2. Calculate checksums:
   - berg-integration.js: sha256sum = xyz789...
   - bergIntegrationService.js: sha256sum = def456...

3. Update session-state.json:
   - Add Session #49 entry
   - Add checksums for 2 new files
   - Lock until 2026-01-17

4. Update STATUS.md:
   - Session #49 added to Recent Sessions
   - Update completion % (if feature finished)
   - Add Berg integration files to protected list

5. Present summary to user

OUTPUT: "## Session Complete! 🎉
Session #49: Berg Integration Foundation
✅ Created Berg data sync endpoint
✅ Created Berg parser service
✅ Updated database schema
Protected until 2026-01-17"
```

## Integration with Git Commits

**If commits were made:**
- Extract commit messages for documentation
- Reference commit hashes in STATUS.md
- Update Git Safety Window with latest 3 commits

**If NO commits:**
- Note that work is uncommitted
- Remind user to commit (if appropriate)
- Still document work in STATUS.md

## Automation Notes

This skill should ideally run automatically when:
- User says "bye", "goodbye", "done", "finished"
- Session is about to end
- User explicitly calls `/session-end`

It ensures:
- Nothing is lost between sessions
- Future sessions have perfect context
- No duplicate work ever happens

## Success Criteria
- ✅ STATUS.md accurately reflects session work
- ✅ session-state.json has new session entry
- ✅ New/modified files have checksums and locks
- ✅ Git Safety Window is updated
- ✅ User has clear summary of what was done

## Notes
- ALWAYS run before session ends
- Better to over-document than under-document
- Future Claude instances depend on this accuracy
- This is the "handoff document" for session continuity

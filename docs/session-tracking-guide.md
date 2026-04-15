# ClubFlow — Session Tracking Guide

## Files

| File | Purpose |
|------|---------|
| `.claude/STATUS.md` | Current project state, completed phases, pending tasks |
| `.claude/session-state.json` | File checksums, protection levels, session log |
| `claude-progress.txt` | What was completed, what's next, blockers |
| `feature_list.json` | Feature checklist — flip `passes: false` → `true` |

## Session End Handoff

Before ending a session, update:

1. **claude-progress.txt** — what was completed, what's next, any blockers
2. **feature_list.json** — ONLY change `"passes": false` to `"passes": true` (never delete features)
3. **.claude/STATUS.md** — add session summary with date, objective, outcome, files changed
4. Commit all changes

## STATUS.md Session Entry Template

```markdown
### Session #XX: <Title>
**Date:** <date>
**Objective:** <goal>
**Outcome:** Complete / Partial / Blocked
- <bullet list of what was done>
**Files:** <count modified/created>
**Commits:** <hashes>
```

## File Protection System

Files are protected based on recency:

| Level | Duration | Examples |
|-------|----------|---------|
| CRITICAL | 30 days | Core infra, compliance, auth |
| HIGH | 7 days | Major features, new routes |
| MEDIUM | 3 days | Bug fixes, minor features |

### session-state.json checksum entry:
```json
"path/to/file.js": {
  "sha256": "abc123...",
  "lockedUntil": "2026-01-17",
  "protectionLevel": "high",
  "lockReason": "Feature description"
}
```

## Git Safety Window

Last 3 commits = protected. Check before editing:
```bash
git log --oneline -n 3 -- path/to/file
```

If file appears, inform user before modifying.

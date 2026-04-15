# Session Tracking

- After completing a feature or major task, update `.claude/STATUS.md` with what was done
- At session end, update `claude-progress.txt` (completed, next, blockers)
- When a feature passes, flip `"passes": false` to `true` in `feature_list.json` — never delete entries
- After creating/modifying critical files, add checksums to `.claude/session-state.json`
- Commit all tracking file updates before ending session

Full reference: `docs/session-tracking-guide.md`

# Code Protection

- ALWAYS read a file before editing it — understand existing code first
- Check `.claude/session-state.json` for protection status before modifying files
- Check `git log --oneline -n 3 -- <file>` — files in last 3 commits are protected
- Protected/recent files: inform user and get permission before modifying
- Prefer ADDING code alongside existing code over MODIFYING or DELETING it
- Never remove >20 lines of recent code without explicit user permission
- Bug fixes: make minimal, surgical changes — don't refactor while fixing
- When in doubt, ask the user before editing protected files

Full reference: `docs/session-tracking-guide.md`

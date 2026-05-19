---
"@markdown-studio/desktop": patch
---

Decouple Homebrew tap updates from immutable desktop releases

- Add a manual Homebrew tap update workflow for published desktop releases
- Keep release publishing successful when the best-effort tap update fails
- Allow tap updates to be retried without recreating desktop release tags

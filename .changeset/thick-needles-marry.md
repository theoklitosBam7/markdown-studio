---
'@markdown-studio/desktop': minor
---

Persist and restore the last opened document across desktop app restarts

- Add two new IPC channels (`documents:restoreLastOpened`, `documents:clearLastOpened`)
- Persist last opened file path to `document-state.json` in Electron's `userData` directory
- Restore the previously opened file on desktop startup
- Skip web draft fallback when running in desktop mode

---
"markdown-studio": patch
---

Replace find dispatch with direct method API

- Replace `EditorWorkspaceFindAction` discriminated union with `EditorWorkspaceFindApi` interface
- Expose named methods (`open`, `close`, `setQuery`, etc.) instead of `dispatch(action)`
- Remove unused state properties from `EditorWorkspaceState`

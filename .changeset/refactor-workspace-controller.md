---
"markdown-studio": patch
"@markdown-studio/desktop": patch
---

Refactor markdown workspace with controller boundary
- Introduce `useEditorWorkspaceController` for workspace orchestration
- Define shared editor and preview pane adapter interfaces
- Move route view coordination behind controller state and APIs
- Reuse shared workspace types in pane and toolbar components
- Add controller-focused tests for shortcuts, sync, and draft restore

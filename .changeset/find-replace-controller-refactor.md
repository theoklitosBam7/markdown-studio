---
"markdown-studio": patch
"@markdown-studio/desktop": patch
---

Refactor find/replace workflow into editor workspace controller

- Move find/replace orchestration behind `useEditorWorkspaceController()` boundary
- Replace individual state exports with unified `findState` computed property
- Add `workspace.find.dispatch()` action pattern for all find/replace operations
- Remove view-level coordination between composables and component refs
- Reduce coupling between MarkdownStudioView, useFindReplace, and imperative pane calls

---
"markdown-studio": patch
"@markdown-studio/desktop": patch
---

Move document lifecycle workflows into workspace controller

- Add `loadExampleDocument()` action to document session with proper state clearing, ensuring status bar correctly shows example title instead of stale file information
- Add stable `id` field to Example type for reliable example selection
- Move document lifecycle orchestration (open, save, startNew, restoreDraft, loadExample) into `useEditorWorkspaceController` with consistent focus management after every action
- Change example selection from title-based to ID-based lookup for stability
- Add warning for unknown example IDs without side effects
- Ensure examples modal closes only after successful load

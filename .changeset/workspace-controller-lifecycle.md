---
"markdown-studio": patch
"@markdown-studio/desktop": patch
---

Internalize workspace controller lifecycle
- Move `start()`/`stop()` calls from MarkdownStudioView.vue into `useEditorWorkspaceController` via `onMounted`/`onUnmounted`
- Harden lifecycle with idempotency guards (`isStarted` flag) and comprehensive error-path cleanup
- Replace `setTimeout(0)` with `nextTick()` for deterministic editor focus after loading examples
- Capture editor adapter references before async operations to prevent TOCTOU issues
- Add null-detach pattern for adapter refs when components unmount
- Extract shared types to `types/common.ts` with barrel re-exports
- Add tests for auto-start lifecycle, desktop command subscription cleanup, and idempotency

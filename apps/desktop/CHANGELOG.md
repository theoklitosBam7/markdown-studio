# @markdown-studio/desktop

## 0.5.0

### Minor Changes

- 76f723d: Add desktop app icons and update branding assets

  **Desktop app:**

  - Add Windows icon (icon.ico) with multi-resolution support (16, 32, 48, 256)
  - Add Linux/macOS icon (icon.png, 1024×1024)
  - Configure electron-builder to use build/icon resources
  - Add generate-desktop-icons script for regenerating from logo.svg

  **CLI:**

  - Update logo.svg with new design (visible when launching via CLI)
  - Regenerate favicon and PWA icons from updated logo

### Patch Changes

- b1f3c7d: Move document lifecycle workflows into workspace controller

  - Add `loadExampleDocument()` action to document session with proper state clearing, ensuring status bar correctly shows example title instead of stale file information
  - Add stable `id` field to Example type for reliable example selection
  - Move document lifecycle orchestration (open, save, startNew, restoreDraft, loadExample) into `useEditorWorkspaceController` with consistent focus management after every action
  - Change example selection from title-based to ID-based lookup for stability
  - Add warning for unknown example IDs without side effects
  - Ensure examples modal closes only after successful load

- cd43cd0: Refactor find/replace workflow into editor workspace controller

  - Move find/replace orchestration behind `useEditorWorkspaceController()` boundary
  - Replace individual state exports with unified `findState` computed property
  - Add `workspace.find.dispatch()` action pattern for all find/replace operations
  - Remove view-level coordination between composables and component refs
  - Reduce coupling between MarkdownStudioView, useFindReplace, and imperative pane calls

- d9fc89d: Refactor markdown workspace with controller boundary
  - Introduce `useEditorWorkspaceController` for workspace orchestration
  - Define shared editor and preview pane adapter interfaces
  - Move route view coordination behind controller state and APIs
  - Reuse shared workspace types in pane and toolbar components
  - Add controller-focused tests for shortcuts, sync, and draft restore
- 8ca635b: Internalize workspace controller lifecycle
  - Move `start()`/`stop()` calls from MarkdownStudioView.vue into `useEditorWorkspaceController` via `onMounted`/`onUnmounted`
  - Harden lifecycle with idempotency guards (`isStarted` flag) and comprehensive error-path cleanup
  - Replace `setTimeout(0)` with `nextTick()` for deterministic editor focus after loading examples
  - Capture editor adapter references before async operations to prevent TOCTOU issues
  - Add null-detach pattern for adapter refs when components unmount
  - Extract shared types to `types/common.ts` with barrel re-exports
  - Add tests for auto-start lifecycle, desktop command subscription cleanup, and idempotency

## 0.4.1

### Patch Changes

- 33e7e78: Fix update banner showing incorrect version format with desktop- prefix (e.g., vdesktop-v0.4.0 instead of v0.4.0)

## 0.4.0

### Minor Changes

- a112de5: Add find and replace functionality to the editor
  - Add FindReplaceBar component with search input and replace controls
  - Add MatchOverlay component for highlighting search matches in the editor
  - Implement useFindReplace composable for managing search state and operations
  - Add keyboard shortcuts (Cmd/Ctrl+F for find, Cmd/Ctrl+H for replace)
  - Support case-sensitive and case-insensitive search
  - Add replace single occurrence and replace all functionality
  - Show match count and current match index
  - Add desktop IPC channel for programmatic text insertion
  - Integrate find/replace actions into desktop application menu

### Patch Changes

- 33eece6: Hide export popover when menu is closed

  - Add CSS rule to prevent the export popover from being visible when the details element is not in open state.
  - This ensures the popover is properly hidden during transitions and when closed via outside click.

- d6da00f: Fix export menu not closing when clicking outside

## 0.3.1

### Patch Changes

- bb833f3: Normalize desktop-v prefix in semver comparison for consistent desktop release versioning

## 0.3.0

### Minor Changes

- f6a5fa6: Add HTML and PDF export via IPC channels with dialog-based file saving
- bf1193f: Add update checker with semver support for detecting and notifying users of app updates

### Patch Changes

- 100b613: Adopt Changesets-based artifact versioning for the desktop and npm releases.

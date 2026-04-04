# @markdown-studio/desktop

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

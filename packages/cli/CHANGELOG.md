# markdown-studio

## 0.5.1

### Patch Changes

- 4dbbd0b: Disable PDF export on mobile devices and installed PWAs

  - PDF export functionality is now disabled on mobile devices and installed Progressive Web Apps, with a helpful tooltip explaining that users should use "Export as HTML" as an alternative. This addresses browser limitations with PDF generation on mobile platforms.

## 0.5.0

### Minor Changes

- bdfd66d: Redesign mobile toolbar UX with hamburger menu and action sheet

  Implement progressive disclosure pattern for mobile toolbar to improve UX on narrow viewports:

  - Add native-feeling bottom action sheet with smooth animations and gesture support
  - Replace overcrowded mobile button grid with hamburger menu revealing all CTAs
  - Move all actions (Open, Save, Install, Examples, Copy, Clear, Export, GitHub) into organized action sheet
  - Improve touch targets to meet 44px minimum accessibility standard
  - Add responsive breakpoints: compact buttons at ≤1200px, icon-only GitHub at ≤1100px
  - Include comprehensive test coverage for new mobile components

- 5442521: Add Progressive Web App support with offline-ready banners, install prompt, and web draft persistence

  - Add service worker registration via vite-plugin-pwa with offline caching
  - Show install prompt in toolbar and PWA banners for offline-ready/update-available states
  - Auto-save unsaved web drafts to localStorage with 1MB size limit and 250ms debounce
  - Restore persisted drafts on app load in the browser
  - Add PWA icon assets, web manifest, and theme/meta tags
  - Update E2E tests to stub browser APIs directly via onBeforeLoad instead of a global override namespace
  - Bump dependencies

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

## 0.3.0

### Minor Changes

- f6a5fa6: Add HTML and PDF export functionality with dedicated export view and print support

### Patch Changes

- 100b613: Adopt Changesets-based artifact versioning for the desktop and npm releases.

# markdown-studio

## 0.12.2

### Patch Changes

- dd93421: Keep HTML previews separate from Markdown drafts and editing
  
  - Cancel pending Workspace Draft writes when an HTML Document opens
  - Restore the previous Markdown Workspace View Mode within viewport limits
  - Prevent image-map links from navigating the HTML Preview frame
- 719c781: Preview self-contained HTML files in a read-only view
  
  - Open HTML files in the web and desktop apps
  - Render HTML in a sandboxed preview
  - Hide Markdown-only actions while an HTML file is active
- b23806d: Render local assets in desktop HTML Preview
  
  - Load relative styles, images, fonts, and media from an HTML Document's folder
  - Confine local asset reads to a per-preview grant with path and file type checks
  - Release each grant when its HTML Preview closes or another document becomes active
- 90ec02b: Allow HTML Preview scripts by choice
  
  - Add a desktop-only enable and disable control for scripts in the active HTML Preview
  - Keep scripts blocked by default and reset the choice when another HTML Document opens
  - Keep enabled scripts isolated from the parent app, network, and desktop bridge
  - Block subframe navigation from the Electron main process

## 0.12.1

### Patch Changes

- 73b4fad: Confirm before clearing a document.
  
  - Ask for confirmation before the Clear action replaces the current document
  - Apply the same guard on desktop and mobile
- 73b4fad: Dismiss transient controls with Escape consistently.
  
  - Close the formatting, rail, export, and width menus on Escape and restore focus to their triggers
  - Return focus to the editor when Find closes
- 73b4fad: Compact the Find/Replace bar.
  
  - Use labelled icon controls for navigation, close, and replace actions
  - Show the match count as a compact badge with an accessible label
  - Expand or collapse Replace from Find
- 73b4fad: Give the editor and preview more vertical space.
  
  - Remove the duplicate pane header rows and their counts
  - Keep the Source Navigation hint as a floating chip in Live Preview
  - Tighten the toolbar padding
- 73b4fad: Make formatting state match formatting commands.
  
  - Detect active formatting with the same ranges used to remove it
  - Keep a valid formatting span active when an unmatched token appears later in the document
- 73b4fad: Show formatting state in the editor toolbar.
  
  - Mark formatting buttons as pressed when the caret is inside the matching Markdown syntax
  - Show the current heading level in the heading control instead of resetting to Text
  - Remove the matching Markdown syntax when a formatting control is pressed again
  - Show common block formatting controls inline when the editor pane has room
- 73b4fad: Improve the mobile status bar and safe-area handling.
  
  - Keep the mobile status bar within the viewport without clipping the last statistic
  - Add plain CSS fallbacks before safe-area inset declarations
  - Add a viewport-height fallback for browsers without `dvh`
- 73b4fad: Fit Live Preview padding to the pane.
  
  - Scale the preview gutter with the pane width instead of using a fixed padding
- 73b4fad: Make Source Navigation visible in Live Preview.
  
  - Show a pointer cursor and hover outline on preview blocks that link back to the source
  - Add a double-click hint to the Preview pane header
- 73b4fad: Improve small-text legibility across the Editor Workspace.
  
  - Darken muted and faint text tokens to meet AA contrast in both themes
  - Raise component UI text to a 12px minimum
  - Hold that caption size in a shared token for future updates
- 73b4fad: Surface primary document controls in the toolbar and give the status bar one clear set of information.
  
  - Place labelled Open, Save, and Export controls in the desktop toolbar
  - Remove the GitHub link and the duplicate save state from the toolbar and status bar
  - Show words, characters, lines, diagrams, and real status together in the status bar

## 0.12.0

### Minor Changes

- 063a269: Add source editor display preferences with writing-focused defaults
  
  - Let writers adjust source font size, line height, word wrap, Tab width, and writing column width
  - Start new and existing installations with 16 px text, 1.7 line height, word wrap on, two-space tabs, and an 80-character writing column
  - Keep saved display preferences local to the current browser origin or desktop profile
  - Note that trusted, noncancelable composition input in a numeric setting can clear pending source Redo without erasing current document text
- 49dcf7d: Resize and remember the editor split and sidebar widths.
  
  - Resize the editor and Live Preview independently from the outline or Document Folder sidebar.
  - Remember each width separately and reset each one without changing the other.
  - Adjust widths with keyboard controls or compact percentage and pixel panels without dragging.
  - Dismiss width panels with an outside click, Escape, or a close button without applying unfinished values.
  - Explain dragging, reset, and keyboard resizing when hovering over a divider.
  - Keep layout save-error notices visible beside the width controls.

## 0.11.1

### Patch Changes

- 6b797fa: Make theme switching immediate in the desktop and web apps.
  
  - Remove the full-window theme reveal
  - Prevent gradual color changes during theme switches

## 0.11.0

### Minor Changes

- 4bfb4f0: Redesign the Editor Workspace with a workspace rail, light and dark themes, numbered source lines, and Markdown formatting tools.
  
  - Keep document, export, view-mode, and mobile actions available
  - Show workspace navigation and document status
  - Offer numbered lists, blockquotes, code blocks, and horizontal rules in the More menu
- 4bfb4f0: Make the mobile Editor Workspace header fit one row on phones
  
  - Show the document name, save state, outline toggle, and view switch in a single header row
  - Move the theme switch and document actions into grouped action sheet sections
  - Keep the action sheet Cancel button visible and move focus into the sheet when it opens
  - Size header, toolbar, and editor controls for touch and stop iOS focus zoom
  - Keep the compact shell on landscape phones and honor device safe areas

## 0.10.2

### Patch Changes

- 376631a: Standardize desktop and browser runtime tooling on Vite+
  
  - Align desktop build, preview, and packaging workflows with Vite+
  - Align browser application and npm launcher workflows with Vite+
  - Consolidate formatting, linting, and test execution under the unified toolchain

## 0.10.1

### Patch Changes

- e52d733: Improve dependency boundary validation across the editor

  - Keep shared editor types available across desktop and browser builds
  - Detect unresolved TypeScript imports during boundary validation

- 88af3a7: Raise the minimum supported Node.js version to 24.15.0

  - Require Node.js 24.15.0 or newer for the desktop app and npm package
  - Pin development and CI environments to Node.js 24.18.1

## 0.10.0

### Minor Changes

- b2842a3: Highlight the active line in the Editor Workspace

  - Follow the editor cursor with a theme-aware active-line highlight
  - Keep the active line visible while navigating, scrolling, and selecting text
  - Preserve a muted active-line highlight when editor focus moves elsewhere

- 1bf02bd: Add a collapsible document outline for navigating Markdown headings

  - Show H1–H6 headings with hierarchical indentation and active-position highlighting
  - Navigate the editor cursor when an outline heading is selected
  - Provide animated desktop and full-width mobile outline layouts

## 0.9.0

### Minor Changes

- b4ad09d: Make task list checkboxes interactive in the Live Preview

  - Toggle task checkboxes directly from the Live Preview
  - Update the matching Markdown source immediately
  - Preserve independent task states and undo support

## 0.8.0

### Minor Changes

- 504d6dc: Add table insertion via the Command Palette in the Editor Workspace.

  - Insert a GFM table at the current cursor position from the Command Palette
  - Use the new "Insert Table" command while editing

- a0e9b03: Add custom row and column selection when inserting a table.

  - Choose any table size from 1 to 50 rows and columns
  - Open the dimension picker from the Command Palette or the toolbar

- b52cd00: Add an Insert Table button to the editor toolbar.

  - Insert a table from the new toolbar button
  - Use the toolbar button as a shortcut for table insertion

## 0.7.0

### Minor Changes

- 2d770d6: Add keyboard shortcuts help overlay

  - Add useShortcuts composable for declarative shortcut binding and dispatch
  - Add ShortcutsHelp modal with grouped shortcut display
  - Replace ad-hoc keydown handling in workspace controller with normalized binding system
  - Add toolbar button and mobile menu item to trigger the shortcuts help overlay

## 0.6.0

### Minor Changes

- cbc3457: Add a keyboard-first command palette to the editor workspace

  - Add searchable workspace commands for document, editor, view, theme, export, and examples workflows
  - Add an accessible command palette overlay with keyboard navigation, disabled reasons, and current-state markers
  - Add shortcut label formatting and focused command palette tests

### Patch Changes

- 6baa5e4: Update tooling and dependencies across the monorepo

  - Migrate shared devDependencies to pnpm catalogs for version consistency
  - Bump Node.js engine requirement to >=22.12.0 and add .node-version pin
  - Update CI workflows to use .node-version for Node resolution
  - Expand .npmrc with workspace, peer dependency, and performance settings
  - Bump core dependencies (Vue 3.5.34, Vite 8.0.11, Vitest 4.1.5, Electron 41.5.1, and others)

- f5c9c53: Extract shared draft persistence debounce logic into reusable composable

  - Introduce `useDebouncedDraftPersistence` with adapter interface to consolidate duplicated debounce, generation-tracking, and flag logic
  - Eliminate double JSON.stringify on the web write path by passing pre-serialized string to adapters

- dcf6517: Replace find dispatch with direct method API

  - Replace `EditorWorkspaceFindAction` discriminated union with `EditorWorkspaceFindApi` interface
  - Expose named methods (`open`, `close`, `setQuery`, etc.) instead of `dispatch(action)`
  - Remove unused state properties from `EditorWorkspaceState`

- c25a5f2: Extract rendered Markdown Document domain module and add project glossary

  - Introduce `rendered-document/` module consolidating preview rendering, export rendering, sanitization, Mermaid export, source marker cleanup, standalone HTML assembly, and export filename helpers
  - Move `renderMarkdownWithSourceMap` from composables into the rendered-document module
  - Retain `utils/renderMarkdownDocument` as a compatibility wrapper for existing consumers
  - Add CONTEXT.md with domain glossary establishing shared vocabulary (Markdown Document, Rendered Markdown Document, Product Surface, Runtime, Workspace Draft, etc.)

## 0.5.2

### Patch Changes

- 76f723d: Update branding assets

  - Update logo.svg with new design (visible when launching via CLI)
  - Regenerate favicon and PWA icons from updated logo

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

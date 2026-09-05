# Editing and Live Preview

The user writes Markdown in the editor pane and the Live Preview renders the document as they type. The Workspace View Mode decides how much space each pane gets: Split shows both, and single-pane modes show one. Clicking a rendered block moves the editor caret to that block's source (Source Navigation), and scrolling one pane keeps the other in step in Split mode. Mermaid code blocks render as diagrams.

## Sub-features

- `view-modes`: Split, editor-only, and preview-only view modes, togglable from the toolbar.
- `typing-renders`: Editor text renders into `.rendered-md` without a manual refresh.
- `source-navigation`: Double-clicking a rendered block focuses the editor at that block's source offset.
- `scroll-sync`: Scrolling the editor scrolls the preview proportionally in Split mode.
- `mermaid-diagrams`: A fenced `mermaid` block renders as an SVG diagram inside `.mermaid-wrap`.

## How to get to it (user POV)

- Open the app. The editor and Live Preview are the first screen on a desktop viewport.
- Click `Split` in the desktop toolbar to cycle or set the view mode.
- On a mobile viewport, use the `editor` and `preview` buttons in `.mobile-toolbar-actions`.
- Type in the editor text area. The Live Preview updates as you type.
- Double-click a heading or paragraph in the preview to jump to its source.

## Driving it with Playwright (browser MCP)

Preconditions: baseline server from the map README, desktop viewport, empty `markdown-studio:web-draft`.

- Type and render:
  1. `browser_type` into the editor textarea (`.editor-pane textarea`): `# Verify heading` plus a blank line and a paragraph.
  2. DOM read: `.rendered-md h1` contains the text `Verify heading`.
  3. Screenshot showing both panes.
- Mermaid diagram:
  1. Append a fenced code block with language `mermaid` containing `graph TD; A-->B;`.
  2. Poll a DOM read of `.mermaid-wrap svg` until it exists. Rendering is async and took several seconds in a proof run; an immediate read reports false.
  3. Screenshot of the diagram.
- View modes (desktop): click the `Split` button in `.toolbar__desktop-controls`; assert both `.editor-pane` and `.preview-pane` are visible. On a mobile viewport, click `[data-mode="preview"]`; assert `.preview-pane` visible and `.editor-pane` not visible.
- Source Navigation: with a document containing a `### Lists` heading, double-click the rendered `.rendered-md h3[data-source-start]` with text `Lists`; read the textarea's `selectionStart` and compare it to `textarea.value.indexOf('### Lists')`. The two must match, and the textarea must be the focused element.
- Scroll sync: set the textarea's `scrollTop` to a nonzero value and dispatch a `scroll` event; read `.preview-scroll` `scrollTop` and require a value greater than zero.

## Gotchas

- Mermaid rendering is async. Poll for `.mermaid-wrap svg`; the SVG is a direct child of `.mermaid-wrap`, and `.mermaid-wrap .mermaid svg` does not match.
- `data-source-start` offsets depend on the document text. Compute the expected offset from the live textarea value, never from a constant.
- On a mobile viewport the Split button does not exist; the mode buttons live in `.mobile-toolbar-actions`. Asserting desktop selectors at a phone width fails for layout reasons, not app reasons.
- Scroll sync needs a document taller than the viewport; a two-line document cannot scroll.

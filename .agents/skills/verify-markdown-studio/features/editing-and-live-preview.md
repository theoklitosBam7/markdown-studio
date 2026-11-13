# Editing and Live Preview

The user writes Markdown in the editor pane and the Live Preview renders the document as they type. The Workspace View Mode decides how much space each pane gets: Split shows both, and single-pane modes show one. Clicking a rendered block moves the editor caret to that block's source (Source Navigation), and scrolling one pane keeps the other in step in Split mode. Mermaid code blocks render as diagrams.

## Sub-features

- `view-modes`: Split, editor-only, and preview-only view modes, togglable from the toolbar.
- `typing-renders`: Editor text renders into `.rendered-md` without a manual refresh.
- `source-navigation`: Double-clicking a rendered block focuses the editor at that block's source offset.
- `scroll-sync`: Scrolling the editor scrolls the preview proportionally in Split mode.
- `mermaid-diagrams`: A fenced `mermaid` block renders as an SVG diagram inside `.mermaid-wrap`.
- `editor-resizing`: The editor divider changes the editor share and resets it independently.
- `outline-sidebar-resizing`: The web outline sidebar resizes and shares one saved width across its open and close state.

## How to get to it (user POV)

- Open the app. The editor and Live Preview are the first screen on a desktop viewport.
- Click `Split` in the desktop toolbar to cycle or set the view mode.
- On a mobile viewport, use the `editor` and `preview` buttons in `.mobile-toolbar-actions`.
- Type in the editor text area. The Live Preview updates as you type.
- Double-click a heading or paragraph in the preview to jump to its source.

## Web drive with agent-browser

Preconditions: baseline server from the map README, desktop viewport, and an empty `markdown-studio:web-draft`. Load the `agent-browser` core guide before using the CLI. Use its accessibility snapshot and element references for interaction, and capture screenshots and DOM evidence in the run directory.

- Type and render: enter `# Verify heading`, a blank line, and a paragraph in `.editor-pane textarea`. Confirm `.rendered-md h1` contains `Verify heading`, then capture both panes.
- Mermaid diagram: append a fenced `mermaid` block containing `graph TD; A-->B;`. Poll until `.mermaid-wrap svg` exists, then capture it.
- View modes: select `Split` in `.toolbar__desktop-controls` and confirm both `.editor-pane` and `.preview-pane` are visible. At a mobile viewport, select `[data-mode="preview"]` and confirm only the preview is visible.
- Source Navigation: with a `### Lists` heading in the document, double-click its rendered `h3[data-source-start]`. Confirm the editor is focused and its `selectionStart` equals `textarea.value.indexOf('### Lists')`.
- Scroll sync: use a document taller than the viewport, scroll the editor, and confirm `.preview-scroll` also scrolls.
- Editor resize: in Split mode, record the editor divider's accessible name, value, and bounds. Drag it in both directions and confirm editor and Live Preview widths change. Use arrow keys, Shift+Arrow, Home, and End on the focused divider. Open **Pane widths**, enter a value in **Editor percentage**, and verify the displayed split. Double-click the editor divider and select **Reset to equal widths** in separate runs. Confirm each reset sets an equal split and leaves the sidebar key unchanged. Press Escape during a drag and confirm the previous value returns.
- Outline sidebar resize: open the outline sidebar and resize its divider in both directions. Confirm its separator name and pixel value, then try Arrow, Shift+Arrow, Home, and End. Open **Sidebar width**, enter a value in **Sidebar width in pixels**, and confirm the outline width changes. Double-click the sidebar divider and select **Reset sidebar width** in separate runs. Confirm each reset returns to the default and leaves the editor split key unchanged. Hide and reopen the sidebar; confirm its width returns. The web recipe covers the outline only, not Document Folder behavior.
- Persistence and independence: record both storage keys before and after each adjustment, reset, and reload. Confirm `markdown-studio:workspace-split-ratio` stores the editor fraction (default `0.5`) and `markdown-studio:workspace-sidebar-width` stores CSS pixels (default `248`). Confirm adjusting one does not write the other.
- Mobile: at a mobile viewport, confirm no resize divider or width control is focusable and the existing mobile outline layout remains unchanged. Confirm neither stored preference changes. Do not treat web proof as proof of desktop folder behavior or desktop-profile relaunch persistence.

## Separate desktop smoke check

Build the desktop app with `vpr build:desktop` before starting `vpr preview:desktop`. Use a verification profile, not the user's application data. In the real desktop app, test both dividers, each independent reset, the numeric controls, and the shared sidebar width across Outline and Document Folder tabs. Navigate folders, close and reopen the sidebar, then relaunch with the same profile and confirm both widths restore. Record the profile used and the two stored values. This smoke check is the proof for Document Folder resizing and desktop-profile persistence; web proof does not cover them.

Use the desktop View menu Zoom controls to reach mobile CSS widths. Check the outline and Document Folder presentations for unchanged mobile sizing and no active dividers or preference writes. Restore the verification profile's zoom after the check. If Zoom commands do not change the renderer viewport, record the breakpoint check as blocked and do not report it as verified.

## Gotchas

- Mermaid rendering is async. Poll for `.mermaid-wrap svg`; the SVG is a direct child of `.mermaid-wrap`, and `.mermaid-wrap .mermaid svg` does not match.
- `data-source-start` offsets depend on the document text. Compute the expected offset from the live textarea value, never from a constant.
- On a mobile viewport the Split button does not exist; the mode buttons live in `.mobile-toolbar-actions`. Asserting desktop selectors at a phone width fails for layout reasons, not app reasons.
- Scroll sync needs a document taller than the viewport; a two-line document cannot scroll.
- The outline sidebar is the only sidebar covered by the web recipe. Document Folder resizing, navigation, and relaunch persistence require the real desktop smoke check above.
- Sidebar sizing remains as it is today on mobile: the outline is full width at 700 CSS px or less, while Document Folder keeps its existing 248 px sizing and vertical flow. Do not claim those desktop-app cases are verified unless desktop Zoom changes the CSS viewport and the checks pass.

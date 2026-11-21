# Export

The Export menu turns the active Markdown Document into a Rendered Markdown Document outside the editor. Export HTML downloads a standalone HTML file. Export PDF opens the `/export/print?job=<id>` route in a popup, restores the payload from localStorage or the popup's `window.name`, renders the print document, and calls the browser print dialog. The menu closes when the user clicks outside it.

## Sub-features

- `export-menu`: The toolbar `button[aria-label="Export document"]` opens `.toolbar__export-menu [role="menu"]` with `button[aria-label="Export HTML"]` and `button[aria-label="Export PDF"]`.
- `export-html`: Export HTML downloads a blob named `<document>.html`, default `Untitled.html`.
- `export-pdf`: Export PDF opens a popup to `/export/print?job=<id>` and stores the payload in localStorage under `markdown-studio:print-export:<id>`.
- `print-view`: The print route renders `.print-view__document` with the exported content and calls `window.print` once; a missing job shows the error state instead.
- `menu-dismiss`: Clicking outside the popover closes it.

## How to get to it (user POV)

- Click `button[aria-label="Export document"]` in the desktop toolbar.
- Pick `button[aria-label="Export HTML"]` or `button[aria-label="Export PDF"]` in `.toolbar__export-menu`.
- On mobile, `Export as HTML` lives in the action sheet. PDF export is disabled on mobile viewports and shows an explanatory note.

## Web drive with agent-browser

Preconditions: baseline server, desktop viewport.

- Menu open and dismiss:
  1. Click `button[aria-label="Export document"]`; assert `.toolbar__export-menu [role="menu"]` is visible.
  2. Click the editor textarea; assert the menu is no longer visible.
- Print route end-to-end:
  1. Type `# Exported as PDF` in the editor.
  2. Open the menu, click the `Export PDF` item.
  3. In this path the popup cannot be captured by the interactive browser; verify the side effect instead: read localStorage for a key matching `markdown-studio:print-export:` and record the job id and payload.
  4. Navigate to `/export/print?job=<id>` with the payload already in localStorage, otherwise the view shows `The export job is no longer available.` Cypress can also prove the popup's `window.name` fallback path.
  5. Assert `.print-view__document` contains `Exported as PDF` and the error state is absent.

## Driving it with Cypress

Preconditions: copy `stubBrowserPopup`, `stubBrowserDownload`, and `clickDocumentAction` from `cypress/e2e/markdown-studio.cy.ts` into the temp spec. `clickDocumentAction('Export HTML')` opens the menu before clicking the item.

- HTML download: stub downloads, type `# Exported as HTML`, open the menu, click the `Export HTML` item; assert one download with name `Untitled.html`.
- PDF popup and print view: stub `window.open` with `stubBrowserPopup` and stub `window.print`. Run the export, assert the captured URL matches `/^\/export\/print\?job=/` and the payload contains the rendered `<h1>`. Then visit the captured URL with the payload written into localStorage first, assert `.print-view__document` shows the content, the error state is absent, and `print` was called once.

## Gotchas

- The print view reads its payload from localStorage, then falls back to `window.name` written by the popup. A fresh context with neither shows the error state; that failure means setup missed the payload, not that export broke.
- `Export PDF` is disabled on mobile viewports. The disabled item shows the note `PDF export isn't available on mobile or installed PWAs yet. Use Export as HTML instead.` Treat a click there as a recipe error.
- The export menu closes on outside click, including a click into the editor. Keep clicks between opening and choosing inside `.toolbar__export-menu`.

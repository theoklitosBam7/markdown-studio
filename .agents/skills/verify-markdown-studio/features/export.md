# Export

The Export menu turns the active Markdown Document into a Rendered Markdown Document outside the editor. Export HTML downloads a standalone HTML file. Export PDF opens the `/export/print?job=<id>` route in a popup, restores the payload from localStorage, renders the print document, and calls the browser print dialog. The menu closes when the user clicks outside it.

## Sub-features

- `export-menu`: The toolbar `Export` trigger opens `.export-menu__popover` with `Export HTML` and `Export PDF` items.
- `export-html`: Export HTML downloads a blob named `<document>.html`, default `Untitled.html`.
- `export-pdf`: Export PDF opens a popup to `/export/print?job=<id>` and stores the payload in localStorage under `markdown-studio:print-export:<id>`.
- `print-view`: The print route renders `.print-view__document` with the exported content and calls `window.print` once; a missing job shows the error state instead.
- `menu-dismiss`: Clicking outside the popover closes it.

## How to get to it (user POV)

- Click `Export` in the desktop toolbar (`summary[aria-label="Export document"]`).
- Pick `Export HTML` or `Export PDF` in the popover.
- On mobile, `Export as HTML` lives in the action sheet; PDF export is disabled on mobile and installed PWAs, with an explanatory note.

## Driving it with Playwright (browser MCP)

Preconditions: baseline server, desktop viewport.

- Menu open and dismiss:
  1. Click the export trigger; assert `.export-menu__popover` is visible.
  2. Click the editor textarea; assert the popover is no longer visible.
- Print route end-to-end:
  1. Type `# Exported as PDF` in the editor.
  2. Open the menu, click the `Export PDF` item.
  3. In this path the popup cannot be captured by the interactive browser; verify the side effect instead: read localStorage for a key matching `markdown-studio:print-export:` and record the job id and payload.
  4. Navigate to `/export/print?job=<id>`; the payload must be set in localStorage before or at load, otherwise the view shows the error text `The export job is no longer available.`
  5. Assert `.print-view__document` contains `Exported as PDF` and the error state is absent.

## Driving it with Cypress

Preconditions: copy `stubBrowserPopup`, `stubBrowserDownload`, and `openExportMenu` from `cypress/e2e/markdown-studio.cy.ts` into the temp spec.

- HTML download: stub downloads, type `# Exported as HTML`, open the menu, click the `Export HTML` item; assert one download with name `Untitled.html`.
- PDF popup and print view: stub `window.open` with `stubBrowserPopup` and stub `window.print`. Run the export, assert the captured URL matches `/^\/export\/print\?job=/` and the payload contains the rendered `<h1>`. Then visit the captured URL with the payload written into localStorage first, assert `.print-view__document` shows the content, the error state is absent, and `print` was called once.

## Gotchas

- The print view reads its payload from localStorage keyed by the job id. Visiting the print URL in a fresh context without the payload shows the error state; that failure means the setup missed the payload write, not that export broke.
- `Export PDF` is disabled on mobile viewports and in installed PWAs. The disabled item shows the note `PDF export isn't available on mobile or installed PWAs yet.` Treat a click there as a recipe error.
- The export menu closes on outside click, including a click into the editor. Keep clicks between opening and choosing inside the popover.

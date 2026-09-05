# Open and Save Documents

The user opens a Markdown file from disk into the Editor Workspace, edits it, and saves it. On the web the app uses the File System Access API when available and falls back to a hidden file input on open and to a blob download on save. After a successful save through a picked handle, later saves reuse that handle without a dialog. The status bar shows the Document Identity, the file name, and the last action.

## Sub-features

- `open-picker`: Open reads the picked file into the editor and records its name in the status bar.
- `open-fallback`: When `showOpenFilePicker` is missing or throws, the hidden input path loads the file anyway.
- `save-download`: Saving a document with no file handle downloads it as a blob with the right name, default `Untitled.md`.
- `save-handle-reuse`: After the first save through `showSaveFilePicker`, a second save writes through the same handle with no second picker.
- `document-identity`: The status bar (`status-item--document`) shows the current file name; the status message reads `Opened <name>` or `Saved <name>`.

## How to get to it (user POV)

- Click `Open` in the desktop toolbar, or `Open` in the mobile action sheet (`Menu` button).
- Click `Save` in the desktop toolbar, or `Save` in the mobile action sheet.
- The status bar at the bottom shows the document name and the outcome of the last action.

## Driving it with Cypress

Preconditions: baseline server, desktop viewport. These flows need browser-API stubs, so drive them with Cypress, not the interactive browser. Copy the stub helpers (`stubBrowserOpen`, `stubBrowserOpenFallbackInput`, `stubBrowserSavePicker`, `stubBrowserDownload`) from `cypress/e2e/markdown-studio.cy.ts` into the temp spec.

- Open through the picker:
  1. `cy.visit('/', { onBeforeLoad(win) { stubBrowserOpen(win, 'web-notes.md', '# Imported') } })`
  2. Click the `Open` button in `.toolbar__actions`.
  3. Assert the textarea value is `# Imported`, `.status-item--document` contains `web-notes.md`, and `.status-bar` contains `Opened web-notes.md`.
- Open through the fallback with a picker error:
  1. Stub with `stubBrowserOpenFallbackInput(win, 'picker-fallback.md', '# Recovered', { pickerError: new win.DOMException('Denied', 'SecurityError') })`.
  2. Click `Open`; assert the editor holds `# Recovered` and the status bar names the file.
- Save as download:
  1. Stub with `stubBrowserDownload(win, downloads)`.
  2. Type `# Downloaded from web`, click `Save`.
  3. Assert `downloads` has one entry with name `Untitled.md`, and the status bar reads `Saved Untitled.md`.
- Save with handle reuse:
  1. Stub with `stubBrowserSavePicker(win, writes, 'picked-from-browser.md')`.
  2. Type `# First save`, click `Save`, assert `.status-item--document` shows the picked name.
  3. Type `# Second save`, click `Save` again; no second picker call.
  4. Assert `writes` deep-equals `['# First save', '# Second save']`.

## Gotchas

- Do not click `Open` or `Save` in an interactive Playwright drive. They open native dialogs or download files to the browser profile, outside the evidence directory.
- The fallback open path dispatches focus and blur events around the input; use the repo's `stubBrowserOpenFallbackInput` as is rather than re-deriving it.
- The download stub must replace `document.createElement` before the click happens; `onBeforeLoad` is the right hook.
- Asserting `downloads[0].name` requires typing text first; saving the pristine document also works but names the file `Untitled.md`.

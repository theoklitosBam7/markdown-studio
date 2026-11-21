# HTML Preview

Opening an HTML Document (`.htm` or `.html`) shows the Editor Workspace's HTML Preview. The app renders the file in a sandboxed iframe and hides editing, saving, export, and Workspace View Mode controls. Opening a Markdown Document later restores the editor. On desktop, an HTML Preview Asset Grant and a script opt-in control local assets and inline scripts; the web recipe cannot prove those paths.

## Sub-features

- `html-open`: `Open document` with an HTML file shows `.html-preview`, the file name in `.toolbar__document strong`, and `Opened <name> (read-only)` in `.status-bar`.
- `html-sandbox`: `iframe[title="HTML preview"]` uses `sandbox=""` on web with a restrictive `srcdoc` CSP. Scripts, forms, remote requests, and parent DOM access stay blocked.
- `html-return`: Opening a Markdown file after an HTML file restores `.editor-pane textarea` and `.preview-pane`, and shows Save and Export controls again.
- `desktop-html-assets`: Desktop grants local assets for the HTML file and exposes `.html-preview__scripts-toggle`.

## How to get to it (user POV)

- Click `button[aria-label="Open document"]` and choose an `.html` file.
- Read the notice in `.html-preview__notice`. Use `Open document` again to choose a Markdown file and return to editing.

## Driving it with Cypress

Preconditions: baseline server, desktop viewport. This flow needs a stubbed file picker, so drive it with Cypress, not the interactive browser. Copy `stubDocumentOpen` and `findHtmlPreviewFrame` from `cypress/e2e/html-preview.cy.ts` into the temp spec.

- HTML open and sandbox:
  1. Stub `win.showOpenFilePicker` with `stubDocumentOpen(win, htmlDocument, 'report.html')` before load, then visit `/`.
  2. Click `button[aria-label="Open document"]`.
  3. Assert `.html-preview` is visible, `iframe[title="HTML preview"]` has `sandbox=""`, and `srcdoc` contains the HTML content and a restrictive CSP but no `<script`.
  4. Assert `.editor-pane textarea`, `.preview-pane`, `button[aria-label="Save document"]`, and `button[aria-label="Export document"]` do not exist.
  5. Assert `.toolbar__document strong` contains `report.html` and `.status-bar` contains `read-only`. Capture the screenshot as HTML preview default.
- Return to Markdown: stub the picker again with `notes.md` and `# Markdown again`, click Open, then assert the textarea and preview are visible, Save and Export controls return, and `.html-preview` is gone.
- Frame stability and hostile content: the existing spec covers image-map link clicks, blocked scripts, fetches, popups, and parent DOM access. Run `cypress/e2e/html-preview.cy.ts` as the scripted proof for those cases.

## Separate desktop smoke check

Build with `vpr build:desktop`, use a verification profile, and open an HTML file that references a local asset. Confirm the asset loads, then use `.html-preview__scripts-toggle` to enable and disable inline scripts and read the notice change. Record the profile and asset path.

## Gotchas

- The web frame always has `sandbox=""`. A wider sandbox is a desktop-only opt-in after the user enables scripts.
- `srcdoc` is rewritten with a CSP and script removal. Assert on the prepared markup, not the source file bytes.
- Keep the HTML Preview case out of the editing and export recipes. Their editor and export selectors do not exist in this document mode.

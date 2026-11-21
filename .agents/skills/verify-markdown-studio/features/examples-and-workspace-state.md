# Examples and Workspace State

The user can load a bundled Example Document, switch between light and dark themes, clear the document, and rely on the Workspace Draft to come back after a reload. On mobile, these actions live in an action sheet behind the `Menu` button.

## Sub-features

- `examples-modal`: The desktop `Document actions` rail menu's `Load examples` item, or the mobile `Load Examples` sheet action, opens a dialog titled `Load an example`. Selecting a card replaces the active document and closes the dialog.
- `theme-toggle`: The theme button switches `html[data-theme]` between light and dark, and the choice persists in localStorage under `markdown-studio-theme`.
- `draft-restore`: The app persists a Workspace Draft to `markdown-studio:web-draft` and restores it into the editor on the next load.
- `clear-document`: Clear opens a custom `Clear this document?` modal; `Confirm clear` empties the editor.
- `mobile-action-sheet`: On mobile, `Menu` opens `.mobile-action-sheet` with `Open`, `Save`, `Load Examples`, `Copy Markdown`, `Clear Document`, `Export as HTML`, and a disabled `Export as PDF`.

## How to get to it (user POV)

- Open the desktop `Document actions` rail menu and choose `Load examples`, or use `Load Examples` in the mobile action sheet.
- On desktop, click the toolbar theme button (`aria-label="Switch to dark mode"` or the reverse label). On mobile, use the theme action in the sheet.
- Click `Clear Document` in the mobile action sheet, or `Clear document` in the desktop `Document actions` rail menu.
- Reload the page after typing; the draft comes back.

## Web drive with agent-browser

Preconditions: baseline server; clear `markdown-studio:web-draft` and `markdown-studio-theme` before starting.

- Examples modal: open the desktop `Document actions` rail menu and click `button[aria-label="Load examples"]`. Assert `[role="dialog"] h2` reads `Load an example`. Pick a card and assert the editor textarea holds its content and `.modal-overlay.open` is gone. Selecting a card closes the dialog; `button[aria-label="Close dialog"]` cancels instead.
- Theme: click the toolbar theme button; assert `html` has `data-theme="dark"`. Read `localStorage['markdown-studio-theme']` and match the visible theme. Click again to return.
- Draft restore: type `# Draft proof` into the editor, wait a moment for the debounced write, then reload the page. Assert the textarea holds `# Draft proof` and `markdown-studio:web-draft` exists in localStorage. The write is debounced, so reload too early and the draft is missing; wait or poll the key before reloading.
- Clear document: open the desktop `Document actions` rail menu and click `button[aria-label="Clear document"]`. Assert the `.modal-overlay.open` heading reads `Clear this document?`, click `button[aria-label="Confirm clear"]`, then assert the textarea is empty.

## Driving it with Cypress

Preconditions: desktop viewport spec plus a `cy.viewport('iphone-6')` spec for the action sheet; copy patterns from `cypress/e2e/markdown-studio.cy.ts`.

- Mobile action sheet: at `iphone-6`, click `button[aria-label="Menu"]`, assert `.mobile-action-sheet__title` reads `Actions`, and assert each expected action is visible. `Export as PDF` must be visible and disabled with its explanatory note. Cancel with `.mobile-action-sheet__cancel` and assert the sheet is gone.
- Clear with confirm: run Clear from the sheet, click `button[aria-label="Confirm clear"]` in the custom modal, and assert the textarea is empty. No native `window.confirm` is used here.

## Gotchas

- The draft write is debounced. A reload immediately after typing can legitimately show an empty editor; poll for the localStorage key before treating the draft as missing.
- Theme state and drafts live in the browser profile. Between runs in the same profile, clear both keys or the baseline is already mutated.
- Loading an example replaces the active document without confirmation. Do not run the examples recipe on a document whose content a later step depends on.
- On mobile, `Export as PDF` is disabled by design; a failed click there is the correct behavior, not a bug.
- Dialogs stay in the DOM with `opacity: 0` after closing. Assert `.modal-overlay.open` for visibility, not `[role="dialog"]` existence.

# Examples and Workspace State

The user can load a bundled Example Document, switch between light and dark themes, clear the document, and rely on the Workspace Draft to come back after a reload. On mobile, these actions live in an action sheet behind the `Menu` button.

## Sub-features

- `examples-modal`: The `Examples` toolbar button opens a dialog titled `Load an example`; loading one replaces the active document.
- `theme-toggle`: The theme button switches `html[data-theme]` between light and dark, and the choice persists in localStorage under `markdown-studio-theme`.
- `draft-restore`: The app persists a Workspace Draft to `markdown-studio:web-draft` and restores it into the editor on the next load.
- `clear-document`: Clear asks for confirmation, then empties the editor.
- `mobile-action-sheet`: On mobile, `Menu` opens `.mobile-action-sheet` with `Open`, `Save`, `Load Examples`, `Copy Markdown`, `Clear Document`, `Export as HTML`, and a disabled `Export as PDF`.

## How to get to it (user POV)

- Click `Examples` in the desktop toolbar, or `Load Examples` in the mobile action sheet.
- Click the theme button (`aria-label="Switch to dark mode"` or the reverse label) in the toolbar.
- Click `Clear Document` in the mobile action sheet, or its desktop equivalent in the toolbar.
- Reload the page after typing; the draft comes back.

## Driving it with Playwright (browser MCP)

Preconditions: baseline server; clear `markdown-studio:web-draft` and `markdown-studio-theme` before starting.

- Examples modal: click the `Examples` button; assert `[role="dialog"] h2` reads `Load an example`. Pick one, close via `button[aria-label="Close dialog"]`, and assert the editor textarea now holds the example's content.
- Theme: click the theme button; assert `html` has `data-theme="dark"`. Read `localStorage['markdown-studio-theme']` and match the visible theme. Click again to return.
- Draft restore: type `# Draft proof` into the editor, wait a moment for the debounced write, then reload the page. Assert the textarea holds `# Draft proof` and `markdown-studio:web-draft` exists in localStorage. The write is debounced, so reload too early and the draft is missing; wait or poll the key before reloading.
- Clear document: stub or accept the confirm dialog, run Clear, assert the textarea value is empty.

## Driving it with Cypress

Preconditions: desktop viewport spec plus a `cy.viewport('iphone-6')` spec for the action sheet; copy patterns from `cypress/e2e/markdown-studio.cy.ts`.

- Mobile action sheet: at `iphone-6`, click `button[aria-label="Menu"]`, assert `.mobile-action-sheet__title` reads `Actions`, and assert each expected action is visible. `Export as PDF` must be visible and disabled with its explanatory note. Cancel with `.mobile-action-sheet__cancel` and assert the sheet is gone.
- Clear with confirm: stub `win.confirm` to return true, run Clear from the sheet, assert the textarea is empty.

## Gotchas

- The draft write is debounced. A reload immediately after typing can legitimately show an empty editor; poll for the localStorage key before treating the draft as missing.
- Theme state and drafts live in the browser profile. Between runs in the same profile, clear both keys or the baseline is already mutated.
- Loading an example replaces the active document without confirmation. Do not run the examples recipe on a document whose content a later step depends on.
- On mobile, `Export as PDF` is disabled by design; a failed click there is the correct behavior, not a bug.

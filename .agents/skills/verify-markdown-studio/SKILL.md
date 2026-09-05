---
name: verify-markdown-studio
description: Drive the real Markdown Studio web app (Editor Workspace) in a browser to prove user-facing behavior. Use when a task needs verification of editing, Live Preview, open/save, Command Palette, Find, Export, examples, themes, or the mobile layout, and when a change claims to fix or add any of those.
---

# Verify Markdown Studio

Drive the running app the way a user does: launch it, interact through the browser, and capture evidence. Markdown Studio is a Vue 3 + Electron Markdown editor. This skill targets the web app in `apps/web` (the Editor Workspace). The desktop app wraps the same renderer, so web proof covers most editor behavior; Electron shell behavior itself is out of scope here. The landing page (`apps/landing-page`) and the npm launcher (`packages/cli`) are separate surfaces.

Read `features/README.md` before driving, then use the matching feature file as the recipe. The map is the maintained list of what to verify; a proof that hits one easy entry point is not complete when the map lists others.

## Launch

Run all commands from the repo root. Use the Vite+ binaries at `./node_modules/.bin/` (`vp`, `vpr`, `cypress`); the repo requires Vite+, not bare npm.

Always set `VITE_DISABLE_PWA=true`. Without it the build registers a service worker and a repeat drive can load stale assets.

Pick a port first. Check it is free, and use the same port for the whole run:

```bash
lsof -nP -iTCP:4175 -sTCP:LISTEN   # empty means free
```

Two launch modes:

- Dev server, fast start, best for interactive drives:

  ```bash
  VITE_DISABLE_PWA=true ./node_modules/.bin/vp -C apps/web dev --port 4175 > /tmp/markdown-studio-verify-server.log 2>&1 &
  echo $!   # record this PID for cleanup
  ```

- Built preview, release-faithful, matches what CI's Cypress run tests. Slower: build first.

  ```bash
  VITE_DISABLE_PWA=true vpr build:web
  VITE_DISABLE_PWA=true ./node_modules/.bin/vp -C apps/web preview --port 4175 > /tmp/markdown-studio-verify-server.log 2>&1 &
  echo $!
  ```

Ready when `curl -fsS http://localhost:4175/` returns HTML whose title is `Markdown Studio`. The log line `Local: http://localhost:4175/` is the same signal.

Dev mode injects a Vue Devtools toggle at the page edge; the built preview has none. Seeing that toggle means you are on a dev server, not a built one.

Teardown lives in Cleanup below.

## Doctor

Run this before driving, and again whenever anything looks wrong. It answers "is this instance worth driving?"

```bash
# 1. The port answers and serves this app
curl -fsS http://localhost:4175/ | grep -o '<title>[^<]*</title>'   # expect <title>Markdown Studio</title>

# 2. Which kind of server is it
curl -fsS http://localhost:4175/ | grep -oE '/src/main\.ts|/assets/index-[^"]+\.js'
# /src/main.ts  -> dev server
# /assets/*.js  -> built preview

# 3. The listener is the process this run started
lsof -nP -iTCP:4175 -sTCP:LISTEN   # PID must match the PID recorded at launch
```

If the PID differs, someone else owns the port. Do not drive that instance and do not kill it. Pick another port and relaunch.

## Drive

Two paths. Prefer Path A for interactive verification; use Path B for repeatable scripted proof and for anything needing browser-API stubs.

### Path A: Playwright browser MCP

If the session provides the playwright MCP server, use it. Discover the exact tool names first if needed, then:

1. `browser_navigate` to `http://localhost:4175/`.
2. `browser_snapshot` to get the accessibility tree with element refs.
3. `browser_click`, `browser_type`, `browser_press_key` on refs. For keyboard flows, the app listens for real key events, for example Ctrl+K opens the Command Palette.
4. `browser_take_screenshot` for visual evidence; `browser_evaluate` to read app state such as localStorage or `document.querySelector` results. The screenshot lands relative to the MCP server's working directory, not yours. Pass the absolute evidence path if the tool accepts it; otherwise find the file (`fd <name> /tmp`) and move it into `/tmp/markdown-studio-verify/<RUN_ID>/`.

Never click `Open` or `Save` in this path. They open native file dialogs or trigger real downloads, and an agent cannot control either. Verify those flows with Path B.

### Path B: Cypress

Cypress is the repo's scripted harness. Existing specs live in `cypress/e2e/markdown-studio.cy.ts`; read it for stub patterns before writing a new spec.

With a server already running (Path A's launch or the doctor check), run one temporary spec:

```bash
./node_modules/.bin/cypress run --e2e --config baseUrl=http://localhost:4175 --spec cypress/e2e/tmp-verify.cy.ts
```

Or run the full repo command, which builds the web app, starts its own server on port 4175, and runs every spec:

```bash
vpr test:e2e
```

The temp spec is scratch: delete it after the run. Cypress writes videos and screenshots to `cypress/videos/` and `cypress/screenshots/` (both gitignored).

### Stable handles

Real selectors from the app, in order of preference (ARIA and data attributes beat classes):

| Handle                   | Selector                                                                                |
| ------------------------ | --------------------------------------------------------------------------------------- |
| Editor text area         | `.editor-pane textarea`                                                                 |
| Live Preview pane        | `.preview-pane`                                                                         |
| Preview scroll container | `.preview-scroll`                                                                       |
| Rendered document root   | `.rendered-md`                                                                          |
| Source-mapped block      | `.rendered-md [data-source-start]`                                                      |
| Mermaid diagram          | `.mermaid-wrap svg` (async; poll for it, it can take seconds)                           |
| Toolbar actions          | `.toolbar__actions` buttons `Open`, `Save`                                              |
| View mode toggle         | `.toolbar__desktop-controls` button `Split`                                             |
| Examples button          | toolbar button containing `Examples`                                                    |
| Export menu trigger      | `summary[aria-label="Export document"]`                                                 |
| Export menu              | `.export-menu__popover[role="menu"]`, items `.export-menu__item`                        |
| Command Palette          | Ctrl+K, then `.command-palette__input`, `.command-palette__results`                     |
| Find bar                 | `.find-replace-bar__input`                                                              |
| Status bar               | `.status-bar`, `.status-item--document`                                                 |
| Theme toggle             | `button[aria-label="Switch to dark mode"]`, state on `html[data-theme]`                 |
| Mobile toolbar           | `.mobile-toolbar-actions`, mode buttons `[data-mode="editor"]`, `[data-mode="preview"]` |
| Mobile menu              | `button[aria-label="Menu"]`, items `.mobile-action-sheet__action`                       |
| Dialogs                  | `[role="dialog"]`, close via `button[aria-label="Close dialog"]`                        |

### State the app keeps in the browser

| Key                                    | Meaning                                                         |
| -------------------------------------- | --------------------------------------------------------------- |
| `markdown-studio:web-draft`            | Workspace Draft; restores into the editor automatically on load |
| `markdown-studio-theme`                | Theme choice                                                    |
| `markdown-studio:print-export:<jobId>` | PDF export payload for the `/export/print?job=<id>` route       |

Clear `markdown-studio:web-draft` for a clean slate, or the editor may start with content from an earlier session.

## Evidence

Write every artifact for a run to `/tmp/markdown-studio-verify/<RUN_ID>/`, where `RUN_ID` is a timestamp such as `20260829-153312`. Evidence survives cleanup; the skill deletes servers and scratch files, never this directory.

Proof standards:

- Exercise the real user path: type in the editor, click the toolbar, press the Shortcut. Do not call internal stores or test-only hooks; the app has no test-only endpoints.
- Capture the action and the resulting state, not just the final screen. For example, record the typed text and the rendered heading, then the screenshot.
- Verify side effects next to what is visible: localStorage keys after a draft save, the download stub's captured blob in Cypress, the print popup URL and payload for PDF export.
- Name the feature ID from the map and the entry point used in every artifact. A skipped entry point is not verified through a different path; report it as skipped with the reason.

## Cleanup

Kill only what this run started:

```bash
kill "$SERVER_PID"                    # the PID recorded at launch
sleep 1
lsof -nP -iTCP:4175 -sTCP:LISTEN     # must be empty
```

If the port is still held by the launched server after the kill, kill the PID that `lsof -t -i :4175 -sTCP:LISTEN` prints. Never kill by process name, and never kill a PID the doctor flagged as foreign. Delete scratch Cypress specs written for the run. Keep `/tmp/markdown-studio-verify/<RUN_ID>/` intact; after cleanup, confirm the evidence files are still there.

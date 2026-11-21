# Repository Instructions

## Coding standards

Read [CODING_STANDARDS.md](./CODING_STANDARDS.md) before you write or change code, and check the changed code against it before you finish.

## Project map

Markdown Studio is a Vue 3 + Electron Markdown editor with Live Preview and Mermaid diagrams. It ships as a desktop app, a web app, and an npm launcher.

- `apps/web` (`@markdown-studio/web`) mounts the Editor Workspace in the browser.
- `apps/desktop` (`@markdown-studio/desktop`) is the Electron shell: main process, preload, IPC handlers, menu, and packaging.
- `apps/landing-page` (`@markdown-studio/landing`) is the marketing site.
- `packages/app` (`@markdown-studio/app`) holds shared Vue code: components, composables, features, layouts, router, services, stores, and views.
- `packages/desktop-contract` (`@markdown-studio/desktop-contract`) holds the renderer and main process contract: channel names, types, and payload validation.
- `packages/cli` (`markdown-studio`) is the published npm package and browser launcher.
- `cypress/e2e` holds end-to-end tests.

The boundary rules in `vite.config.ts` enforce the module structure. A feature does not import another feature, and a view orchestrates features instead of reaching into stores or services. Layouts, UI components, global stores, and the router each have their own allowed imports. When a rule rejects your import, move the code to the permitted layer instead of changing the rule.

`packages/desktop-contract` is the wire contract. When a message changes, update its channel, types, validation, senders, receivers, and tests together.

## Security boundaries

These boundaries cover Electron main and preload code, IPC channels, external URLs, file access, rendered HTML, and the `markdown-studio-asset:` protocol.

- Renderer windows keep `contextIsolation: true`, `nodeIntegration: false`, and `sandbox: true`.
- The renderer reaches the main process only through the preload API and the channels in `packages/desktop-contract`.
- Main process IPC handlers validate every payload with the contract's `assert*` functions before use.
- External links pass `assertExternalUrl`, which allows only http, https, and mailto, and open in the system browser, never in a window or the renderer.
- Markdown HTML is sanitized in the Rendered Markdown Document builder at `packages/app/src/features/markdown/rendered-document` before it reaches Live Preview or Export.
- The main process owns file system access. The renderer does not read or write files directly.

A security requirement takes precedence over a style preference and over the rule against speculative complexity.

## Package manager

Use Vite+ for every install and script run. It delegates dependency operations to pnpm.

- Install dependencies with `vp install`.
- Run scripts with `vpr <script>` or `vp exec <bin>`.
- Use `./node_modules/.bin/vp` and `./node_modules/.bin/vpr` when the binaries are not on `PATH`.

`npm`, `npx`, and `yarn` bypass the pnpm version that `devEngines.packageManager` pins. CI installs with Vite+ and a frozen lockfile; use the workflow files as the source of truth when CI behavior matters.

## Test-driven development

Load `.agents/skills/tdd/SKILL.md` and follow it before you implement a change that adds or changes executable behavior. If the skill is unavailable, or a meaningful executable test is blocked, stop and report the blocker.

Skip TDD for discovery, documentation, compatibility audits, and repository maintenance that changes no executable behavior. Run the checks that fit that work.

Choose the test level:

- Vitest unit and component tests for isolated behavior, in `__tests__` folders beside the code.
- Cypress tests in `cypress/e2e` for Editor Workspace workflows that a unit test cannot prove.
- The `verify-markdown-studio` skill when the change needs proof in a browser.

Read [docs/testing.md](./docs/testing.md) before you add or change tests in `packages/app`. The app suite shares one jsdom environment per worker and fails a test when Vue emits a warning.

## Completion criteria

A task is complete when `vpr check` and `vpr type-check` pass. `vpr check` runs formatting and linting with type checking disabled inside it; `vpr type-check` runs `vue-tsc --build`.

- When tests are relevant, run the smallest targeted `vpr test:*` suite first, then widen.
- `vpr preview` and `vpr preview:desktop` show built output, so run `vpr build:web` or `vpr build:desktop` first when the preview script does not build for you.
- Update the documentation when public behavior, contracts, or architectural decisions change.

## Domain documentation

Read [GLOSSARY.md](./GLOSSARY.md) before you introduce or rename a product concept, and use its terms in code, comments, tests, and documentation. For example, write **Shortcut**, not "keybind" or "hotkey", **Editor Workspace**, not "page", and **Live Preview**, not "preview pane".

Read the relevant decisions in [`docs/adr`](./docs/adr) before an architectural change. Name any conflict with an existing decision instead of replacing it silently.

## Changesets

A release-affecting change needs a changeset. CI decides which paths are release-affecting from the filters in `.github/workflows/pull-request.yml`, so check the filters for the paths you changed.

Use one of two packages:

- `@markdown-studio/desktop` for `apps/desktop`, and for `packages/app` or `packages/desktop-contract` changes that ship with the desktop app.
- `markdown-studio` for `packages/cli`, and for `packages/app` or `apps/web` changes that ship in the npm package.

A change to `packages/app` or `apps/web` can ship in both, so add both entries when it does.

Write the body for Release Notes as a summary sentence, a blank line, then a list of changes that each begin with a present-tense verb. Describe the user-visible or distributable effect. For maintenance and tooling changes, describe the affected shipped surface or workflow. Leave out test-only and refactor-only work.

Run `vpr changeset:validate-scopes` before you open a pull request. It checks the package names only, so the body rules above still apply.

## Commits and pull requests

- Choose a commit scope from `commitlint.config.ts`.
- Fill the matching template in `.github` for an issue or a pull request, including its evidence section.
- Run the `code-review` skill against the merge base before you open a pull request, and resolve or explicitly accept every finding. Pass [`docs/code-review-reviewer-brief.md`](./docs/code-review-reviewer-brief.md) verbatim to both reviewer sub-agents. The skill's axis brief sets the scope, output shape, and word limit.

## Core priorities

Prefer reliability and predictable behavior over convenience. Keep the editor responsive during typing, Live Preview rendering, file open and save, and desktop integration.

Keep one implementation of shared logic across components, composables, IPC handlers, and helpers. Keep framework-specific logic out of generic modules, and keep a single implementation of each behavior unless a platform boundary such as web versus desktop requires two.

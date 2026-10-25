# Repository Instructions

## Coding standards

Before writing or modifying code, read and follow [CODING_STANDARDS.md](./CODING_STANDARDS.md).

These standards define the project's expectations for functions, composables, validation, types, control flow, error handling, and complexity. Apply them during implementation, not only during review.

## Project map

Markdown Studio is a Vue 3 + Electron Markdown editor with Live Preview, Mermaid diagram support, and a split web/desktop experience.

- `apps/web` — Browser entry that mounts the Editor Workspace.
- `apps/desktop` — Electron shell: main process, preload, IPC handlers, menu, and packaging.
- `apps/landing-page` — Marketing site.
- `packages/app` — Shared Vue application code: components, composables, features, layouts, router, services, stores, views.
- `packages/desktop-contract` — Renderer and main process contract: channel names, types, and payload validation.
- `packages/cli` — Published npm package and browser launcher.
- `cypress/e2e` — End-to-end tests.

`vite.config.ts` enforces the feature boundaries. A feature in `packages/app/src/features` does not import from another feature, and a view orchestrates features instead of reaching into stores or services.

Treat `packages/desktop-contract` as the wire contract. When a message changes, update its channel, types, validation, senders, receivers, and relevant tests together.

## Security boundaries

These boundaries apply to Electron main and preload code, IPC channels, external URL handling, file access, rendered HTML, and the `markdown-studio-asset:` protocol.

Preserve the existing security model:

- Renderer windows keep `contextIsolation: true`, `nodeIntegration: false` and `sandbox: true`.
- The renderer reaches the main process only through the preload API and the channels in `packages/desktop-contract`.
- Main process IPC handlers validate every payload with the `assert*` functions before use.
- External links go through the protocol allowlist in `assertExternalUrl` and open in the system browser, never in a window or the renderer.
- Rendered Markdown HTML is sanitized where the Rendered Markdown Document is built, before it reaches Live Preview or Export.
- The main process owns file system access. The renderer does not read or write files directly.

Documented security requirements take precedence over coding-style preferences and rules against speculative complexity.

## Package manager

Use **Vite+** for repository commands. Vite+ delegates dependency operations to pnpm:

- Install dependencies: `vp install` (not `npm install` or `yarn`)
- Run scripts: `vpr <script>` or `vp exec <bin>` (not `npm run`, `npx`, or `yarn`)

Respect the pnpm version declared under `devEngines.packageManager` in the root `package.json`. When CI behavior matters, use the workflow files as the source of truth; they install with Vite+ and a frozen lockfile.

## Test-driven development

For every coding task that adds or changes executable behavior, load and follow the `.agents/skills/tdd/SKILL.md` skill before implementation. If the skill is unavailable or a meaningful executable test is blocked, stop and report the blocker before continuing.

Skip TDD for discovery, documentation, compatibility audits, and repository maintenance that do not change executable behavior. Run checks appropriate to that work.

Use the appropriate test level for the change:

- Unit and component tests with Vitest for isolated behavior; they live beside the code in `__tests__` folders.
- Cypress end-to-end tests in `cypress/e2e` for Editor Workspace workflows that a unit test cannot prove.
- The `verify-markdown-studio` skill when a change needs proof in a browser.

## Completion Criteria

- A task is complete when `vpr check` and `vpr type-check` pass. `vpr check` covers formatting and linting; `vpr type-check` runs the separate Vue and TypeScript build check.
- Before running a preview command, build the corresponding app when the command uses `vite preview` or `electron-vite preview`.
- When tests are relevant, run the smallest targeted suite first, then expand only when needed. Prefer the repository's `vpr test:*` scripts over ad hoc commands.
- Use existing repository scripts and configuration as the source of truth for commands and paths.
- Keep changes within the requested scope. Follow the existing architecture, patterns, and dependencies before introducing new ones.
- New complexity needs a concrete requirement. Get approval before adding protection for speculative edge cases, as `CODING_STANDARDS.md` requires.
- Update documentation when public behavior, contracts, or architectural decisions change.

## Domain documentation

Read [GLOSSARY.md](./GLOSSARY.md) when introducing or changing product concepts or terminology. Use its terms in code, comments, tests, and documentation. For example, prefer **Shortcut** over "keybind" or "hotkey", **Editor Workspace** over "page", and **Live Preview** over "preview pane" when those concepts match the change.

Before making architectural changes, read the relevant decisions in [`docs/adr`](./docs/adr). Identify conflicts with existing decisions rather than silently replacing them.

## Commits and Pull Requests

- Use the supported scopes from `commitlint.config.ts` when writing commit subjects.
- Use the appropriate issue or pull-request template from `.github` when creating one.
- Before creating a pull request, validate any Changeset with `vpr changeset:validate-scopes`.

## Changesets

- Use `@markdown-studio/desktop` for desktop behavior, packaging, and shared changes shipped with the desktop app.
- Use `markdown-studio` for the published npm package and browser launcher behavior. Changes in `@markdown-studio/app` and `@markdown-studio/web` can affect this package.
- For whether a Changeset is required, inspect the current release filters in `.github/workflows/pull-request.yml`; do not infer the answer only from the package name or implementation intent.
- Use the following format for generated changesets:

  ```
  Summary sentence describing the change

  - Action verb describing one logical change
  - Action verb describing another logical change
  - Action verb describing yet another logical change
  ```

  Start with a summary line (no bullet), then a blank line, then unordered list items each beginning with a present-tense verb.

- Run `vpr changeset:validate-scopes` after you perform changeset actions.
- Changesets feed Release Notes. Describe the user-visible or distributable impact in plain terms. For maintenance or tooling changes that CI classifies as release-affecting, describe the affected shipped surface or distribution workflow instead of listing implementation steps. Do not list test-only or refactor-only work.

## Core Priorities

1. Reliability first.
2. Predictable behavior first.
3. User experience and performance should stay smooth under normal editing, file operations, and preview updates.

Keep the editor responsive during typing, preview rendering, file open/save flows, and desktop integration. If there is a tradeoff, prefer correctness and consistency over short-term convenience.

## Maintainability

Long-term maintainability is a core priority. If you add new functionality, first check whether existing shared logic already covers it.

Duplicate logic across components, composables, Electron IPC handlers, and helpers is a code smell and should be avoided. Prefer small, reusable abstractions over local one-off fixes.

Do not take shortcuts by putting framework-specific logic in places that are meant to stay generic, and do not introduce parallel implementations for the same behavior unless there is a clear platform boundary.

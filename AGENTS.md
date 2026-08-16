# AGENTS.md

## Package manager

Use **Vite+** for repository commands. Vite+ delegates dependency operations to pnpm:

- Install dependencies: `vp install` (not `npm install` or `yarn`)
- Run scripts: `vpr <script>` or `vp exec <bin>` (not `npm run`, `npx`, or `yarn`)

Respect the pnpm version declared under `devEngines.packageManager` in the root `package.json`. When CI behavior matters, use the workflow files as the source of truth; they install with Vite+ and a frozen lockfile.

## Completion Criteria

- A task is complete when `vpr check` and `vpr type-check` pass. `vpr check` covers formatting and linting; `vpr type-check` runs the separate Vue and TypeScript build check.
- Before running a preview command, build the corresponding app when the command uses `vite preview` or `electron-vite preview`.
- When tests are relevant, run the smallest targeted suite first, then expand only when needed. Prefer the repository's `vpr test:*` scripts over ad hoc commands.
- Use existing repository scripts and configuration as the source of truth for commands and paths.

## Domain Language

When naming or describing product concepts, read `CONTEXT.md` and use its terms. For example, prefer **Shortcut** over "keybind" or "hotkey", **Editor Workspace** over "page", and **Live Preview** over "preview pane" when those concepts match the change.

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

## Project Snapshot

Markdown Studio is a Vue 3 + Electron Markdown editor with live preview, Mermaid diagram support, and a split web/desktop experience. The repo is intentionally lightweight and still evolving, so changes that improve long-term clarity, maintainability, and UI quality are welcome.

## Core Priorities

1. Reliability first.
2. Predictable behavior first.
3. User experience and performance should stay smooth under normal editing, file operations, and preview updates.

Keep the editor responsive during typing, preview rendering, file open/save flows, and desktop integration. If there is a tradeoff, prefer correctness and consistency over short-term convenience.

## Maintainability

Long-term maintainability is a core priority. If you add new functionality, first check whether shared logic can be extracted into a composable, utility, or shared module.

Duplicate logic across components, composables, Electron IPC handlers, and helpers is a code smell and should be avoided. Prefer small, reusable abstractions over local one-off fixes.

Do not take shortcuts by putting framework-specific logic in places that are meant to stay generic, and do not introduce parallel implementations for the same behavior unless there is a clear platform boundary.

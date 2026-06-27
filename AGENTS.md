# AGENTS.md

## Package manager

Always use **pnpm** for this repo:

- Install dependencies: `pnpm install` (not `npm install` or `yarn`)
- Run scripts: `pnpm <script>` or `pnpm exec <bin>` (not `npm run`, `npx`, or `yarn`)

The root `package.json` pins the package manager via `packageManager`; respect it.

## Task Completion Requirements

- Run `pnpm format`, `pnpm lint`, and `pnpm type-check` before considering a task complete.
- Before running a script command that uses `vite preview` or `electron-vite preview`, don't forget to build the corresponding app first.
- If tests are relevant to the change, run the smallest targeted suite first, then expand only if needed. Prefer `pnpm test:unit`, `pnpm test:e2e:dev`, or `pnpm test:e2e` over ad hoc commands.
- Do not use outdated or redundant scripts when a repo-specific command already exists.

## Project Language

`CONTEXT.md` is the canonical project-language reference generated from domain review sessions. Use its terms when naming concepts, writing documentation, opening issues, and describing changes. For example, prefer **Shortcut** over "keybind" or "hotkey", **Editor Workspace** over "page", and **Live Preview** over "preview pane" when those concepts match the change.

## Commit Scopes

The supported scopes are defined in `commitlint.config.ts`; prefer those scopes when writing commit subjects.

## Issue and PR Templates

- Before creating a PR, make sure to run `pnpm changeset:validate-scopes` to validate the changeset scopes. If there is no changeset file, create one. If the changeset file is not valid, update it to match the new use case.
- Use the appropriate issue or PR template when creating a new issue or PR located in the `.github` directory.
- If the template doesn't fit, update it to match the new use case.

## Changesets Validation

- `@markdown-studio/desktop` for desktop-specific behavior, packaging changes, and shared app changes that are not desktop-specific, but that are still shipped with the desktop app.
- `markdown-studio` for the published npm package and browser launcher behavior. It is affected from changes in `@markdown-studio/app`, `@markdown-studio/web` when they are not desktop-specific.
- Use the following format for generated changesets:

  ```
  Summary sentence describing the change

  - Action verb describing one logical change
  - Action verb describing another logical change
  - Action verb describing yet another logical change
  ```

  Start with a summary line (no bullet), then a blank line, then unordered list items each beginning with a present-tense verb.

- Run `pnpm changeset:validate-scopes` after you perform changeset actions.

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

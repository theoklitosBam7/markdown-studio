# AGENTS.md

## Task Completion Requirements

- Run `pnpm format`, `pnpm lint`, and `pnpm type-check` before considering a task complete.
- Before running a script command that uses `vite preview` or `electron-vite preview`, don't forget to build the corresponding app first.
- If tests are relevant to the change, run the smallest targeted suite first, then expand only if needed. Prefer `pnpm test:unit`, `pnpm test:e2e:dev`, or `pnpm test:e2e` over ad hoc commands.
- Do not use outdated or redundant scripts when a repo-specific command already exists.

## Issue and PR Templates

- Use the appropriate issue or PR template when creating a new issue or PR located in the `.github` directory.
- If the template doesn't fit, update it to match the new use case.

## Changesets Validation

- `@markdown-studio/desktop` for desktop-only behavior and packaging changes.
- `markdown-studio` for the published npm package and browser launcher behavior. It is affected from changes in `@markdown-studio/app`, `@markdown-studio/web` when they are not desktop-only.
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

## Project Areas

- `packages/app/src`: Shared Vue application code for the editor, preview, routing, composables, and shared UI.
- `packages/app/src/features/markdown`: Markdown-specific UI and behavior, including editor, preview, toolbar, examples, and status surfaces.
- `packages/app/src/components`: Shared UI components used across the app.
- `packages/app/src/composables`: Reusable Vue logic shared across features and views.
- `packages/app/src/router`: Vue Router setup and route definitions.
- `packages/app/src/utils`: Pure utility functions. Keep this layer framework-free.
- `apps/web`: Browser app workspace and Vite entrypoint.
- `apps/desktop`: Electron desktop workspace, including the renderer entrypoint and Electron main/preload/ipc code.
- `packages/desktop-contract`: Shared desktop channel/types/validation contract used by the renderer and Electron shell.
- `cypress`: End-to-end tests and support files.

Keep framework boundaries clean. Vue-specific state and behavior should live in `packages/app`. Electron-only code should stay in `apps/desktop/electron/`. Pure helpers should remain free of Vue, Pinia, and router dependencies.

## App Architecture

Markdown Studio is split between the browser renderer and the Electron desktop shell.

How the codebase is organized:

- `packages/app/src/createMarkdownStudioApp.ts` bootstraps the shared Vue app.
- `packages/app/src/App.vue` stays lean and delegates real behavior to the app and feature layers.
- `packages/app/src/router/index.ts` owns route setup and environment-specific history selection.
- `apps/web/src/main.ts` and `apps/desktop/src/main.ts` are thin runtime entrypoints that mount the shared app.
- `apps/desktop/electron/main.ts` and `apps/desktop/electron/preload.ts` own desktop integration and IPC exposure.
- `apps/desktop/electron/ipc/*` contains IPC handlers for file and shell operations.
- `packages/desktop-contract/src/*` contains the shared desktop IPC contract.
- `packages/app/src/features/markdown/*` contains the main writing experience and should own most Markdown-specific logic.

Docs:

- README: [README.md](README.md)

## Reference Libraries

- Vue 3 docs: https://vuejs.org/
- Pinia docs: https://pinia.vuejs.org/
- Vue Router docs: https://router.vuejs.org/
- Electron docs: https://www.electronjs.org/docs/latest/
- Vite docs: https://vite.dev/

Use these as implementation references when designing application structure, reactivity, routing, and desktop integration.

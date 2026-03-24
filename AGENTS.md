# AGENTS.md

## Task Completion Requirements

- Run `pnpm format`, `pnpm lint`, and `pnpm type-check` before considering a task complete.
- Before running a script command that uses `vite preview`, don't forget to build the app first.
- If tests are relevant to the change, run the smallest targeted suite first, then expand only if needed. Prefer `pnpm test:unit`, `pnpm test:e2e:dev`, or `pnpm test:e2e` over ad hoc commands.
- When running a specific single test file in Vitest, use the `pnpm exec vitest run` command; e.g.: `pnpm exec vitest run src/__tests__/App.spec.ts`.
- Do not use outdated or redundant scripts when a repo-specific command already exists.

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

- `src`: Vue application code for the editor, preview, routing, stores, composables, and shared UI.
- `src/features/markdown`: Markdown-specific UI and behavior, including editor, preview, toolbar, examples, and status surfaces.
- `src/components`: Shared UI components used across the app.
- `src/composables`: Reusable Vue logic shared across features and views.
- `src/router`: Vue Router setup and route definitions.
- `src/stores`: Pinia stores and app state.
- `src/utils`: Pure utility functions. Keep this layer framework-free.
- `electron`: Electron main-process, preload, and IPC code for desktop-only behavior.
- `cypress`: End-to-end tests and support files.

Keep framework boundaries clean. Vue-specific state and behavior should live in components, composables, or stores. Electron-only code should stay in `electron/`. Pure helpers should remain free of Vue, Pinia, and router dependencies.

## App Architecture

Markdown Studio is split between the browser renderer and the Electron desktop shell.

How the codebase is organized:

- `src/main.ts` bootstraps the Vue app.
- `src/App.vue` stays lean and delegates real behavior to the app and feature layers.
- `src/router/index.ts` owns route setup and environment-specific history selection.
- `electron/main.ts` and `electron/preload.ts` own desktop integration and IPC exposure.
- `electron/ipc/*` contains IPC handlers for file and shell operations.
- `src/features/markdown/*` contains the main writing experience and should own most Markdown-specific logic.

Docs:

- README: [README.md](README.md)

## Reference Libraries

- Vue 3 docs: https://vuejs.org/
- Pinia docs: https://pinia.vuejs.org/
- Vue Router docs: https://router.vuejs.org/
- Electron docs: https://www.electronjs.org/docs/latest/
- Vite docs: https://vite.dev/

Use these as implementation references when designing application structure, reactivity, routing, and desktop integration.

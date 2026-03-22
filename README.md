# Markdown Studio

Markdown Studio is a Vue 3 + Vite app for writing Markdown with a live preview, Mermaid diagram rendering, theme switching, and sample content presets.

## Features

- Split-pane editor and preview layout
- Live Markdown rendering with `marked`
- Safe HTML rendering with `DOMPurify`
- Mermaid diagram support
- Light and dark themes
- Example document picker
- Copy Markdown content to the clipboard

## Tech Stack

- Vue 3
- Vite
- TypeScript
- Vue Router
- Pinia
- DOMPurify
- Marked
- Mermaid

## Project Structure

- [`src/main.ts`](./src/main.ts) bootstraps the app and installs Pinia and the router.
- [`src/App.vue`](./src/App.vue) renders the routed view and loads global styles.
- [`src/router/index.ts`](./src/router/index.ts) defines the single home route.
- [`src/views/MarkdownStudioView.vue`](./src/views/MarkdownStudioView.vue) wires the editor, preview, toolbar, and status bar together.
- [`src/features/markdown/composables/useMarkdownEditor.ts`](./src/features/markdown/composables/useMarkdownEditor.ts) contains the editor state and Markdown rendering logic.
- [`src/features/markdown/components/`](./src/features/markdown/components) contains the editor UI.
- [`src/utils/escapeHtml.ts`](./src/utils/escapeHtml.ts) provides HTML escaping for rendered output.

## Getting Started

Install dependencies:

```sh
pnpm install
```

Start the dev server:

```sh
pnpm dev
```

Build for production:

```sh
pnpm build
```

Preview the production build:

```sh
pnpm preview
```

## Testing

Run unit tests:

```sh
pnpm test:unit
```

Run Cypress in development mode:

```sh
pnpm test:e2e:dev
```

Run Cypress against the production preview:

```sh
pnpm build
pnpm test:e2e
```

## Quality Checks

Type-check the project:

```sh
pnpm type-check
```

Run linting:

```sh
pnpm lint
```

Format source files:

```sh
pnpm format
```

## Notes

- The app is mounted through Vue Router, so `App.vue` only renders `<RouterView />`.
- Unit tests live under `src/**/__tests__`.
- Cypress end-to-end tests live under `cypress/e2e`.

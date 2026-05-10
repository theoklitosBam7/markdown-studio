---
"@markdown-studio/desktop": patch
"markdown-studio": patch
---

Update tooling and dependencies across the monorepo

- Migrate shared devDependencies to pnpm catalogs for version consistency
- Bump Node.js engine requirement to >=22.12.0 and add .node-version pin
- Update CI workflows to use .node-version for Node resolution
- Expand .npmrc with workspace, peer dependency, and performance settings
- Bump core dependencies (Vue 3.5.34, Vite 8.0.11, Vitest 4.1.5, Electron 41.5.1, and others)

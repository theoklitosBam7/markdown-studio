---
"@markdown-studio/desktop": patch
"markdown-studio": patch
---

Improve dependency boundary validation across the editor

- Keep shared editor types available across desktop and browser builds
- Detect unresolved TypeScript imports during boundary validation

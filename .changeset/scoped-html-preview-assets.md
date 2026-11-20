---
"@markdown-studio/desktop": patch
"markdown-studio": patch
---

Render local assets in desktop HTML Preview

- Load relative styles, images, fonts, and media from an HTML Document's folder
- Confine local asset reads to a per-preview grant with path and file type checks
- Release each grant when its HTML Preview closes or another document becomes active

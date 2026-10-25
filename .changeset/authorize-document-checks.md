---
'@markdown-studio/desktop': patch
---

Restrict disk-change checks to authorized documents

- Prevent the renderer from reading unrelated files through disk-change checks
- Keep disk-change checks available for opened, saved, and restored documents

---
'@markdown-studio/desktop': patch
---

Check for external file changes before saving desktop documents

- Reload clean documents when the file changed on disk
- Ask before overwriting disk changes in a dirty document
- Recreate documents that are missing from disk when saved

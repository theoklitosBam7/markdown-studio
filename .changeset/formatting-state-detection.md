---
'@markdown-studio/desktop': patch
'markdown-studio': patch
---

Make formatting state match formatting commands.

- Detect active formatting with the same ranges used to remove it
- Keep a valid formatting span active when an unmatched token appears later in the document

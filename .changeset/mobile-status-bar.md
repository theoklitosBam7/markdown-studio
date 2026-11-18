---
'@markdown-studio/desktop': patch
'markdown-studio': patch
---

Improve the mobile status bar and safe-area handling.

- Keep the mobile status bar within the viewport without clipping the last statistic
- Add plain CSS fallbacks before safe-area inset declarations
- Add a viewport-height fallback for browsers without `dvh`

---
'markdown-studio': patch
'@markdown-studio/desktop': patch
---

Hide export popover when menu is closed

- Add CSS rule to prevent the export popover from being visible when the details element is not in open state.
- This ensures the popover is properly hidden during transitions and when closed via outside click.

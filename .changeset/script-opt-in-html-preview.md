---
"@markdown-studio/desktop": patch
"markdown-studio": patch
---

Allow HTML Preview scripts by choice

- Add an enable and disable control for scripts in the active HTML Preview
- Keep scripts blocked by default and reset the choice when another HTML Document opens
- Keep enabled scripts isolated from the parent app, network, and desktop bridge

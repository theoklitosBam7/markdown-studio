---
'@markdown-studio/desktop': minor
'markdown-studio': minor
---

Add find and replace functionality to the editor

- Add FindReplaceBar component with search input and replace controls
- Add MatchOverlay component for highlighting search matches in the editor
- Implement useFindReplace composable for managing search state and operations
- Add keyboard shortcuts (Cmd/Ctrl+F for find, Cmd/Ctrl+H for replace)
- Support case-sensitive and case-insensitive search
- Add replace single occurrence and replace all functionality
- Show match count and current match index
- Add desktop IPC channel for programmatic text insertion
- Integrate find/replace actions into desktop application menu

---
"@markdown-studio/desktop": patch
"markdown-studio": patch
---

Extract shared draft persistence debounce logic into reusable composable

- Introduce `useDebouncedDraftPersistence` with adapter interface to consolidate duplicated debounce, generation-tracking, and flag logic
- Eliminate double JSON.stringify on the web write path by passing pre-serialized string to adapters

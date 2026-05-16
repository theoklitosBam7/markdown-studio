---
"@markdown-studio/desktop": patch
"markdown-studio": patch
---

Extract rendered Markdown Document domain module and add project glossary

- Introduce `rendered-document/` module consolidating preview rendering, export rendering, sanitization, Mermaid export, source marker cleanup, standalone HTML assembly, and export filename helpers
- Move `renderMarkdownWithSourceMap` from composables into the rendered-document module
- Retain `utils/renderMarkdownDocument` as a compatibility wrapper for existing consumers
- Add CONTEXT.md with domain glossary establishing shared vocabulary (Markdown Document, Rendered Markdown Document, Product Surface, Runtime, Workspace Draft, etc.)

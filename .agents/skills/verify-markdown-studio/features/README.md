# Markdown Studio verification map

This directory is the maintained source for verifying user-facing behavior of Markdown Studio's web Editor Workspace. Read this index before driving the app, then use the matching feature file as the recipe.

## Features

| ID                   | File                                                               | Covers                                                                              |
| -------------------- | ------------------------------------------------------------------ | ----------------------------------------------------------------------------------- |
| editing-live-preview | [editing-and-live-preview.md](editing-and-live-preview.md)         | View modes, typing renders, Source Navigation, scroll sync, Mermaid diagrams        |
| open-save            | [open-save-documents.md](open-save-documents.md)                   | Open with pickers and fallbacks, Save with handles and downloads, Document Identity |
| command-palette-find | [command-palette-and-find.md](command-palette-and-find.md)         | Command Palette, Find and Replace                                                   |
| export               | [export.md](export.md)                                             | HTML export, PDF export print route, menu behavior                                  |
| workspace-state      | [examples-and-workspace-state.md](examples-and-workspace-state.md) | Example Documents, themes, Workspace Draft, Clear Document, mobile action sheet     |

## Baseline preconditions

- Start the server per SKILL.md Launch with `VITE_DISABLE_PWA=true` and a port you confirmed free. Record the PID.
- Run the doctor checks and require the title `Markdown Studio` and a PID that matches the launch record.
- Set `RUN_ID` and create `/tmp/markdown-studio-verify/$RUN_ID/` for evidence.
- Start each feature from a clean state: clear `markdown-studio:web-draft` and `markdown-studio-theme` in the browser profile, then reload.
- Use a desktop viewport (1280x900) unless the recipe tests the mobile layout.
- Never drive an instance this run did not start.

## Driving conventions

- Start every recipe from the baseline state unless its preconditions say otherwise.
- Prefer ARIA labels and data attributes from the SKILL.md handle table over classes and positions.
- Treat selectors and key sequences as literal.
- Interactive drives go through the Playwright browser MCP; stubbed browser-API flows go through Cypress.
- After a mutation that changes persisted state, clear the relevant localStorage key before the next recipe.

## Proof and skip reporting

- Capture the user action and the resulting state, not only the final screen.
- UI proof includes a screenshot and either an accessibility snapshot or a DOM read that shows the result.
- Side-effect proof includes a second, independent read of the effect: a localStorage key, a captured download in a Cypress stub, or the print popup payload.
- Record the feature ID and the entry point used with every artifact.
- Report an unreachable path with the attempted action and the unmet precondition. Do not report a skipped entry point as verified through a different path.

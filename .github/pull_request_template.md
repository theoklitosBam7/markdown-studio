## Summary

<!-- Describe what this PR does and why in 2-3 sentences. Use the terms from GLOSSARY.md. -->

<!-- Show the smallest useful view: a short diff, call tree, file tree, or Mermaid diagram. Skip the view when prose is enough. -->

## Type of Change

- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Refactor
- [ ] Documentation
- [ ] Workflow
- [ ] Test

## Evidence

<!-- Show concrete proof that the change works. Use screenshots for visual changes and command or test output for behavior changes. -->

| Before | After |
| ------ | ----- |
|        |       |

<!-- For non-visual changes, replace the table with exact before and after output. -->

## Merge Danger

**Door:** <!-- one-way or two-way -->

<!-- Explain what makes the change easy or hard to reverse. -->

**Blast Radius:** <!-- one-word scope -->

<!-- List the parts of the product this change can affect. -->

## Test Procedure

<!-- Explain how this was tested and what reviewers should check. -->

- [ ] Unit tests pass: `vpr test:unit`
- [ ] E2E tests pass: `vpr test:e2e` (if applicable)
- [ ] Manual testing notes:

## Related Issue

<!-- Link to the related GitHub issue, for example "Fixes #123" or "Closes #456". -->

## Pre-flight Checklist

- [ ] Tests added or updated for the changed functionality
- [ ] Lint and type checks pass: `vpr check && vpr type-check`
- [ ] No unintended changes to other files
- [ ] UI changes have screenshots or recordings

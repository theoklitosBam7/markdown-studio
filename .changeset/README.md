# Changesets

This repository versions release-bearing artifacts with Changesets.

Allowed package scopes:

- `@markdown-studio/desktop` for desktop-only behavior and packaging changes
- `markdown-studio` for the published npm package and browser launcher behavior

Internal workspaces are intentionally excluded from release scopes:

- `@markdown-studio/app`
- `@markdown-studio/web`
- `@markdown-studio/desktop-contract`
- `@markdown-studio/landing`

When shared code changes affect both shipped artifacts, include both allowed package names in the same changeset.

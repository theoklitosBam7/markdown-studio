# Changesets

This repository versions release-bearing artifacts with Changesets.

Allowed package scopes:

- `@markdown-studio/desktop` for desktop-specific behavior, packaging changes, and shared app changes that are not desktop-specific.
- `markdown-studio` for the published npm package and browser launcher behavior. It is affected from changes in `@markdown-studio/app`, `@markdown-studio/web` when they are not desktop-specific.

Internal workspaces are intentionally excluded from release scopes:

- `@markdown-studio/app`
- `@markdown-studio/web`
- `@markdown-studio/desktop-contract`
- `@markdown-studio/landing`

When shared code changes affect both shipped artifacts, include both allowed package names in the same changeset.

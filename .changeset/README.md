# Changesets

This repository versions release-bearing artifacts with Changesets.

Allowed package scopes:

- `@markdown-studio/desktop` for desktop-specific behavior, packaging changes, and shared app changes that are not desktop-specific, but that are still shipped with the desktop app.
- `markdown-studio` for the published npm package and browser launcher behavior. It is affected from changes in `@markdown-studio/app`, `@markdown-studio/web` when they are not desktop-specific.

# Distribute unsigned macOS app via Homebrew Cask

Markdown Studio is an unsigned macOS Electron app. Users who download it from GitHub Releases hit Gatekeeper and must manually run `xattr -dr com.apple.quarantine` to launch the app. This also blocks auto-updates — the app can only show a banner directing users to the GitHub Releases page to manually download the next version. We decided to distribute through a Homebrew Cask in a custom tap (`theoklitosBam7/homebrew-tap`). The cask's `postflight` block clears the quarantine attribute automatically, and updates become a single `brew upgrade` command. We ruled out code signing (requires a $99/year Apple Developer account), official homebrew-cask submission (slow PR review cycle), and in-app auto-updates (requires code signing). The direct-download DMG path remains available as a fallback.

Status: accepted

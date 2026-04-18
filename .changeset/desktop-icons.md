---
"@markdown-studio/desktop": minor
"markdown-studio": patch
---

Add desktop app icons and update branding assets

**Desktop app:**
- Add Windows icon (icon.ico) with multi-resolution support (16, 32, 48, 256)
- Add Linux/macOS icon (icon.png, 1024×1024)
- Configure electron-builder to use build/icon resources
- Add generate-desktop-icons script for regenerating from logo.svg

**CLI:**
- Update logo.svg with new design (visible when launching via CLI)
- Regenerate favicon and PWA icons from updated logo

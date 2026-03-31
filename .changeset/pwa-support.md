---
'markdown-studio': minor
---

Add Progressive Web App support with offline-ready banners, install prompt, and web draft persistence
- Add service worker registration via vite-plugin-pwa with offline caching
- Show install prompt in toolbar and PWA banners for offline-ready/update-available states
- Auto-save unsaved web drafts to localStorage with 1MB size limit and 250ms debounce
- Restore persisted drafts on app load in the browser
- Add PWA icon assets, web manifest, and theme/meta tags
- Update E2E tests to stub browser APIs directly via onBeforeLoad instead of a global override namespace
- Bump dependencies

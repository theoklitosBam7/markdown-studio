// Escape HTML special characters for text nodes and attribute values.
//
// The canonical copy lives in the core app at
// packages/app/src/utils/escapeHtml.ts. The landing page is a standalone,
// lightweight (plain-TS) app that intentionally does not depend on
// @markdown-studio/app — depending on it would pull Vue, marked, and dompurify
// into the marketing shell — so a local, behaviour-aligned copy is kept here.
// Keep these two copies in sync.
export function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

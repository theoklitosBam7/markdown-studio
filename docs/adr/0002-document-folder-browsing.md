# Document Folder browsing is a desktop-only capability

Markdown Studio runs in two Runtimes from one shared application package, and the web Runtime reaches files through the File System Access API. Browsing a Document Folder needs a directory picker that only Chromium serves, plus permission grants that browsers ask for again after a reload. We decided to add Document Folder browsing to the desktop Runtime only, reached through new channels in `packages/desktop-contract`, with every read confined to a folder the user opened. The web build keeps its single-file open and save flow and shows no folder panel. We rejected a Chromium-only web version, because the PWA would lose the feature in Safari and Firefox and the permission re-prompt would break the open-a-folder-then-return-later workflow. We also rejected building tabs and multi-document state to support it, because the Editor Workspace holds one active Markdown Document.

Status: accepted

## Consequences

- The shared application code declares the capability unavailable instead of assuming it. `useDesktop` keeps a fallback API and the panel renders only when the Runtime is desktop.
- Document Folder reads cross the renderer boundary as a Document Folder id plus a relative path. The main process resolves each one with `realpath` before use, because a renderer-supplied absolute path would let a compromised renderer read any file the user can read. The main process also allows modification checks for Markdown Documents opened through the system file dialog, restored from trusted last-opened state, or saved through the normal document flow. A path in a renderer-supplied Workspace Draft does not grant read access.
- The panel browses and opens only. Creating, renaming, deleting, and moving files stays out, so the main process gains no destructive file operations.
- Markdown Studio keeps no cache and no file watcher. A change to an open document on disk is found by comparing modification times when the window gains focus and before a save.

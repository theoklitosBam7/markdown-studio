# Navigator prototype

> **Prototype — not production integration.**

## Decision

Keep the **Navigator** design as the chosen Markdown Studio product surface for the next design phase.

Navigator combines:

- Editorial's document-first navigation structure.
- Focus's low-distraction writing canvas.
- A responsive mobile command dock.

This prototype answers the question: **Can Markdown Studio support future document navigation while keeping writing and Live Preview focused?**

## How to run

Start the web app with:

```bash
vpr dev
```

Open the root route:

```text
/
```

The prototype no longer uses a variant query or a design switcher. The route mounts Navigator directly.

## Large-screen design

- Show one primary **New Markdown Document** control in the document rail.
- Show the current Markdown Document and its saved or unsaved state in the rail.
- Keep document actions in the rail: open, save, examples, table insertion, copy, install, and PDF Export.
- Show the Editor Workspace breadcrumb and current-document tab in the top bar.
- Keep writing and Live Preview in the Focus canvas.
- Show the document outline in the navigation rail.
- Keep Command Palette, Find, HTML Export, theme, and Workspace View Mode controls in the canvas header or editor surfaces.

## Small-screen design

- Hide the desktop document rail.
- Show the current Markdown Document as the top identity and tab surface.
- Use the Focus canvas edge to edge.
- Keep commands in a horizontally scrollable bottom dock with touch-sized controls.
- Show the document outline as a full-screen inspector.
- Keep the theme toggle, Workspace View Mode, Find, Export, table insertion, examples, and document actions reachable without a desktop-only interaction.

## Existing functionality preserved

Navigator keeps the current Editor Workspace controller and real feature components. It preserves:

- Markdown editing and Workspace Draft behavior.
- Live Preview and Mermaid Embedded Diagram rendering.
- Source Navigation between the Markdown Document and Live Preview.
- Editor, split, and preview Workspace View Modes where available.
- Open and save document flows where available.
- HTML Export and PDF Export where available.
- Example Documents.
- Table insertion.
- Find and replace.
- Command Palette.
- Keyboard Shortcuts.
- Theme switching.
- Document outline navigation.
- PWA and update banners.

## Deliberate constraints

- Multiple Markdown Document tabs are not implemented yet.
- The current-document tab is display-only until tab state exists.
- Recent Markdown Documents are not implemented yet.
- The prototype does not define the final production component boundaries.
- The prototype remains close to the existing route so the design can be evaluated with real editor behavior.

## Follow-up design questions

1. Should Multiple Document Tabs live in the top bar, the document rail, or both?
2. Should Quick Open Recent Documents use a Command Palette command, a document switcher, or both?
3. Which document identity belongs in the breadcrumb when a Markdown Document has a saved file path?
4. Which commands should remain in the mobile dock, and which should move into a secondary action sheet?
5. How should the document rail behave when the viewport is narrow but not mobile?

Navigator is the visual reference for these decisions. Promote it to production only after the document model and interaction decisions are validated.

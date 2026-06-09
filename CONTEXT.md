# Markdown Studio

Markdown Studio is a Markdown editing context centered on authoring, previewing, and exporting Markdown documents across web and desktop surfaces.

## Language

**Markdown Document**:
User-authored Markdown content plus its document identity, such as a display name or saved file path.

**Command**:
A searchable user intention that invokes an existing **Editor Workspace** capability.
_Avoid_: action, handler, event

**Command Palette**:
A searchable **Editor Workspace** surface for discovering and invoking **Commands**.
_Avoid_: launcher, quick actions

**Document Identity**:
The name or saved file path Markdown Studio uses to recognize a **Markdown Document** across editing, saving, restoring, and exporting.
_Avoid_: display name, current path

**Embedded Diagram**:
A diagram authored inside a **Markdown Document** using a supported diagram syntax such as Mermaid.
_Avoid_: SVG, chart

**Editor Workspace**:
The active environment where a user edits a **Markdown Document** and moves between editing, previewing, restoring, and exporting.
_Avoid_: app shell, page

**Example Document**:
A bundled **Markdown Document** a user can load to explore Markdown Studio capabilities.
_Avoid_: fixture, sample data

**Export**:
The workflow that turns a **Markdown Document** into a portable **Rendered Markdown Document** outside the editor.
_Avoid_: download, save

**Live Preview**:
The interactive **Product Surface** that presents a **Rendered Markdown Document** alongside or instead of the editor while preserving source navigation.
_Avoid_: rendered HTML, preview pane

**Rendered Markdown Document**:
A prepared representation of a **Markdown Document** for a product surface such as live preview, HTML export, PDF export, or print.

**Product Surface**:
A user-facing destination where a **Rendered Markdown Document** is presented or exported.
_Avoid_: runtime, platform

**Runtime**:
The environment where Markdown Studio is running, either web or desktop.
_Avoid_: product surface

**Source Navigation**:
Movement between a position in a **Rendered Markdown Document** and the corresponding position in the source **Markdown Document**.
_Avoid_: source map

**Workspace Draft**:
Recoverable unsaved work for the current **Markdown Document**.
_Avoid_: autosave file, backup file

**Shortcut**:
A keyboard binding that invokes a capability in the **Editor Workspace**.
A **Shortcut** may or may not be attached to a **Command**.
_Avoid_: keybind, hotkey, accelerator

**Workspace View Mode**:
The way the **Editor Workspace** allocates attention between Markdown editing and the **Live Preview**.
_Avoid_: route, layout

## Relationships

- A **Markdown Document** may have a **Document Identity**.
- A **Command Palette** belongs to the **Editor Workspace**.
- A **Command** invokes an existing **Editor Workspace** capability.
- A **Markdown Document** can produce one or more **Rendered Markdown Documents**.
- A **Markdown Document** may contain zero or more **Embedded Diagrams**.
- An **Editor Workspace** has at most one active **Markdown Document**.
- An **Editor Workspace** may restore a **Workspace Draft**.
- An **Editor Workspace** can show a **Rendered Markdown Document** through the **Live Preview**.
- Loading an **Example Document** replaces the active **Markdown Document** in the **Editor Workspace**.
- An **Export** produces a **Rendered Markdown Document** for an export **Product Surface**.
- **Export** is distinct from saving a **Markdown Document**.
- A **Rendered Markdown Document** belongs to exactly one product surface.
- A **Rendered Markdown Document** presents each **Embedded Diagram** as rendered visual content when possible.
- An untitled **Markdown Document** has no saved file path but can still have a display name.
- The **Live Preview** is a **Product Surface**.
- The **Live Preview** can navigate back to source positions in the **Markdown Document**.
- A **Product Surface** can be available in one or more **Runtimes**.
- The **Live Preview** uses **Source Navigation** to move from rendered content back to Markdown source.
- **Source Navigation** depends on a **Rendered Markdown Document** preserving source positions.
- A **Workspace Draft** belongs to at most one **Markdown Document**.
- A **Workspace Draft** may exist without a saved file path.
- A **Workspace View Mode** can show only editing, only the **Live Preview**, or both side by side.
- Some **Workspace View Modes** may be unavailable in constrained viewports.

## Example dialogue

> **Dev:** "When the user exports to PDF, are we saving the **Markdown Document**?"
> **Domain expert:** "No. Saving preserves the **Markdown Document** and its **Document Identity**. **Export** produces a **Rendered Markdown Document** for the PDF **Product Surface**."
>
> **Dev:** "Does the desktop **Runtime** change the **Product Surface**?"
> **Domain expert:** "No. **Runtime** describes where Markdown Studio runs. **Product Surface** describes where the **Rendered Markdown Document** is presented or exported."
>
> **Dev:** "Can a **Workspace Draft** exist before the document has a file path?"
> **Domain expert:** "Yes. An untitled **Markdown Document** can still have recoverable unsaved work."

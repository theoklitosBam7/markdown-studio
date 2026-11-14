# Editor display preferences

Editor display settings change the source editor's font size, line height, word wrap, Tab width, and writing column. They do not change the Markdown Document, Live Preview, or Export output. The saved record is local to the current browser origin or desktop profile. The accepted composition Redo exception is tracked in [the history investigation](https://github.com/theoklitosBam7/markdown-studio/issues/143). Reproduce browser claims on the current build rather than relying on earlier Inbox reports.

## Sub-features

- `editor-display-entrypoints`: Desktop toolbar, mobile Appearance menu, and Command Palette open the same settings form.
- `editor-display-live-layout`: Valid changes reflow source text while keeping Find, line numbers, active-line highlighting, and Source Navigation aligned.
- `editor-display-persistence`: Defaults, reset, local persistence, and storage errors behave without changing unrelated preferences or document state.

## Preconditions

Follow the verification map's baseline. Use a mixed document with long wrapped paragraphs, empty lines, a trailing newline, literal tabs, Unicode, and a long unbroken URL or code line. Record its text and caret position before changing display settings.

Expected defaults are 16 px font size, 1.7 line-height ratio, word wrap on, Tab width 2, and an 80-character column. Character width is approximate; wide characters and tabs can occupy more than one character cell. On small or touch screens, the effective font has a 16 px floor. The floor must not replace a smaller saved value.

## Web drive with agent-browser

Start the web app using the main skill and capture actions and results in the run evidence directory. Use real pointer input for caret checks. Do not treat screenshots or matching CSS values as independent geometry proof.

### Entry points and live changes

- Open settings from the labelled desktop **Editor display** toolbar button. Record the form and its current values.
- Close it, then open **Editor display settings...** from the Command Palette. Confirm it is the same form and that typing in its fields does not invoke document Commands.
- Switch to preview-only mode and open settings from the Command Palette. Confirm settings remain available when Live Preview is the only visible pane.
- At a phone viewport, open **Editor display** in the mobile menu's Appearance group. Confirm it opens the mobile settings sheet. Test keyboard navigation, Escape, and close behavior without leaving focus in the hidden menu.
- Change font size, line height, wrapping, Tab width, and column width. Check the 40-, 80-, and 120-character widths and full width. Confirm each valid change applies immediately.
- Confirm the form explains that character width is approximate and that the settings affect source editing only. Check the displayed 16 px mobile floor while a saved value below 16 px stays below 16 px in storage.
- With a literal tab in the document, change Tab width and confirm its display changes without changing the document text. Press Tab at a caret and with a selection; confirm the configured number of spaces is inserted and the selected text is replaced. Confirm the caret position and undo behavior.
- Record document text, selection direction, dirty state, and undo history. Change preferences and confirm they remain unchanged. Change settings while the caret is away from the visible editor location and confirm the view does not jump to the caret.

### Geometry and editing

Use the same long mixed document with Find open. Test a match that crosses a soft-wrap boundary, then repeat with vertical and horizontal scrolling, a narrow column, a large font, and wide tabs.

- Compare Find highlight and source text positions. Click source text at the visible Find match and confirm the native textarea caret lands within the expected match. This pointer/caret check is independent of mirror coordinates.
- Click positions beside logical line numbers and confirm the native caret is on the corresponding source line. Include empty lines and the final empty line.
- Confirm each logical line has one number at its first visual row; continuation rows remain unnumbered. Confirm the active-line highlight covers all wrapped rows of the logical line.
- Use Find Next and Previous, Replace, Outline jumps, and Live Preview double-click Source Navigation. Confirm each selects or reveals the expected source range after reflow.
- Scroll the editor after wrapping and resizing. Confirm Live Preview follows the correct source block. Resize the pane and sidebar and repeat.
- Repeat with wrapping off and horizontal scrolling. Confirm the gutter stays fixed and Find highlighting moves with the source text.
- Change settings while Find, selection, and the editor are active. Confirm text, selection, focus, and dirty state remain unchanged. Verify pending Redo after ordinary numeric keyboard editing in the next step; composition input has the accepted exception recorded there. Confirm the textarea DOM instance is retained if the browser inspector is needed to diagnose a failure.
- Make a source edit with real keypresses, then Undo it to leave pending Redo. Type and commit a numeric display value using ordinary keyboard input, close settings, and Redo the source edit. Confirm it returns in both web and desktop; ordinary Undo/Redo after a new edit does not prove that pending Redo survives. This remains required.
- Record trusted, noncancelable composition input in a numeric display setting as a known accepted exception: it can clear pending source Redo, but it does not erase current document text. Do not require zero composition-related exceptions or claim that every IME composition causes this result. If composition is tested, record the browser, input method, event trust/cancelability, and exact outcome.
- Verify the Firefox scrolled-font source-block case separately from history. Wait for the native source scroll event before recording the Live Preview baseline. Firefox can deliver that event after Cypress `scrollTo` finishes. Compare the visible source block rather than exact scroll pixels; reflow can change the pixel position while retaining the block.
- Exercise an actual Tab insertion separately. It should change the document and be undoable; display changes should not.

Record measured coordinate differences and the tolerance used. If geometry does not align, report the exact setting combination and source positions. Do not mark the feature verified from visual inspection alone.

### Persistence and failures

Record `markdown-studio:editor-display-preferences` before and after each action. Also record the unrelated theme, Workspace Draft, split-ratio, and sidebar-width keys.

- Clear the editor-display key and reload. Confirm the five defaults appear and that startup does not write a record until the user changes or resets a preference.
- Change multiple values, reload the same origin, and confirm all committed values restore. Confirm the editor display key is the only unrelated-to-document preference key changed.
- Reset editor display. Confirm all five values return to defaults and the theme, Workspace Draft, split ratio, and sidebar width remain unchanged.
- In Cypress, make localStorage reads fail. Confirm the app starts with defaults and shows a storage warning. Make writes fail after a valid change; confirm the preference remains active for the session and the warning says it was not saved. Restore storage and retry; confirm the warning clears and the value persists after reload.
- Confirm a stored value below 16 px remains stored as requested when the effective mobile/touch font is 16 px. Return to a non-constrained viewport and confirm the requested size applies.
- Confirm another open tab does not live-sync settings. Do not interpret this as a failure; cross-tab sync is out of scope.

## Separate persistence checks

### Desktop profile restart

Web reload does not prove desktop persistence. Build with `vpr build:desktop`, then use a separate verification profile in the packaged app. Change all five values, fully quit the app, reopen it with the same profile, and confirm the values restore. Repeat Reset and confirm unrelated settings remain intact. Record the profile used and stored values. Do not claim restart persistence unless this exact quit/reopen check passes.

### npm launcher origin

The launcher keeps its random-port default. Start it with an explicit `--port`, change a display preference, stop it, and start it again with the same host and explicit port. Confirm the setting restores on that origin. A different port is a different origin and must not be described as sharing preferences.

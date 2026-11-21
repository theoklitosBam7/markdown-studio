# Command Palette and Find

The Command Palette is a searchable surface for invoking Commands. Ctrl+K or Cmd+K opens it when no overlay is open, typing filters the results, and arrow keys move the selection. Running the `Find` command closes the palette and opens the Find and Replace bar with its input focused.

## Sub-features

- `palette-open`: Ctrl+K opens the palette and focuses its input.
- `palette-filter`: Typing narrows the `.command-palette__option` buttons inside `.command-palette__results` to matching Commands.
- `palette-run`: Enter runs the highlighted Command and closes the palette.
- `arrow-navigation`: Arrow keys move the selection through long result lists and scroll the list.
- `find-bar`: The `Find` command opens `.find-replace-bar__input` focused.

## How to get to it (user POV)

- Press Ctrl+K or Cmd+K while the Editor Workspace is focused and no overlay is open.
- Type a fragment of a Command name, for example `find`.
- Press Enter to run the highlighted Command, or click a result.

## Web drive with agent-browser

Preconditions: baseline server, desktop viewport.

- Open and run Find:
  1. Click `.editor-pane textarea`, then `agent-browser press Control+k` to send a real key event.
  2. Assert `.command-palette__input` is focused.
  3. Fill the input with `find`, then press Enter.
  4. Wait for `.command-palette` to be removed, then assert the first `.find-replace-bar__input` is focused. The element is removed on the next render, so an immediate synchronous assertion can still see it.
- Filter: open the palette, count `.command-palette__option` buttons, type a fragment, and count again. The count must drop and stay above zero for a common fragment. `.command-palette__results` is the listbox container, not a result.
- Arrow navigation: open the palette, press Down at least a dozen times, then read `scrollTop` of `.command-palette__results`; it must be greater than zero once the selection passes the visible window. The selection skips disabled Commands and wraps.

## Gotchas

- The palette shortcut is Ctrl+K or Cmd+K as a real key event on a focused element. Clicking into the textarea first, then pressing the key, is the reliable order. An open overlay blocks the shortcut.
- Enter runs the top highlighted result. After typing `find`, Enter runs Find; do not add arrow presses in between unless the recipe tests navigation.
- The palette closes on run. Assertions on `.command-palette__results` after Enter fail by design; assert on the Find bar instead.

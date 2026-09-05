# Command Palette and Find

The Command Palette is a searchable surface for invoking Commands. Ctrl+K opens it, typing filters the results, and arrow keys move the selection. Running the `Find` command closes the palette and opens the Find and Replace bar with its input focused.

## Sub-features

- `palette-open`: Ctrl+K opens the palette and focuses its input.
- `palette-filter`: Typing narrows `.command-palette__results` to matching Commands.
- `palette-run`: Enter runs the highlighted Command and closes the palette.
- `arrow-navigation`: Arrow keys move the selection through long result lists and scroll the list.
- `find-bar`: The `Find` command opens `.find-replace-bar__input` focused.

## How to get to it (user POV)

- Press Ctrl+K anywhere in the Editor Workspace.
- Type a fragment of a Command name, for example `find`.
- Press Enter to run the highlighted Command, or click a result.

## Driving it with Playwright (browser MCP)

Preconditions: baseline server, desktop viewport.

- Open and run Find:
  1. `browser_press_key` Ctrl+K (or dispatch a `keydown` with `ctrlKey` and `key: 'k'` on the textarea).
  2. Assert `.command-palette__input` is focused.
  3. Type `find` then Enter.
  4. Assert `.command-palette` is gone and the first `.find-replace-bar__input` is focused.
- Filter: open the palette, type a fragment, count `.command-palette__results` entries before and after; the count must drop and stay above zero for a common fragment.
- Arrow navigation: open the palette, press Down at least a dozen times, read `scrollTop` of `.command-palette__results`; it must be greater than zero once the selection passes the visible window.

## Gotchas

- The palette shortcut is Ctrl+K as a real key event on a focused element. Clicking into the textarea first, then pressing the key, is the reliable order.
- Enter runs the top highlighted result. After typing `find`, Enter runs Find; do not add arrow presses in between unless the recipe tests navigation.
- The palette closes on run. Assertions on `.command-palette__results` after Enter fail by design; assert on the Find bar instead.

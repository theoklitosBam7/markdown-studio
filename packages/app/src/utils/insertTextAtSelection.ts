export function insertTextAtSelection(
  editor: HTMLTextAreaElement,
  text: string,
  fallbackStart: number,
  fallbackEnd: number,
): void {
  if (tryInsertTextWithBrowserEditing(editor, text)) {
    return
  }

  editor.setRangeText(text, fallbackStart, fallbackEnd, 'end')
  editor.dispatchEvent(new Event('input', { bubbles: true }))
}

function tryInsertTextWithBrowserEditing(editor: HTMLTextAreaElement, text: string): boolean {
  const browserDocument = editor.ownerDocument
  const execCommand = browserDocument.execCommand as
    | ((commandId: string, showUI?: boolean, value?: string) => boolean)
    | undefined

  if (typeof execCommand !== 'function') {
    return false
  }

  // Intentional web fallback: deprecated, but still the best-known browser path
  // for preserving native textarea undo history when programmatically inserting text.
  return execCommand.call(browserDocument, 'insertText', false, text)
}

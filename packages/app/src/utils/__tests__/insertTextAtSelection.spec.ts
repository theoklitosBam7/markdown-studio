import { describe, expect, it, vi } from 'vitest'

import { insertTextAtSelection } from '../insertTextAtSelection'

describe('insertTextAtSelection', () => {
  it('uses browser editing when execCommand is available', () => {
    const textarea = document.createElement('textarea')
    textarea.value = 'item one'
    textarea.setSelectionRange(0, 4)

    const execCommand = vi.fn((_command: string, _showUi?: boolean, value?: string) => {
      textarea.setRangeText(String(value), textarea.selectionStart, textarea.selectionEnd, 'end')
      textarea.dispatchEvent(new Event('input', { bubbles: true }))
      return true
    })

    Object.defineProperty(document, 'execCommand', {
      configurable: true,
      value: execCommand,
    })

    insertTextAtSelection(textarea, 'entry', 0, 4)

    expect(execCommand).toHaveBeenCalledWith('insertText', false, 'entry')
    expect(textarea.value).toBe('entry one')
  })

  it('falls back to setRangeText when execCommand is unavailable', () => {
    const textarea = document.createElement('textarea')
    textarea.value = 'item one'
    textarea.setSelectionRange(0, 4)

    Object.defineProperty(document, 'execCommand', {
      configurable: true,
      value: undefined,
    })

    insertTextAtSelection(textarea, 'entry', 0, 4)

    expect(textarea.value).toBe('entry one')
  })
})

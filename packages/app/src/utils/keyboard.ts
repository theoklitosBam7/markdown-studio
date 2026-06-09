export function isBareSingleChar(combo: string): boolean {
  return combo.length === 1
}

export function isEditableElement(element: Element | null): boolean {
  if (!element) return false
  const tag = element.tagName
  if (tag === 'INPUT' || tag === 'TEXTAREA') return true
  if ((element as HTMLElement).isContentEditable) return true
  return false
}

export function normalizeEvent(event: KeyboardEvent): string {
  const parts: string[] = []

  if (event.metaKey || event.ctrlKey) {
    parts.push('mod')
  }

  const key = event.key

  if (key.length === 1) {
    const isLetter = /[a-zA-Z]/.test(key)
    if (isLetter && event.shiftKey) {
      parts.push('shift')
      parts.push(key.toLowerCase())
    } else {
      parts.push(key.toLowerCase())
    }
  } else {
    if (event.shiftKey) {
      parts.push('shift')
    }
    parts.push(key.toLowerCase())
  }

  return parts.join('+')
}

export function normalizeKeys(keys: string[]): string {
  return keys.map((k) => k.toLowerCase()).join('+')
}

export function formatShortcutLabel(keys: string[], platform = getShortcutPlatform()): string {
  const isMac = platform === 'mac'

  return keys.map((key) => formatShortcutKey(key, isMac)).join(isMac ? '' : '+')
}

export function getShortcutPlatform(): 'mac' | 'other' {
  if (typeof navigator === 'undefined') {
    return 'other'
  }

  const platform = navigator.platform || ''
  return /mac|iphone|ipad|ipod/i.test(platform) ? 'mac' : 'other'
}

function formatShortcutKey(key: string, isMac: boolean): string {
  const normalizedKey = key.toLowerCase()

  if (normalizedKey === 'mod') {
    return isMac ? '⌘' : 'Ctrl'
  }

  if (normalizedKey === 'shift') {
    return isMac ? '⇧' : 'Shift'
  }

  if (normalizedKey === 'alt') {
    return isMac ? '⌥' : 'Alt'
  }

  if (normalizedKey === 'enter') {
    return isMac ? '↩' : 'Enter'
  }

  return key.length === 1 ? key.toUpperCase() : key
}

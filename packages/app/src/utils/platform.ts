import type { AppWindow } from '@/browser-window'

export function isDesktopEnvironment(): boolean {
  return typeof window !== 'undefined' && (window as AppWindow).desktop?.isDesktop === true
}

export function isSafeExternalUrl(value: string): boolean {
  try {
    const url = new URL(value)
    if (url.username !== '' || url.password !== '') {
      return false
    }

    return ['http:', 'https:', 'mailto:'].includes(url.protocol)
  } catch {
    return false
  }
}

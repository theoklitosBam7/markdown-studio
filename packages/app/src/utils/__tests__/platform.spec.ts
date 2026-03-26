import { afterEach, describe, expect, it } from 'vitest'

import type { AppWindow } from '../../browser-window'

import { isDesktopEnvironment, isSafeExternalUrl } from '../platform'

const desktopBridgeMock = {
  commands: {
    onAppCommand: () => () => undefined,
  },
  documents: {
    open: async () => null,
    save: async () => null,
    saveAs: async () => null,
  },
  isDesktop: true,
  shell: {
    openExternal: async () => undefined,
  },
}

describe('isSafeExternalUrl', () => {
  it('accepts supported external URLs without embedded credentials', () => {
    expect(isSafeExternalUrl('https://example.com/path')).toBe(true)
    expect(isSafeExternalUrl('mailto:hello@example.com')).toBe(true)
  })

  it('rejects URLs with embedded credentials', () => {
    expect(isSafeExternalUrl('http://user:pass@example.com')).toBe(false)
    expect(isSafeExternalUrl('https://user@example.com')).toBe(false)
  })

  it('rejects unsupported protocols and invalid URLs', () => {
    expect(isSafeExternalUrl('file:///tmp/test.md')).toBe(false)
    expect(isSafeExternalUrl('not a url')).toBe(false)
  })
})

describe('isDesktopEnvironment', () => {
  const appWindow = window as AppWindow
  const originalDesktop = appWindow.desktop
  const originalLocation = window.location

  afterEach(() => {
    appWindow.desktop = originalDesktop
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: originalLocation,
    })
  })

  it('requires the explicit desktop bridge', () => {
    appWindow.desktop = undefined
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { protocol: 'file:' },
    })

    expect(isDesktopEnvironment()).toBe(false)
  })

  it('returns true when the desktop bridge marks the app as desktop', () => {
    appWindow.desktop = desktopBridgeMock

    expect(isDesktopEnvironment()).toBe(true)
  })
})

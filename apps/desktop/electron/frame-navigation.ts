export interface FrameNavigationDetails {
  isMainFrame: boolean
  preventDefault: () => void
  url: string
}

interface FrameNavigationEventSource {
  on(event: 'will-frame-navigate', listener: (details: FrameNavigationDetails) => void): unknown
}

export function isAllowedFrameNavigation(url: string, isMainFrame: boolean): boolean {
  if (isMainFrame) return true

  try {
    const parsed = new URL(url)
    return (
      parsed.protocol === 'about:' && (parsed.pathname === 'blank' || parsed.pathname === 'srcdoc')
    )
  } catch {
    return false
  }
}

export function registerFrameNavigationGuard(webContents: FrameNavigationEventSource): void {
  webContents.on('will-frame-navigate', (details) => {
    if (isAllowedFrameNavigation(details.url, details.isMainFrame)) return

    details.preventDefault()
  })
}

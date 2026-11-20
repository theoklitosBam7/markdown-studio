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

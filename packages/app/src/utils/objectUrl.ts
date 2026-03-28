const OBJECT_URL_REVOCATION_DELAY_MS = 1000

export function revokeObjectUrlLater(url: string): void {
  window.setTimeout(() => {
    URL.revokeObjectURL(url)
  }, OBJECT_URL_REVOCATION_DELAY_MS)
}

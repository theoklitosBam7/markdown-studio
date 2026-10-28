import type { Theme } from '@/types/editor'

export function useThemeTransition() {
  async function transitionTheme(theme: Theme, applyTheme: (theme: Theme) => void): Promise<void> {
    if (typeof document === 'undefined' || typeof window === 'undefined') {
      applyTheme(theme)
      return
    }

    document.documentElement.classList.add('theme-transitioning')
    applyTheme(theme)

    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        document.documentElement.classList.remove('theme-transitioning')
      })
    })
  }

  return { transitionTheme }
}

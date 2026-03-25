import type { DeepReadonly, ShallowRef } from 'vue'

import { readonly, shallowRef, watch } from 'vue'

import type { Theme } from '@/features/markdown/types'

const THEME_STORAGE_KEY = 'markdown-studio-theme'

function getStoredTheme(): Theme {
  if (typeof window === 'undefined') return 'light'

  const stored = localStorage.getItem(THEME_STORAGE_KEY)
  return stored === 'dark' || stored === 'light' ? stored : 'light'
}

const _theme = shallowRef<Theme>(getStoredTheme())

// Persist the shared theme value once for the whole module.
watch(_theme, (newTheme) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(THEME_STORAGE_KEY, newTheme)
  }
})

interface UseThemeReturn {
  setTheme: (theme: Theme) => void
  theme: DeepReadonly<ShallowRef<Theme>>
  toggleTheme: () => void
}

export function useTheme(): UseThemeReturn {
  function toggleTheme(): void {
    _theme.value = _theme.value === 'light' ? 'dark' : 'light'
  }

  function setTheme(theme: Theme): void {
    _theme.value = theme
  }

  return {
    setTheme,
    theme: readonly(_theme),
    toggleTheme,
  }
}

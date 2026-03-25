import type { Theme } from '@/features/markdown/types'

export interface ThemeTransitionOrigin {
  x: number
  y: number
}

interface ThemeTransitionOptions {
  origin?: ThemeTransitionOrigin
}

export function useThemeTransition() {
  async function transitionTheme(
    theme: Theme,
    applyTheme: (theme: Theme) => void,
    options: ThemeTransitionOptions = {},
  ): Promise<void> {
    if (typeof document === 'undefined' || typeof window === 'undefined') {
      applyTheme(theme)
      return
    }

    const startViewTransition = document.startViewTransition?.bind(document)

    if (!startViewTransition || shouldReduceMotion()) {
      applyTheme(theme)
      return
    }

    const origin = options.origin ?? getDefaultOrigin()
    const radius = getRevealRadius(origin)

    document.documentElement.classList.add('theme-transitioning')

    try {
      const transition = startViewTransition(() => {
        applyTheme(theme)
      })

      await transition.ready

      document.documentElement
        .animate(
          {
            clipPath: [
              `circle(0px at ${origin.x}px ${origin.y}px)`,
              `circle(${radius}px at ${origin.x}px ${origin.y}px)`,
            ],
          },
          {
            duration: 700,
            easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
            pseudoElement: '::view-transition-new(root)',
          },
        )
        .finished.catch(() => undefined)
    } finally {
      window.setTimeout(() => {
        document.documentElement.classList.remove('theme-transitioning')
      }, 750)
    }
  }

  return { transitionTheme }
}

function getDefaultOrigin(): ThemeTransitionOrigin {
  return {
    x: window.innerWidth - 56,
    y: 56,
  }
}

function getRevealRadius(origin: ThemeTransitionOrigin): number {
  return Math.hypot(
    Math.max(origin.x, window.innerWidth - origin.x),
    Math.max(origin.y, window.innerHeight - origin.y),
  )
}

function shouldReduceMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

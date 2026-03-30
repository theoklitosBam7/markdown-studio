import { onMounted, readonly, shallowRef } from 'vue'

import type { AppWindow, MarkdownStudioPwaState } from '@/browser-window'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

interface RegisterPwaServiceWorkerInput {
  register: (options: RegisterPwaServiceWorkerOptions) => (reloadPage?: boolean) => Promise<void>
}

interface RegisterPwaServiceWorkerOptions {
  onNeedRefresh: () => void
  onOfflineReady: () => void
}

let testState: MarkdownStudioPwaState | null = null

export function registerPwaServiceWorker(input: RegisterPwaServiceWorkerInput): void {
  if (typeof window === 'undefined') {
    return
  }

  ensureListeners()
  const state = getPwaState()

  state.updateServiceWorker.value = input.register({
    onNeedRefresh() {
      state.needRefresh.value = true
      state.offlineReady.value = false
    },
    onOfflineReady() {
      state.offlineReady.value = true
    },
  })
}

export function resetPwaStateForTests(): void {
  const state = getPwaState()

  if (state.listenersAttached && typeof window !== 'undefined') {
    window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.removeEventListener('appinstalled', handleAppInstalled)
    state.listenersAttached = false
  }

  state.canInstall.value = false
  state.isInstalled.value = false
  state.needRefresh.value = false
  state.offlineReady.value = false
  state.promptEvent.value = null
  state.updateServiceWorker.value = null
}

export function usePwa() {
  onMounted(() => {
    ensureListeners()
    syncInstallAvailability()
  })

  async function install(): Promise<void> {
    const state = getPwaState()
    const event = state.promptEvent.value as BeforeInstallPromptEvent | null

    if (!event) {
      return
    }

    try {
      await event.prompt()
      const choice = await event.userChoice

      if (choice.outcome === 'accepted') {
        state.promptEvent.value = null
      }

      syncInstallAvailability()
    } catch {
      // Reset state if prompt fails (e.g., user dismissed or prompt already showing)
      syncInstallAvailability()
      throw new Error('Failed to show install prompt')
    }
  }

  async function updateApp(): Promise<void> {
    const state = getPwaState()

    if (!state.updateServiceWorker.value) {
      return
    }

    await state.updateServiceWorker.value(true)
    state.needRefresh.value = false
  }

  function dismissOfflineReady(): void {
    getPwaState().offlineReady.value = false
  }

  function dismissRefreshPrompt(): void {
    getPwaState().needRefresh.value = false
  }

  const state = getPwaState()

  return {
    canInstall: readonly(state.canInstall),
    dismissOfflineReady,
    dismissRefreshPrompt,
    install,
    isInstalled: readonly(state.isInstalled),
    needRefresh: readonly(state.needRefresh),
    offlineReady: readonly(state.offlineReady),
    updateApp,
  }
}

function createPwaState(): MarkdownStudioPwaState {
  return {
    canInstall: shallowRef(false),
    isInstalled: shallowRef(false),
    listenersAttached: false,
    needRefresh: shallowRef(false),
    offlineReady: shallowRef(false),
    promptEvent: shallowRef<Event | null>(null),
    updateServiceWorker: shallowRef<((reloadPage?: boolean) => Promise<void>) | null>(null),
  }
}

function ensureListeners(): void {
  if (typeof window === 'undefined') {
    return
  }

  const state = getPwaState()
  if (state.listenersAttached) {
    return
  }

  syncInstallAvailability()
  window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
  window.addEventListener('appinstalled', handleAppInstalled)
  state.listenersAttached = true
}

function getPwaState(): MarkdownStudioPwaState {
  if (typeof window === 'undefined') {
    testState ??= createPwaState()
    return testState
  }

  const browserWindow = window as AppWindow
  browserWindow.__MARKDOWN_STUDIO_PWA_STATE__ ??= createPwaState()
  return browserWindow.__MARKDOWN_STUDIO_PWA_STATE__
}

function handleAppInstalled(): void {
  const state = getPwaState()

  state.promptEvent.value = null
  state.isInstalled.value = true
  state.canInstall.value = false
}

function handleBeforeInstallPrompt(event: Event): void {
  event.preventDefault()
  getPwaState().promptEvent.value = event
  syncInstallAvailability()
}

function isStandaloneDisplayMode(): boolean {
  if (typeof window === 'undefined') {
    return false
  }

  const supportsMatchMedia = typeof window.matchMedia === 'function'

  return (
    (supportsMatchMedia && window.matchMedia('(display-mode: standalone)').matches) ||
    (window.navigator as { standalone?: boolean } & Navigator).standalone === true
  )
}

function syncInstallAvailability(): void {
  const state = getPwaState()

  state.isInstalled.value = isStandaloneDisplayMode()
  state.canInstall.value = !state.isInstalled.value && state.promptEvent.value !== null
}

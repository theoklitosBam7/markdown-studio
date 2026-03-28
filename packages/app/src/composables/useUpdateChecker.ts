import { computed, readonly, shallowRef } from 'vue'

import { useDesktop } from '@/composables/useDesktop'
import { compareSemver } from '@/utils/semver'

export type ManualCheckStatus = 'checking' | 'idle' | 'up-to-date'

export interface UpdateInfo {
  currentVersion: string
  latestVersion: string
  releaseUrl: string
}

const DISMISSED_KEY = 'update-banner-dismissed'
const LAST_CHECK_KEY = 'update-last-check'
const UP_TO_DATE_DISPLAY_MS = 7000
const CHECK_INTERVAL_MS = 24 * 60 * 60 * 1000
const INITIAL_DELAY_MS = 5000

const RELEASES_URL = 'https://api.github.com/repos/theoklitosBam7/markdown-studio/releases/latest'

export function useUpdateChecker() {
  const desktop = useDesktop()
  const updateInfo = shallowRef<null | UpdateInfo>(null)
  const isDismissed = shallowRef(false)
  const manualCheckStatus = shallowRef<ManualCheckStatus>('idle')

  let upToDateTimeoutId: ReturnType<typeof setTimeout> | undefined
  let timeoutId: ReturnType<typeof setTimeout> | undefined
  let intervalId: ReturnType<typeof setInterval> | undefined

  function readLastCheck(): number {
    if (typeof localStorage === 'undefined') return 0
    const raw = localStorage.getItem(LAST_CHECK_KEY)
    return raw ? Number(raw) : 0
  }

  function writeLastCheck(timestamp: number): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(LAST_CHECK_KEY, String(timestamp))
    }
  }

  if (typeof sessionStorage !== 'undefined') {
    if (sessionStorage.getItem(DISMISSED_KEY) === 'true') {
      isDismissed.value = true
    }
  }

  async function fetchLatestRelease(): Promise<{ html_url: string; tag_name: string } | null> {
    const response = await fetch(RELEASES_URL, {
      headers: { Accept: 'application/vnd.github+json' },
    })
    if (!response.ok) return null
    return response.json()
  }

  function clearUpToDateTimer(): void {
    if (upToDateTimeoutId !== undefined) {
      clearTimeout(upToDateTimeoutId)
      upToDateTimeoutId = undefined
    }
  }

  async function checkForUpdate(): Promise<void> {
    if (!desktop.value.isDesktop) return
    if (typeof __APP_VERSION__ === 'undefined') return
    if (isDismissed.value) return

    try {
      const data = await fetchLatestRelease()
      if (!data) return

      const latestVersion = data.tag_name

      if (compareSemver(__APP_VERSION__, latestVersion) < 0) {
        updateInfo.value = {
          currentVersion: __APP_VERSION__,
          latestVersion,
          releaseUrl: data.html_url,
        }
      } else {
        updateInfo.value = null
      }

      writeLastCheck(Date.now())
    } catch {
      // Update checks should never disrupt the user
    }
  }

  async function checkNow(): Promise<void> {
    if (!desktop.value.isDesktop) return
    if (typeof __APP_VERSION__ === 'undefined') return
    if (manualCheckStatus.value === 'checking') return

    clearUpToDateTimer()
    manualCheckStatus.value = 'checking'

    // Reset dismissed state so banner can reappear if update found
    isDismissed.value = false
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem(DISMISSED_KEY)
    }

    try {
      const data = await fetchLatestRelease()
      if (!data) {
        manualCheckStatus.value = 'idle'
        return
      }

      const latestVersion = data.tag_name

      writeLastCheck(Date.now())

      if (compareSemver(__APP_VERSION__, latestVersion) < 0) {
        updateInfo.value = {
          currentVersion: __APP_VERSION__,
          latestVersion,
          releaseUrl: data.html_url,
        }
        manualCheckStatus.value = 'idle'
      } else {
        updateInfo.value = null
        manualCheckStatus.value = 'up-to-date'
        upToDateTimeoutId = setTimeout(() => {
          manualCheckStatus.value = 'idle'
        }, UP_TO_DATE_DISPLAY_MS)
      }
    } catch {
      manualCheckStatus.value = 'idle'
    }
  }

  function dismiss(): void {
    isDismissed.value = true
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem(DISMISSED_KEY, 'true')
    }
  }

  function download(): void {
    if (updateInfo.value) {
      void desktop.value.shell.openExternal(updateInfo.value.releaseUrl)
    }
  }

  function startChecking(): void {
    const elapsed = Date.now() - readLastCheck()
    const remaining = Math.max(0, CHECK_INTERVAL_MS - elapsed)
    const firstCheck = remaining === 0 ? INITIAL_DELAY_MS : remaining + INITIAL_DELAY_MS

    timeoutId = setTimeout(() => {
      void checkForUpdate()
    }, firstCheck)

    intervalId = setInterval(() => {
      void checkForUpdate()
    }, CHECK_INTERVAL_MS)
  }

  function stopChecking(): void {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId)
      timeoutId = undefined
    }
    if (intervalId !== undefined) {
      clearInterval(intervalId)
      intervalId = undefined
    }
    clearUpToDateTimer()
  }

  const updateAvailable = computed(() => updateInfo.value !== null && !isDismissed.value)
  const showBanner = computed(
    () => updateAvailable.value || manualCheckStatus.value === 'up-to-date',
  )

  return {
    checkNow,
    dismiss,
    download,
    manualCheckStatus: readonly(manualCheckStatus),
    showBanner,
    startChecking,
    stopChecking,
    updateAvailable,
    updateInfo: readonly(updateInfo),
  }
}

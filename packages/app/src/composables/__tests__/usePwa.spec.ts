import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent } from 'vue'

import { registerPwaServiceWorker, resetPwaStateForTests, usePwa } from '../usePwa'

class MockBeforeInstallPromptEvent extends Event {
  prompt = vi.fn(async () => undefined)
  userChoice = Promise.resolve({
    outcome: 'accepted' as const,
    platform: 'web',
  })
}

function mountHarness() {
  return mount(
    defineComponent({
      setup() {
        return usePwa()
      },
      template: '<div />',
    }),
  )
}

describe('usePwa', () => {
  beforeEach(() => {
    resetPwaStateForTests()
  })

  afterEach(() => {
    resetPwaStateForTests()
    document.body.innerHTML = ''
    vi.restoreAllMocks()
  })

  it('tracks install availability from browser events', async () => {
    const wrapper = mountHarness()

    expect(wrapper.vm.canInstall).toBe(false)

    window.dispatchEvent(new MockBeforeInstallPromptEvent('beforeinstallprompt'))
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.canInstall).toBe(true)

    window.dispatchEvent(new Event('appinstalled'))
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.canInstall).toBe(false)
    expect(wrapper.vm.isInstalled).toBe(true)
  })

  it('prompts for installation when requested', async () => {
    const wrapper = mountHarness()
    const event = new MockBeforeInstallPromptEvent('beforeinstallprompt')

    window.dispatchEvent(event)
    await wrapper.vm.$nextTick()
    await wrapper.vm.install()

    expect(event.prompt).toHaveBeenCalledTimes(1)
    expect(wrapper.vm.canInstall).toBe(false)
  })

  it('surfaces offline ready and refresh states from the service worker', async () => {
    const updateMock = vi.fn(async () => undefined)
    let callbacks:
      | {
          onNeedRefresh: () => void
          onOfflineReady: () => void
        }
      | undefined

    registerPwaServiceWorker({
      register(options) {
        callbacks = options
        return updateMock
      },
    })

    const wrapper = mountHarness()

    expect(callbacks).toBeDefined()
    callbacks!.onOfflineReady()
    await wrapper.vm.$nextTick()
    expect(wrapper.vm.offlineReady).toBe(true)

    expect(callbacks).toBeDefined()
    callbacks!.onNeedRefresh()
    await wrapper.vm.$nextTick()
    expect(wrapper.vm.needRefresh).toBe(true)
    expect(wrapper.vm.offlineReady).toBe(false)

    await wrapper.vm.updateApp()
    expect(updateMock).toHaveBeenCalledWith(true)
  })

  it('keeps install availability after the composable is remounted', async () => {
    const firstWrapper = mountHarness()

    window.dispatchEvent(new MockBeforeInstallPromptEvent('beforeinstallprompt'))
    await firstWrapper.vm.$nextTick()
    expect(firstWrapper.vm.canInstall).toBe(true)

    firstWrapper.unmount()

    const secondWrapper = mountHarness()
    await secondWrapper.vm.$nextTick()

    expect(secondWrapper.vm.canInstall).toBe(true)
  })
})

import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'

import UpdateBanner from '../UpdateBanner.vue'

const upgradeCommand = 'brew upgrade --cask theoklitosBam7/tap/markdown-studio'

describe('UpdateBanner', () => {
  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('shows a copyable Homebrew upgrade command instead of direct download', async () => {
    const writeText = vi.fn(async () => undefined)
    Object.assign(navigator, {
      clipboard: {
        writeText,
      },
    })

    const wrapper = mount(UpdateBanner, {
      props: {
        currentVersion: '0.6.0',
        homebrewUpgradeCommand: upgradeCommand,
        isHomebrewInstall: true,
        latestVersion: '0.7.0',
        status: 'update-available',
      },
    })

    expect(wrapper.get('.update-banner__command').text()).toBe(upgradeCommand)
    expect(wrapper.find('.update-banner__download-btn').exists()).toBe(false)

    await wrapper.get('.update-banner__copy-btn').trigger('click')

    expect(writeText).toHaveBeenCalledWith(upgradeCommand)
    expect(wrapper.get('.update-banner__copy-btn').text()).toBe('Copied!')
  })

  it('shows direct download for non-Homebrew installs', () => {
    const wrapper = mount(UpdateBanner, {
      props: {
        currentVersion: '0.6.0',
        isHomebrewInstall: false,
        latestVersion: '0.7.0',
        status: 'update-available',
      },
    })

    expect(wrapper.find('.update-banner__command').exists()).toBe(false)
    expect(wrapper.get('.update-banner__download-btn').text()).toBe('Download')
  })

  it('clears the copy feedback timer on unmount', async () => {
    vi.useFakeTimers()
    vi.spyOn(globalThis, 'clearTimeout')
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn(async () => undefined),
      },
    })

    const wrapper = mount(UpdateBanner, {
      props: {
        homebrewUpgradeCommand: upgradeCommand,
        isHomebrewInstall: true,
        status: 'update-available',
      },
    })

    await wrapper.get('.update-banner__copy-btn').trigger('click')
    wrapper.unmount()

    expect(clearTimeout).toHaveBeenCalled()
  })
})

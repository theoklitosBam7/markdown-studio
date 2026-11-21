import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test'

import type { AppWindow } from '@/browser-window'

import HtmlPreviewSurface from '../HtmlPreviewSurface.vue'

const firstGrant = {
  assetBaseUrl: 'markdown-studio-preview://local/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa/',
  grantId: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
}
const secondGrant = {
  assetBaseUrl: 'markdown-studio-preview://local/bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb/',
  grantId: 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
}

const requestAssetGrant = vi.fn()
const releaseAssetGrant = vi.fn()

enableAutoUnmount(afterEach)

function mountSurface(): ReturnType<typeof mount> {
  return mount(HtmlPreviewSurface, {
    props: {
      content: '<link rel="stylesheet" href="site.css">',
      documentPath: '/reports/first.html',
    },
  })
}

describe('HtmlPreviewSurface script opt-in', () => {
  const appWindow = window as AppWindow
  const originalDesktop = appWindow.desktop

  beforeEach(() => {
    appWindow.desktop = { isDesktop: true } as AppWindow['desktop']
  })

  afterEach(() => {
    appWindow.desktop = originalDesktop
  })

  it('keeps scripts blocked in the web runtime without an opt-in control', () => {
    appWindow.desktop = undefined
    const wrapper = mountSurface()

    expect(wrapper.find('button').exists()).toBe(false)
    expect(wrapper.get('iframe').attributes('sandbox')).toBe('')
    expect(wrapper.get('iframe').attributes('srcdoc')).not.toContain('<script')
  })

  it('starts with scripts blocked and exposes an accessible opt-in control', () => {
    const wrapper = mountSurface()
    const toggle = wrapper.get('button')
    const frame = wrapper.get('iframe')

    expect(toggle.text()).toBe('Enable scripts for this preview')
    expect(toggle.attributes('aria-pressed')).toBe('false')
    expect(frame.attributes('sandbox')).toBe('')
    expect(frame.attributes('srcdoc')).not.toContain('<script')
  })

  it('shows the enabled state and prepares a script-enabled preview', async () => {
    const wrapper = mount(HtmlPreviewSurface, {
      props: {
        content: '<script>document.body.dataset.scriptRan = "yes"</script>',
        documentPath: '/reports/first.html',
      },
    })
    const toggle = wrapper.get('button')

    await toggle.trigger('click')

    const frame = wrapper.get('iframe')
    const status = wrapper.find('[role="status"]')

    expect(toggle.attributes('aria-pressed')).toBe('true')
    expect(status.text()).toBe('Scripts enabled for this preview')
    expect(frame.attributes('sandbox')).toBe('allow-scripts')
    expect(frame.attributes('srcdoc')).toContain('document.body.dataset.scriptRan')
    expect(frame.attributes('srcdoc')).toContain(
      "script-src 'unsafe-inline' markdown-studio-preview:",
    )
  })

  it('disables scripts when the toggle is pressed again', async () => {
    const wrapper = mountSurface()
    const toggle = wrapper.get('button')

    await toggle.trigger('click')

    expect(toggle.text()).toBe('Disable scripts for this preview')
    expect(toggle.attributes('aria-pressed')).toBe('true')
    expect(wrapper.get('iframe').attributes('sandbox')).toBe('allow-scripts')

    await toggle.trigger('click')

    expect(toggle.text()).toBe('Enable scripts for this preview')
    expect(toggle.attributes('aria-pressed')).toBe('false')
    expect(wrapper.find('[role="status"]').exists()).toBe(false)
    expect(wrapper.get('iframe').attributes('sandbox')).toBe('')
    expect(wrapper.get('iframe').attributes('srcdoc')).not.toContain('<script')
  })

  it('resets the opt-in when another HTML Document becomes active', async () => {
    const wrapper = mountSurface()
    await wrapper.get('button').trigger('click')

    expect(wrapper.get('iframe').attributes('sandbox')).toBe('allow-scripts')

    await wrapper.setProps({
      content: '<p>Second report</p>',
      documentPath: '/reports/second.html',
    })

    expect(wrapper.get('button').attributes('aria-pressed')).toBe('false')
    expect(wrapper.find('[role="status"]').exists()).toBe(false)
    expect(wrapper.get('iframe').attributes('sandbox')).toBe('')
  })
})

describe('HtmlPreviewSurface asset grants', () => {
  const appWindow = window as AppWindow
  const originalDesktop = appWindow.desktop

  beforeEach(() => {
    requestAssetGrant.mockReset()
    requestAssetGrant.mockResolvedValue(firstGrant)
    releaseAssetGrant.mockReset()
    releaseAssetGrant.mockResolvedValue(undefined)
    appWindow.desktop = {
      htmlPreview: { releaseAssetGrant, requestAssetGrant },
      isDesktop: true,
    } as unknown as AppWindow['desktop']
  })

  afterEach(() => {
    appWindow.desktop = originalDesktop
  })

  it('requests a desktop grant and rewrites relative assets through it', async () => {
    const wrapper = mountSurface()
    await flushPromises()

    expect(requestAssetGrant).toHaveBeenCalledWith({ documentPath: '/reports/first.html' })
    expect(wrapper.get('iframe').attributes('srcdoc')).toContain(
      `${firstGrant.assetBaseUrl}site.css`,
    )
  })

  it('releases the old grant when a different HTML Document becomes active', async () => {
    requestAssetGrant.mockResolvedValueOnce(firstGrant).mockResolvedValueOnce(secondGrant)
    const wrapper = mountSurface()
    await flushPromises()

    await wrapper.setProps({
      content: '<img src="logo.png">',
      documentPath: '/reports/second.html',
    })
    await flushPromises()

    expect(releaseAssetGrant).toHaveBeenCalledWith(firstGrant.grantId)
    expect(wrapper.get('iframe').attributes('srcdoc')).toContain(
      `${secondGrant.assetBaseUrl}logo.png`,
    )
  })

  it('releases the active grant when the HTML Preview closes', async () => {
    const wrapper = mountSurface()
    await flushPromises()

    wrapper.unmount()
    await flushPromises()

    expect(releaseAssetGrant).toHaveBeenCalledWith(firstGrant.grantId)
  })

  it('does not request assets in the web runtime', async () => {
    appWindow.desktop = {
      htmlPreview: { releaseAssetGrant, requestAssetGrant },
      isDesktop: false,
    } as unknown as AppWindow['desktop']

    const wrapper = mountSurface()
    await flushPromises()

    expect(requestAssetGrant).not.toHaveBeenCalled()
    expect(wrapper.get('iframe').attributes('srcdoc')).toContain('href="site.css"')
  })

  it('shows a visible error when grant request fails', async () => {
    requestAssetGrant.mockRejectedValueOnce(new Error('Grant denied'))
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)

    const wrapper = mountSurface()
    await flushPromises()

    expect(wrapper.get('.html-preview__notice').text()).toContain('Local assets')
    expect(wrapper.get('.html-preview__notice').attributes('role')).toBe('alert')
    expect(consoleErrorSpy).not.toHaveBeenCalled()

    consoleErrorSpy.mockRestore()
  })

  it('shows a visible error when grant release fails', async () => {
    requestAssetGrant.mockResolvedValueOnce(firstGrant).mockResolvedValueOnce(secondGrant)
    releaseAssetGrant.mockRejectedValueOnce(new Error('Release denied'))
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const wrapper = mountSurface()
    await flushPromises()

    await wrapper.setProps({ documentPath: '/reports/second.html' })
    await flushPromises()

    expect(releaseAssetGrant).toHaveBeenCalledWith(firstGrant.grantId)
    expect(wrapper.get('.html-preview__notice').text()).toContain('Local assets')
    expect(consoleErrorSpy).not.toHaveBeenCalled()

    consoleErrorSpy.mockRestore()
  })
})

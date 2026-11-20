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
})

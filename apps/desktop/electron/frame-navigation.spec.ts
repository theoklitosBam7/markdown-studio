import { describe, expect, it } from 'vite-plus/test'

import { isAllowedFrameNavigation } from './frame-navigation'

describe('isAllowedFrameNavigation', () => {
  it('allows the main frame to navigate through the existing main-frame guard', () => {
    expect(isAllowedFrameNavigation('https://example.com/page', true)).toBe(true)
  })

  it('allows the blank and srcdoc documents used to start a preview', () => {
    expect(isAllowedFrameNavigation('about:blank', false)).toBe(true)
    expect(isAllowedFrameNavigation('about:srcdoc', false)).toBe(true)
  })

  it('blocks a subframe from navigating to an external URL', () => {
    expect(isAllowedFrameNavigation('https://frame-navigation.invalid/destination', false)).toBe(
      false,
    )
  })

  it('blocks a subframe from navigating to file or preview asset URLs', () => {
    expect(isAllowedFrameNavigation('file:///tmp/page.html', false)).toBe(false)
    expect(isAllowedFrameNavigation('markdown-studio-preview://local/grant/site.css', false)).toBe(
      false,
    )
  })

  it('blocks an unparsable navigation URL', () => {
    expect(isAllowedFrameNavigation('', false)).toBe(false)
  })
})

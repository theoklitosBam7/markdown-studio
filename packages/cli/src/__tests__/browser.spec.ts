// @vitest-environment node

import { afterEach, describe, expect, it, vi } from 'vitest'

const spawnMock = vi.hoisted(() => vi.fn())

vi.mock('node:child_process', () => ({
  spawn: spawnMock,
}))

import { openBrowser } from '../browser'

const originalPlatform = Object.getOwnPropertyDescriptor(process, 'platform')

afterEach(() => {
  if (originalPlatform) {
    Object.defineProperty(process, 'platform', originalPlatform)
  }

  spawnMock.mockReset()
})

describe('openBrowser', () => {
  it('escapes Windows cmd metacharacters in the opened URL', async () => {
    Object.defineProperty(process, 'platform', {
      configurable: true,
      value: 'win32',
    })

    spawnMock.mockImplementation((_file, _args, _options) => {
      const child = {
        unref: vi.fn(),
      }

      return {
        on(event: string, handler: () => void) {
          if (event === 'spawn') {
            handler()
          }

          return child
        },
        unref: child.unref,
      }
    })

    await openBrowser('https://example.com/?a=1&b=2%25')

    expect(spawnMock).toHaveBeenCalledWith(
      'cmd',
      ['/c', 'start', '', 'https://example.com/?a=1^&b=2%%25'],
      {
        detached: false,
        stdio: 'ignore',
      },
    )
  })

  it('rejects unsupported URL protocols', async () => {
    Object.defineProperty(process, 'platform', {
      configurable: true,
      value: 'win32',
    })

    await expect(openBrowser('javascript:alert(1)')).rejects.toThrow(
      'Unsupported browser URL protocol: javascript:',
    )
    expect(spawnMock).not.toHaveBeenCalled()
  })

  it('rejects malformed URLs', async () => {
    Object.defineProperty(process, 'platform', {
      configurable: true,
      value: 'win32',
    })

    await expect(openBrowser('not a url')).rejects.toThrow('Invalid browser URL: not a url')
    expect(spawnMock).not.toHaveBeenCalled()
  })
})

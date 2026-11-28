import { beforeAll, describe, expect, it, vi } from 'vite-plus/test'

// Mermaid needs a real layout engine, which jsdom does not have.
vi.mock('mermaid', () => ({
  default: {
    initialize: vi.fn(),
    render: vi.fn(async () => ({ svg: '<svg></svg>' })),
  },
}))

const writeText = vi.fn<(text: string) => Promise<void>>()

beforeAll(async () => {
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: { writeText },
  })
  document.body.innerHTML = '<div id="landing"></div>'
  await import('../main')
})

describe('copy command buttons', () => {
  it('announces the copy and keeps the command visible on the button', async () => {
    writeText.mockResolvedValue(undefined)
    const button = document.querySelector<HTMLButtonElement>('[data-action="copy-npm"]')
    const status = document.querySelector('[role="status"]')

    button?.click()

    await vi.waitFor(() => {
      expect(status?.textContent).toBe('Copied to clipboard: npx markdown-studio@latest')
    })
    expect(writeText).toHaveBeenCalledExactlyOnceWith('npx markdown-studio@latest')
    expect(button?.textContent).toContain('npx markdown-studio@latest')
  })

  // Screen readers skip a status message that did not change, so the region
  // must be empty again before the same command is copied a second time.
  it('clears the announcement after the copy feedback ends', async () => {
    vi.useFakeTimers()
    writeText.mockResolvedValue(undefined)
    const status = document.querySelector('[role="status"]')

    document.querySelector<HTMLButtonElement>('[data-action="copy-brew"]')?.click()
    await vi.waitFor(() => {
      expect(status?.textContent).toContain('brew install')
    })
    vi.advanceTimersByTime(2000)

    expect(status?.textContent).toBe('')
    vi.useRealTimers()
  })
})

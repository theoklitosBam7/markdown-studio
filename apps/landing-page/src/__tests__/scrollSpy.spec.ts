import { beforeAll, describe, expect, it, vi } from 'vite-plus/test'

// Mermaid needs a real layout engine, which jsdom does not have.
vi.mock('mermaid', () => ({
  default: {
    initialize: vi.fn(),
    render: vi.fn(async () => ({ svg: '<svg></svg>' })),
  },
}))

type ObserverCallback = (entries: Partial<IntersectionObserverEntry>[]) => void

const observedTargets = new Map<Element, ObserverCallback>()

// jsdom has no layout, so the test reports visibility to whichever observer
// watches the element.
function setVisible(selector: string, isIntersecting: boolean): void {
  const target = document.querySelector(selector)
  if (!target) throw new Error(`Missing element ${selector}`)
  observedTargets.get(target)?.([
    { intersectionRatio: isIntersecting ? 1 : 0, isIntersecting, target },
  ])
}

beforeAll(async () => {
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      constructor(private readonly callback: ObserverCallback) {}
      observe(target: Element): void {
        observedTargets.set(target, this.callback)
      }
    },
  )
  document.body.innerHTML = '<div id="landing"></div>'
  await import('../main')
})

function currentSidebarLinks(): string[] {
  return Array.from(document.querySelectorAll('.landing-side-nav [aria-current="true"]')).map(
    (link) => link.getAttribute('href') ?? '',
  )
}

describe('sidebar scroll-spy', () => {
  it('marks only the link of the section that scrolled into view', () => {
    setVisible('#features', true)
    expect(currentSidebarLinks()).toEqual(['#features'])

    setVisible('#features', false)
    setVisible('#install', true)
    expect(currentSidebarLinks()).toEqual(['#install'])
  })

  it('marks the last section while the page footer is fully visible', () => {
    setVisible('#install', false)
    setVisible('#features', true)
    setVisible('.landing-footer', true)
    expect(currentSidebarLinks()).toEqual(['#install'])

    setVisible('.landing-footer', false)
    expect(currentSidebarLinks()).toEqual(['#features'])
  })
})

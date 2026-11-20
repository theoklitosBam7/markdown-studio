import type { ActiveDocumentKind } from '@/types/document'

import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test'
import { computed, nextTick, shallowRef } from 'vue'

import { clearStoredWebDraft, useWebDraftPersistence } from '../useWebDraftPersistence'

describe('useWebDraftPersistence', () => {
  beforeEach(() => {
    window.localStorage.clear()
    vi.useFakeTimers()
  })

  afterEach(() => {
    clearStoredWebDraft()
    vi.useRealTimers()
  })

  it('restores a stored draft on the web', async () => {
    const content = shallowRef('# Initial')
    const displayName = computed(() => 'Untitled.md')
    const isDirty = shallowRef(true)
    const isDesktop = shallowRef(false)
    const restoreDraft = vi.fn()

    window.localStorage.setItem(
      'markdown-studio:web-draft',
      JSON.stringify({
        content: '# Draft',
        label: 'draft.md',
      }),
    )

    const persistence = useWebDraftPersistence({
      content,
      displayName,
      documentKind: shallowRef<ActiveDocumentKind>('markdown'),
      isDesktop,
      isDirty,
      restoreDraft,
    })

    await persistence.restoreStoredDraft()

    expect(restoreDraft).toHaveBeenCalledWith({
      content: '# Draft',
      label: 'draft.md',
    })
  })

  it('skips restoring drafts in desktop mode', async () => {
    const restoreDraft = vi.fn()
    const isDirty = shallowRef(true)

    window.localStorage.setItem(
      'markdown-studio:web-draft',
      JSON.stringify({
        content: '# Draft',
        label: 'draft.md',
      }),
    )

    const persistence = useWebDraftPersistence({
      content: shallowRef('# Initial'),
      displayName: computed(() => 'Untitled.md'),
      documentKind: shallowRef<ActiveDocumentKind>('markdown'),
      isDesktop: shallowRef(true),
      isDirty,
      restoreDraft,
    })

    await persistence.restoreStoredDraft()

    expect(restoreDraft).not.toHaveBeenCalled()
  })

  it('persists content updates after restoration has completed', async () => {
    const content = shallowRef('# Initial')
    const isDirty = shallowRef(false)
    const label = shallowRef('notes.md')
    const persistence = useWebDraftPersistence({
      content,
      displayName: computed(() => label.value),
      documentKind: shallowRef<ActiveDocumentKind>('markdown'),
      isDesktop: shallowRef(false),
      isDirty,
      restoreDraft: vi.fn(),
    })

    await persistence.restoreStoredDraft()

    isDirty.value = true
    content.value = '# Updated'
    label.value = 'updated.md'

    await vi.advanceTimersByTimeAsync(300)

    expect(JSON.parse(window.localStorage.getItem('markdown-studio:web-draft') ?? '')).toEqual({
      content: '# Updated',
      label: 'updated.md',
    })
  })

  it('clears the persisted draft when requested', async () => {
    const content = shallowRef('# Initial')
    const isDirty = shallowRef(false)
    const persistence = useWebDraftPersistence({
      content,
      displayName: computed(() => 'Untitled.md'),
      documentKind: shallowRef<ActiveDocumentKind>('markdown'),
      isDesktop: shallowRef(false),
      isDirty,
      restoreDraft: vi.fn(),
    })

    await persistence.restoreStoredDraft()
    isDirty.value = true
    content.value = '# Updated'
    await vi.advanceTimersByTimeAsync(300)

    expect(window.localStorage.getItem('markdown-studio:web-draft')).not.toBeNull()

    await persistence.clearDraft()

    expect(window.localStorage.getItem('markdown-studio:web-draft')).toBeNull()
  })

  it('cancels a pending Markdown draft when an HTML document opens', async () => {
    const content = shallowRef('# Saved')
    const displayName = shallowRef('notes.md')
    const documentKind = shallowRef<ActiveDocumentKind>('markdown')
    const isDirty = shallowRef(false)
    const persistence = useWebDraftPersistence({
      content,
      displayName,
      documentKind,
      isDesktop: shallowRef(false),
      isDirty,
      restoreDraft: vi.fn(),
    })

    await persistence.restoreStoredDraft()
    content.value = '# Edited'
    isDirty.value = true
    await nextTick()
    await vi.advanceTimersByTimeAsync(100)

    documentKind.value = 'html'
    content.value = '<h1>HTML document</h1>'
    displayName.value = 'report.html'
    isDirty.value = false
    await nextTick()
    await vi.advanceTimersByTimeAsync(250)

    expect(window.localStorage.getItem('markdown-studio:web-draft')).toBeNull()
  })

  it('does not write a draft while an HTML preview is active', async () => {
    const content = shallowRef('<p>Page</p>')
    const persistence = useWebDraftPersistence({
      content,
      displayName: computed(() => 'page.html'),
      documentKind: shallowRef<ActiveDocumentKind>('html'),
      isDesktop: shallowRef(false),
      isDirty: shallowRef(true),
      restoreDraft: vi.fn(),
    })

    await persistence.restoreStoredDraft()
    content.value = '<p>Updated</p>'
    await vi.advanceTimersByTimeAsync(300)

    expect(window.localStorage.getItem('markdown-studio:web-draft')).toBeNull()
  })
})

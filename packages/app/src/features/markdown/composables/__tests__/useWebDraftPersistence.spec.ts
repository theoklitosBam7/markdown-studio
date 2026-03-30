import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { computed, shallowRef } from 'vue'

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
      isDesktop: shallowRef(false),
      isDirty,
      restoreDraft: vi.fn(),
    })

    await persistence.restoreStoredDraft()
    isDirty.value = true
    content.value = '# Updated'
    await vi.advanceTimersByTimeAsync(300)

    expect(window.localStorage.getItem('markdown-studio:web-draft')).not.toBeNull()

    persistence.clearDraft()

    expect(window.localStorage.getItem('markdown-studio:web-draft')).toBeNull()
  })
})

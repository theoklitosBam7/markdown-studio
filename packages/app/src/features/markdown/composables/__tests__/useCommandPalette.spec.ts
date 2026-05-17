import { describe, expect, it, vi } from 'vitest'
import { computed } from 'vue'

import type { EditorWorkspaceCommand } from '../../types/commands'

import { useCommandPalette } from '../useCommandPalette'

function createCommand(
  input: Partial<EditorWorkspaceCommand> & Pick<EditorWorkspaceCommand, 'id' | 'title'>,
): EditorWorkspaceCommand {
  return {
    disabledReason: null,
    group: 'Document',
    run: vi.fn(),
    ...input,
  }
}

describe('useCommandPalette', () => {
  it('resets query and activates the first enabled command when opened', () => {
    const palette = useCommandPalette({
      commands: computed(() => [
        createCommand({
          disabledReason: 'Unavailable',
          id: 'document:open',
          title: 'Open Document...',
        }),
        createCommand({ id: 'editor:find', title: 'Find' }),
      ]),
    })

    palette.setQuery('find')
    palette.open()

    expect(palette.query.value).toBe('')
    expect(palette.isOpen.value).toBe(true)
    expect(palette.activeCommandId.value).toBe('editor:find')
  })

  it('ranks exact title, prefix, contains, then keyword matches', () => {
    const palette = useCommandPalette({
      commands: computed(() => [
        createCommand({ id: 'workspace:keyword', keywords: ['find'], title: 'Open Samples' }),
        createCommand({ id: 'workspace:contains', title: 'Advanced Find Tools' }),
        createCommand({ id: 'workspace:prefix', title: 'Find Again' }),
        createCommand({ id: 'editor:find', title: 'Find' }),
      ]),
    })

    palette.setQuery('find')

    expect(palette.results.value.map(({ command }) => command.id)).toEqual([
      'editor:find',
      'workspace:prefix',
      'workspace:contains',
      'workspace:keyword',
    ])
  })

  it('skips disabled commands during keyboard navigation and execution', async () => {
    const firstRun = vi.fn()
    const secondRun = vi.fn()
    const palette = useCommandPalette({
      commands: computed(() => [
        createCommand({ id: 'workspace:first', run: firstRun, title: 'First' }),
        createCommand({
          disabledReason: 'Unavailable',
          id: 'workspace:disabled',
          title: 'Disabled',
        }),
        createCommand({ id: 'workspace:second', run: secondRun, title: 'Second' }),
      ]),
    })

    palette.open()
    palette.moveActive(1)
    await palette.execute()

    expect(palette.activeCommandId.value).toBe('workspace:second')
    expect(firstRun).not.toHaveBeenCalled()
    expect(secondRun).toHaveBeenCalledTimes(1)
  })

  it('closes before awaiting command execution', async () => {
    let wasOpenDuringRun = true
    const palette = useCommandPalette({
      commands: computed(() => [
        createCommand({
          id: 'workspace:async',
          run: async () => {
            wasOpenDuringRun = palette.isOpen.value
          },
          title: 'Async',
        }),
      ]),
    })

    palette.open()
    await palette.execute()

    expect(wasOpenDuringRun).toBe(false)
    expect(palette.isOpen.value).toBe(false)
  })
})

import { computed, type ComputedRef, readonly, shallowRef } from 'vue'

import { formatShortcutLabel } from '@/utils/shortcutLabel'

import type { EditorWorkspaceCommand } from '../types/commands'

interface UseCommandPaletteOptions {
  commands: ComputedRef<EditorWorkspaceCommand[]>
}

export function useCommandPalette(options: UseCommandPaletteOptions) {
  const isOpen = shallowRef(false)
  const query = shallowRef('')
  const activeCommandId = shallowRef<EditorWorkspaceCommand['id'] | null>(null)

  const results = computed(() =>
    options.commands.value
      .map((command, index) => ({ command, index, score: scoreCommand(command, query.value) }))
      .filter((result) => result.score >= 0)
      .sort((first, second) => first.score - second.score || first.index - second.index)
      .map(({ command, score }) => ({ command, score })),
  )
  const enabledResults = computed(() =>
    results.value.filter(({ command }) => command.disabledReason === null),
  )
  const activeResult = computed(() => {
    const activeId = activeCommandId.value
    return enabledResults.value.find(({ command }) => command.id === activeId) ?? null
  })

  function open(): void {
    query.value = ''
    isOpen.value = true
    activeCommandId.value = enabledResults.value[0]?.command.id ?? null
  }

  function close(): void {
    isOpen.value = false
  }

  function setQuery(value: string): void {
    query.value = value
    activeCommandId.value = enabledResults.value[0]?.command.id ?? null
  }

  function moveActive(delta: number): void {
    const enabled = enabledResults.value
    if (enabled.length === 0) {
      activeCommandId.value = null
      return
    }

    const currentIndex = enabled.findIndex(({ command }) => command.id === activeCommandId.value)
    const startIndex = currentIndex >= 0 ? currentIndex : 0
    const nextIndex = (startIndex + delta + enabled.length) % enabled.length
    activeCommandId.value = enabled[nextIndex]?.command.id ?? null
  }

  async function execute(command = activeResult.value?.command): Promise<void> {
    if (!command || command.disabledReason !== null) {
      return
    }

    close()
    await command.run()
  }

  return {
    activeCommandId: readonly(activeCommandId),
    activeResult,
    close,
    execute,
    isOpen: readonly(isOpen),
    moveActive,
    open,
    query: readonly(query),
    results,
    setQuery,
  }
}

function normalize(value: string): string {
  return value.toLowerCase().replace(/\s+/g, ' ').trim()
}

function scoreCommand(command: EditorWorkspaceCommand, query: string): number {
  const normalizedQuery = normalize(query)
  if (!normalizedQuery) {
    return 0
  }

  const title = normalize(command.title)
  if (title === normalizedQuery) return 1
  if (title.startsWith(normalizedQuery)) return 2
  if (title.includes(normalizedQuery)) return 3

  const searchable = [
    command.group,
    ...(command.keywords ?? []),
    ...(command.shortcut
      ? [
          formatShortcutLabel(command.shortcut, 'mac'),
          formatShortcutLabel(command.shortcut, 'other'),
        ]
      : []),
  ]
    .map(normalize)
    .join(' ')

  return searchable.includes(normalizedQuery) ? 4 : -1
}

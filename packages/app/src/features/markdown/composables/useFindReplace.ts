import type { ComputedRef, DeepReadonly, ShallowRef } from 'vue'

import { computed, readonly, shallowRef, watch } from 'vue'

export interface FindMatch {
  end: number
  index: number
  length: number
}

interface ReplaceAllPlan {
  nextActiveIndex: number
  nextContent: string
  replacementCount: number
}

interface ReplaceCurrentPlan {
  match: FindMatch
  nextActiveIndex: number
  nextContent: string
  replacement: string
}

interface UseFindReplaceOptions {
  content: DeepReadonly<ShallowRef<string>>
}

interface UseFindReplaceReturn {
  activeMatch: ComputedRef<FindMatch | null>
  activeMatchIndex: DeepReadonly<ShallowRef<number>>
  activeMatchNumber: ComputedRef<number>
  close: () => void
  commitReplacement: (nextActiveIndex: number) => void
  findNext: () => void
  findPrevious: () => void
  isOpen: DeepReadonly<ShallowRef<boolean>>
  matchCase: DeepReadonly<ShallowRef<boolean>>
  matchCount: ComputedRef<number>
  matches: ComputedRef<FindMatch[]>
  openFind: () => void
  openReplace: () => void
  prepareReplaceAll: () => null | ReplaceAllPlan
  prepareReplaceCurrent: () => null | ReplaceCurrentPlan
  query: DeepReadonly<ShallowRef<string>>
  replaceText: DeepReadonly<ShallowRef<string>>
  requestSelectionSync: DeepReadonly<ShallowRef<number>>
  setMatchCase: (value: boolean) => void
  setQuery: (value: string) => void
  setReplaceText: (value: string) => void
  showReplace: DeepReadonly<ShallowRef<boolean>>
}

export function useFindReplace(options: UseFindReplaceOptions): UseFindReplaceReturn {
  const _activeMatchIndex = shallowRef(-1)
  const _isOpen = shallowRef(false)
  const _matchCase = shallowRef(false)
  const _query = shallowRef('')
  const _replaceText = shallowRef('')
  const _requestSelectionSync = shallowRef(0)
  const _showReplace = shallowRef(false)

  const matches = computed(() =>
    findLiteralMatches(options.content.value, _query.value, _matchCase.value),
  )
  const matchCount = computed(() => matches.value.length)
  const activeMatch = computed<FindMatch | null>(() => {
    if (_activeMatchIndex.value < 0) {
      return null
    }

    return matches.value[_activeMatchIndex.value] ?? null
  })
  const activeMatchNumber = computed(() => (activeMatch.value ? _activeMatchIndex.value + 1 : 0))

  watch(
    matches,
    (nextMatches) => {
      if (nextMatches.length === 0) {
        _activeMatchIndex.value = -1
        return
      }

      if (_activeMatchIndex.value < 0 || _activeMatchIndex.value >= nextMatches.length) {
        _activeMatchIndex.value = 0
      }
    },
    { flush: 'sync', immediate: true },
  )

  function bumpSelectionSync(): void {
    _requestSelectionSync.value += 1
  }

  function close(): void {
    _isOpen.value = false
    _showReplace.value = false
  }

  function commitReplacement(nextActiveIndex: number): void {
    _activeMatchIndex.value = nextActiveIndex
    bumpSelectionSync()
  }

  function findNext(): void {
    if (matches.value.length === 0) {
      return
    }

    _activeMatchIndex.value = (_activeMatchIndex.value + 1) % matches.value.length
    bumpSelectionSync()
  }

  function findPrevious(): void {
    if (matches.value.length === 0) {
      return
    }

    _activeMatchIndex.value =
      (_activeMatchIndex.value - 1 + matches.value.length) % matches.value.length
    bumpSelectionSync()
  }

  function openFind(): void {
    _isOpen.value = true
    _showReplace.value = false
    syncActiveMatchIndex()
    bumpSelectionSync()
  }

  function openReplace(): void {
    _isOpen.value = true
    _showReplace.value = true
    syncActiveMatchIndex()
    bumpSelectionSync()
  }

  function prepareReplaceAll(): null | ReplaceAllPlan {
    if (matches.value.length === 0) {
      return null
    }

    const replacementCount = matches.value.length
    const nextContent = replaceMatches(
      options.content.value,
      matches.value,
      () => _replaceText.value,
    )
    const nextMatches = findLiteralMatches(nextContent, _query.value, _matchCase.value)

    return {
      nextActiveIndex: nextMatches.length === 0 ? -1 : 0,
      nextContent,
      replacementCount,
    }
  }

  function prepareReplaceCurrent(): null | ReplaceCurrentPlan {
    const match = activeMatch.value
    if (!match) {
      return null
    }

    const nextContent =
      options.content.value.slice(0, match.index) +
      _replaceText.value +
      options.content.value.slice(match.end)
    const nextMatches = findLiteralMatches(nextContent, _query.value, _matchCase.value)
    const nextActiveIndex = getFirstMatchIndexAtOrAfter(
      nextMatches,
      match.index + _replaceText.value.length,
    )

    return {
      match,
      nextActiveIndex,
      nextContent,
      replacement: _replaceText.value,
    }
  }

  function setMatchCase(value: boolean): void {
    _matchCase.value = value
    syncActiveMatchIndex()
    bumpSelectionSync()
  }

  function setQuery(value: string): void {
    _query.value = value
    syncActiveMatchIndex()
    bumpSelectionSync()
  }

  function setReplaceText(value: string): void {
    _replaceText.value = value
  }

  function syncActiveMatchIndex(): void {
    if (matches.value.length === 0) {
      _activeMatchIndex.value = -1
      return
    }

    _activeMatchIndex.value = 0
  }

  return {
    activeMatch,
    activeMatchIndex: readonly(_activeMatchIndex),
    activeMatchNumber,
    close,
    commitReplacement,
    findNext,
    findPrevious,
    isOpen: readonly(_isOpen),
    matchCase: readonly(_matchCase),
    matchCount,
    matches,
    openFind,
    openReplace,
    prepareReplaceAll,
    prepareReplaceCurrent,
    query: readonly(_query),
    replaceText: readonly(_replaceText),
    requestSelectionSync: readonly(_requestSelectionSync),
    setMatchCase,
    setQuery,
    setReplaceText,
    showReplace: readonly(_showReplace),
  }
}

function findLiteralMatches(content: string, query: string, matchCase: boolean): FindMatch[] {
  if (!query) {
    return []
  }

  const searchContent = matchCase ? content : content.toLocaleLowerCase()
  const searchQuery = matchCase ? query : query.toLocaleLowerCase()
  const nextMatches: FindMatch[] = []
  let searchFrom = 0

  while (searchFrom <= searchContent.length - searchQuery.length) {
    const index = searchContent.indexOf(searchQuery, searchFrom)
    if (index === -1) {
      break
    }

    nextMatches.push({
      end: index + query.length,
      index,
      length: query.length,
    })
    searchFrom = index + Math.max(query.length, 1)
  }

  return nextMatches
}

function getFirstMatchIndexAtOrAfter(matches: FindMatch[], offset: number): number {
  if (matches.length === 0) {
    return -1
  }

  const index = matches.findIndex((match) => match.index >= offset)
  return index === -1 ? 0 : index
}

function replaceMatches(
  content: string,
  matches: FindMatch[],
  getReplacement: (match: FindMatch, index: number) => string,
): string {
  let nextContent = content

  for (let index = matches.length - 1; index >= 0; index -= 1) {
    const match = matches[index]
    if (!match) {
      continue
    }

    nextContent =
      nextContent.slice(0, match.index) +
      getReplacement(match, index) +
      nextContent.slice(match.end)
  }

  return nextContent
}

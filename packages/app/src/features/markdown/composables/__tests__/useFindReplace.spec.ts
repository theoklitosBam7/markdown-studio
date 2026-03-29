import { describe, expect, it } from 'vitest'
import { shallowRef } from 'vue'

import { useFindReplace } from '../useFindReplace'

function createFindReplace(initialContent: string) {
  const content = shallowRef(initialContent)

  return {
    content,
    findReplace: useFindReplace({
      content,
    }),
  }
}

describe('useFindReplace', () => {
  it('finds literal matches with case sensitivity control', () => {
    const { findReplace } = createFindReplace('Alpha alpha ALPHA')

    findReplace.setQuery('alpha')

    expect(findReplace.matches.value.map((match) => match.index)).toEqual([0, 6, 12])

    findReplace.setMatchCase(true)
    expect(findReplace.matches.value.map((match) => match.index)).toEqual([6])
  })

  it('wraps active match navigation in both directions', () => {
    const { findReplace } = createFindReplace('one two one')

    findReplace.setQuery('one')

    expect(findReplace.activeMatchIndex.value).toBe(0)

    findReplace.findNext()
    expect(findReplace.activeMatchIndex.value).toBe(1)

    findReplace.findNext()
    expect(findReplace.activeMatchIndex.value).toBe(0)

    findReplace.findPrevious()
    expect(findReplace.activeMatchIndex.value).toBe(1)
  })

  it('replaces the current match and moves to the next available match', () => {
    const { findReplace } = createFindReplace('cat dog cat')

    findReplace.setQuery('cat')
    findReplace.setReplaceText('fox')

    const replacementPlan = findReplace.prepareReplaceCurrent()

    expect(replacementPlan).not.toBeNull()
    expect(replacementPlan?.nextContent).toBe('fox dog cat')
    expect(replacementPlan?.nextActiveIndex).toBe(0)
  })

  it('replaces all matches and reports the number of replacements', () => {
    const { findReplace } = createFindReplace('red blue red')

    findReplace.setQuery('red')
    findReplace.setReplaceText('green')

    const replacementPlan = findReplace.prepareReplaceAll()

    expect(replacementPlan).not.toBeNull()
    expect(replacementPlan?.replacementCount).toBe(2)
    expect(replacementPlan?.nextContent).toBe('green blue green')
    expect(replacementPlan?.nextActiveIndex).toBe(-1)
  })

  it('recomputes matches after external content edits', () => {
    const { content, findReplace } = createFindReplace('hello world')

    findReplace.setQuery('world')
    expect(findReplace.matchCount.value).toBe(1)

    content.value = 'hello there'
    expect(findReplace.matchCount.value).toBe(0)
    expect(findReplace.activeMatchIndex.value).toBe(-1)
  })

  it('keeps empty and no-match states inert', () => {
    const { content, findReplace } = createFindReplace('sample')

    findReplace.setQuery('')
    expect(findReplace.matchCount.value).toBe(0)
    expect(findReplace.activeMatchNumber.value).toBe(0)

    findReplace.setQuery('missing')
    expect(findReplace.prepareReplaceCurrent()).toBeNull()
    expect(findReplace.prepareReplaceAll()).toBeNull()
    expect(content.value).toBe('sample')
  })
})

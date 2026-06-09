import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { computed, defineComponent, h } from 'vue'

import type { ShortcutBinding } from '../../types/shortcuts'

import { useShortcuts } from '../useShortcuts'

function binding(
  input: Partial<ShortcutBinding> & Pick<ShortcutBinding, 'handler' | 'id' | 'keys'>,
): ShortcutBinding {
  return {
    group: 'Document',
    label: input.id,
    ...input,
  }
}

function createKeyboardEvent(
  key: string,
  overrides: Partial<KeyboardEventInit> = {},
): KeyboardEvent {
  return new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key, ...overrides })
}

describe('useShortcuts', () => {
  describe('handleKeydown', () => {
    it('dispatches to the matching binding handler', () => {
      const handler = vi.fn()
      const bindings = computed(() => [binding({ handler, id: 'editor:find', keys: ['Mod', 'F'] })])

      const { handleKeydown } = useShortcuts({ bindings })

      const event = createKeyboardEvent('f', { metaKey: true })
      handleKeydown(event)

      expect(handler).toHaveBeenCalledOnce()
      expect(event.defaultPrevented).toBe(true)
    })

    it('does nothing when no shortcut matches', () => {
      const handler = vi.fn()
      const bindings = computed(() => [binding({ handler, id: 'editor:find', keys: ['Mod', 'F'] })])

      const { handleKeydown } = useShortcuts({ bindings })

      const event = createKeyboardEvent('x', { metaKey: true })
      handleKeydown(event)

      expect(handler).not.toHaveBeenCalled()
      expect(event.defaultPrevented).toBe(false)
    })

    it('respects a binding condition', () => {
      const handler = vi.fn()
      const bindings = computed(() => [
        binding({
          condition: () => false,
          handler,
          id: 'document:save',
          keys: ['Mod', 'S'],
        }),
      ])

      const { handleKeydown } = useShortcuts({ bindings })

      const event = createKeyboardEvent('s', { metaKey: true })
      handleKeydown(event)

      expect(handler).not.toHaveBeenCalled()
      expect(event.defaultPrevented).toBe(false)
    })

    it('respects event.defaultPrevented', () => {
      const handler = vi.fn()
      const bindings = computed(() => [binding({ handler, id: 'editor:find', keys: ['Mod', 'F'] })])

      const { handleKeydown } = useShortcuts({ bindings })

      const event = createKeyboardEvent('f', { metaKey: true })
      Object.defineProperty(event, 'defaultPrevented', { value: true })
      handleKeydown(event)

      expect(handler).not.toHaveBeenCalled()
    })

    it('ignores keyboard events during composition', () => {
      const handler = vi.fn()
      const bindings = computed(() => [
        binding({ handler, id: 'shortcuts:palette', keys: ['Mod', 'K'] }),
      ])

      const { handleKeydown } = useShortcuts({ bindings })

      handleKeydown(createKeyboardEvent('k', { isComposing: true, metaKey: true }))

      expect(handler).not.toHaveBeenCalled()
    })

    it('skips bare single-char keys when focus is in an input', () => {
      const handler = vi.fn()
      const bindings = computed(() => [binding({ handler, id: 'shortcuts:help', keys: ['?'] })])

      const { handleKeydown } = useShortcuts({ bindings })

      const input = document.createElement('input')
      document.body.appendChild(input)
      input.focus()

      const event = createKeyboardEvent('?')
      handleKeydown(event)

      expect(handler).not.toHaveBeenCalled()
      expect(event.defaultPrevented).toBe(false)

      document.body.removeChild(input)
    })

    it('blocks all bindings when an overlay is open, unless allowThroughOverlay is set', () => {
      const blocked = vi.fn()
      const allowed = vi.fn()
      const isOverlayOpen = () => true

      const bindings = computed(() => [
        binding({ handler: blocked, id: 'editor:find', keys: ['Mod', 'F'] }),
        binding({
          allowThroughOverlay: true,
          handler: allowed,
          id: 'shortcuts:close-overlay',
          keys: ['Escape'],
        }),
      ])

      const { handleKeydown } = useShortcuts({ bindings, isOverlayOpen })

      const blockedEvent = createKeyboardEvent('f', { metaKey: true })
      handleKeydown(blockedEvent)
      expect(blocked).not.toHaveBeenCalled()

      const allowedEvent = createKeyboardEvent('Escape')
      handleKeydown(allowedEvent)
      expect(allowed).toHaveBeenCalledOnce()
    })

    it('does not block bindings when no overlay is open', () => {
      const handler = vi.fn()
      const isOverlayOpen = () => false

      const bindings = computed(() => [binding({ handler, id: 'editor:find', keys: ['Mod', 'F'] })])

      const { handleKeydown } = useShortcuts({ bindings, isOverlayOpen })

      const event = createKeyboardEvent('f', { metaKey: true })
      handleKeydown(event)
      expect(handler).toHaveBeenCalledOnce()
    })
  })

  describe('dispatch map', () => {
    it('throws on duplicate normalized combos', () => {
      const bindings = computed(() => [
        binding({ handler: vi.fn(), id: 'editor:find', keys: ['Mod', 'F'] }),
        binding({ handler: vi.fn(), id: 'editor:replace', keys: ['Mod', 'F'] }),
      ])

      const { handleKeydown } = useShortcuts({ bindings })

      expect(() => handleKeydown(createKeyboardEvent('f', { metaKey: true }))).toThrow(
        /Duplicate shortcut combo/,
      )
    })

    it('throws on duplicate alias combos', () => {
      const bindings = computed(() => [
        binding({ handler: vi.fn(), id: 'editor:find', keys: ['Mod', 'F'] }),
        binding({
          aliases: [['Mod', 'F']],
          handler: vi.fn(),
          id: 'shortcuts:palette',
          keys: ['Mod', 'K'],
        }),
      ])

      const { handleKeydown } = useShortcuts({ bindings })

      expect(() => handleKeydown(createKeyboardEvent('k', { metaKey: true }))).toThrow(
        /Duplicate shortcut combo/,
      )
    })

    it('supports aliases', () => {
      const handler = vi.fn()
      const bindings = computed(() => [
        binding({
          aliases: [['F3']],
          handler,
          id: 'shortcuts:find-next',
          keys: ['Mod', 'G'],
        }),
      ])

      const { handleKeydown } = useShortcuts({ bindings })

      // Primary combo
      handleKeydown(createKeyboardEvent('g', { metaKey: true }))
      expect(handler).toHaveBeenCalledOnce()

      // Alias
      handleKeydown(createKeyboardEvent('F3'))
      expect(handler).toHaveBeenCalledTimes(2)
    })
  })

  describe('shortcuts list', () => {
    it('derives display shortcuts from bindings', () => {
      const handler = vi.fn()
      const bindings = computed(() => [
        binding({
          group: 'Editor',
          handler,
          id: 'editor:find',
          keys: ['Mod', 'F'],
          label: 'Find',
        }),
        binding({
          group: 'View',
          handler,
          id: 'shortcuts:palette',
          keys: ['Mod', 'K'],
          label: 'Command Palette',
        }),
      ])

      const { shortcuts } = useShortcuts({ bindings })

      const ids = shortcuts.value.map((s) => s.id)
      expect(ids).toContain('editor:find')
      expect(ids).toContain('shortcuts:palette')

      const find = shortcuts.value.find((s) => s.id === 'editor:find')!
      expect(find.keys).toEqual(['Mod', 'F'])
      expect(find.label).toBe('Find')
      expect(find.group).toBe('Editor')
    })

    it('strips implementation-only fields from display shortcuts', () => {
      const handler = vi.fn()
      const bindings = computed(() => [
        binding({
          aliases: [['F3']],
          allowThroughOverlay: true,
          condition: () => true,
          group: 'Editor',
          handler,
          id: 'editor:find',
          keys: ['Mod', 'F'],
          label: 'Find',
        }),
      ])

      const { shortcuts } = useShortcuts({ bindings })
      const shortcut = shortcuts.value[0]

      expect(shortcut).not.toHaveProperty('handler')
      expect(shortcut).not.toHaveProperty('condition')
      expect(shortcut).not.toHaveProperty('aliases')
      expect(shortcut).not.toHaveProperty('allowThroughOverlay')
    })

    it('returns empty list when bindings are empty', () => {
      const bindings = computed(() => [])
      const { shortcuts } = useShortcuts({ bindings })
      expect(shortcuts.value).toEqual([])
    })
  })

  describe('lifecycle', () => {
    it('registers window keydown listener on mount and removes on unmount', () => {
      const addSpy = vi.spyOn(window, 'addEventListener')
      const removeSpy = vi.spyOn(window, 'removeEventListener')

      const handler = vi.fn()
      const bindings = computed(() => [binding({ handler, id: 'editor:find', keys: ['Mod', 'F'] })])

      const Harness = defineComponent({
        setup() {
          useShortcuts({ bindings })
          return () => h('div')
        },
      })

      const wrapper = mount(Harness)
      expect(addSpy).toHaveBeenCalledWith('keydown', expect.any(Function))

      wrapper.unmount()
      expect(removeSpy).toHaveBeenCalledWith('keydown', expect.any(Function))

      addSpy.mockRestore()
      removeSpy.mockRestore()
    })
  })
})

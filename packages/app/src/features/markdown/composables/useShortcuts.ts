import { computed, type ComputedRef, onMounted, onUnmounted } from 'vue'

import {
  isBareSingleChar,
  isEditableElement,
  normalizeEvent,
  normalizeKeys,
} from '@/utils/keyboard'

import type { Shortcut, ShortcutBinding } from '../types/shortcuts'

export interface UseShortcutsDeps {
  /** Canonical bindings — the single source for both dispatch and display. */
  bindings: ComputedRef<ShortcutBinding[]>
  /**
   * Optional gate: when this returns true, only bindings with
   * {@link ShortcutBinding.allowThroughOverlay} set will fire.
   */
  isOverlayOpen?: () => boolean
}

export function useShortcuts(deps: UseShortcutsDeps): {
  handleKeydown: (event: KeyboardEvent) => void
  shortcuts: ComputedRef<Shortcut[]>
} {
  const { bindings, isOverlayOpen } = deps

  const dispatchMap = computed(() => {
    const map = new Map<string, ShortcutBinding>()

    for (const binding of bindings.value) {
      const normalized = normalizeKeys(binding.keys)
      const existing = map.get(normalized)
      if (existing) {
        throw new Error(
          `Duplicate shortcut combo "${normalized}" for ids "${existing.id}" and "${binding.id}".`,
        )
      }
      map.set(normalized, binding)

      for (const alias of binding.aliases ?? []) {
        const normalizedAlias = normalizeKeys(alias)
        const aliasExisting = map.get(normalizedAlias)
        if (aliasExisting) {
          throw new Error(
            `Duplicate shortcut combo "${normalizedAlias}" via alias for ids "${aliasExisting.id}" and "${binding.id}".`,
          )
        }
        map.set(normalizedAlias, binding)
      }
    }
    return map
  })

  const shortcuts = computed<Shortcut[]>(() =>
    bindings.value.map(({ group, id, keys, label }) => ({ group, id, keys, label })),
  )

  function handleKeydown(event: KeyboardEvent): void {
    if (event.defaultPrevented || event.isComposing) return

    const combo = normalizeEvent(event)
    const entry = dispatchMap.value.get(combo)
    if (!entry) return

    // Guard: bare single-char keys are skipped when focus is in an editable element
    if (isBareSingleChar(combo) && isEditableElement(document.activeElement)) return

    // If an overlay is open, only bindings explicitly allowed through overlays fire.
    if (isOverlayOpen?.() && !entry.allowThroughOverlay) return

    if (entry.condition && !entry.condition()) return

    event.preventDefault()
    entry.handler()
  }

  onMounted(() => {
    window.addEventListener('keydown', handleKeydown)
  })

  onUnmounted(() => {
    window.removeEventListener('keydown', handleKeydown)
  })

  return { handleKeydown, shortcuts }
}

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, useTemplateRef, watch } from 'vue'

import type { CommandPaletteResult, EditorWorkspaceCommand } from '../types/commands'

import CommandPaletteItem from './CommandPaletteItem.vue'

interface Props {
  activeCommandId: EditorWorkspaceCommand['id'] | null
  isOpen: boolean
  query: string
  results: CommandPaletteResult[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  close: []
  execute: [command?: EditorWorkspaceCommand]
  moveActive: [delta: number]
  'update:query': [value: string]
}>()

const inputRef = useTemplateRef<HTMLInputElement>('input')
const panelRef = useTemplateRef<HTMLElement>('panel')
const resultsRef = useTemplateRef<HTMLElement>('results')
let previousFocus: Element | null = null

const groupedResults = computed(() => {
  const groups: { group: string; results: CommandPaletteResult[] }[] = []

  for (const result of props.results) {
    const existingGroup = groups.find((group) => group.group === result.command.group)
    if (existingGroup) {
      existingGroup.results.push(result)
      continue
    }

    groups.push({ group: result.command.group, results: [result] })
  }

  return groups
})
const activeDescendant = computed(() =>
  props.activeCommandId ? getCommandOptionId(props.activeCommandId) : undefined,
)

function closeWithFocusRestore(): void {
  emit('close')
  if (previousFocus instanceof HTMLElement) {
    previousFocus.focus()
  }
}

function getCommandOptionId(commandId: EditorWorkspaceCommand['id']): string {
  return `command-palette-option-${commandId.replaceAll(':', '-')}`
}

function handleBackdropPointerdown(event: PointerEvent): void {
  if (event.target === event.currentTarget) {
    closeWithFocusRestore()
  }
}

function handleKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape') {
    event.preventDefault()
    closeWithFocusRestore()
    return
  }

  if (event.key === 'ArrowDown') {
    event.preventDefault()
    emit('moveActive', 1)
    return
  }

  if (event.key === 'ArrowUp') {
    event.preventDefault()
    emit('moveActive', -1)
    return
  }

  if (event.key === 'Enter') {
    event.preventDefault()
    emit('execute')
    return
  }

  if (event.key === 'Tab') {
    trapFocus(event)
  }
}

function trapFocus(event: KeyboardEvent): void {
  const focusable = panelRef.value?.querySelectorAll<HTMLElement>(
    'button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
  )
  if (!focusable?.length) {
    event.preventDefault()
    return
  }

  const first = focusable[0]
  const last = focusable[focusable.length - 1]
  if (!first || !last) {
    event.preventDefault()
    return
  }

  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault()
    last.focus()
    return
  }

  if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault()
    first.focus()
  }
}

watch(
  () => props.isOpen,
  async (isOpen) => {
    if (!isOpen) return

    previousFocus = document.activeElement
    await nextTick()
    inputRef.value?.focus()
  },
)

watch(
  () => props.activeCommandId,
  async (activeCommandId) => {
    if (!props.isOpen || !activeCommandId) return

    await nextTick()
    const activeOption = resultsRef.value?.querySelector<HTMLElement>(
      `#${CSS.escape(getCommandOptionId(activeCommandId))}`,
    )
    activeOption?.scrollIntoView({ block: 'nearest' })
  },
)

function handleDocumentKeydown(event: KeyboardEvent): void {
  if (!props.isOpen) return
  if (panelRef.value?.contains(event.target as Node)) return

  handleKeydown(event)
}

onMounted(() => {
  document.addEventListener('keydown', handleDocumentKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleDocumentKeydown)
})
</script>

<template>
  <Teleport to="body">
    <Transition name="command-palette">
      <div
        v-if="isOpen"
        class="command-palette"
        role="presentation"
        @pointerdown="handleBackdropPointerdown"
      >
        <section
          ref="panel"
          class="command-palette__panel"
          role="dialog"
          aria-label="Command Palette"
          aria-modal="true"
        >
          <input
            ref="input"
            class="command-palette__input"
            :aria-activedescendant="activeDescendant"
            aria-controls="command-palette-listbox"
            autocomplete="off"
            placeholder="Search commands"
            role="combobox"
            spellcheck="false"
            type="search"
            :value="query"
            @input="emit('update:query', ($event.target as HTMLInputElement).value)"
            @keydown="handleKeydown"
          />

          <div
            id="command-palette-listbox"
            ref="results"
            class="command-palette__results"
            role="listbox"
            aria-label="Commands"
          >
            <p v-if="results.length === 0" class="command-palette__empty">No commands found</p>
            <template v-for="group in groupedResults" :key="group.group">
              <div class="command-palette__group" role="presentation">{{ group.group }}</div>
              <button
                v-for="{ command } in group.results"
                :id="getCommandOptionId(command.id)"
                :key="command.id"
                class="command-palette__option"
                :disabled="command.disabledReason !== null"
                role="option"
                type="button"
                :aria-disabled="command.disabledReason !== null"
                :aria-selected="activeCommandId === command.id"
                @click="emit('execute', command)"
              >
                <CommandPaletteItem
                  :command="command"
                  :is-active="activeCommandId === command.id"
                />
              </button>
            </template>
          </div>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.command-palette {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: min(10vh, 72px) 18px 18px;
  background: rgba(20, 18, 14, 0.28);
}

.command-palette__panel {
  width: min(620px, 100%);
  overflow: hidden;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--surface);
  box-shadow: 0 24px 70px rgba(17, 15, 12, 0.24);
}

.command-palette__input {
  width: 100%;
  height: 52px;
  border: 0;
  border-bottom: 1px solid var(--border);
  outline: none;
  background: var(--surface);
  color: var(--text);
  padding: 0 16px;
  font-family: 'DM Sans', sans-serif;
  font-size: 15px;
}

.command-palette__input::placeholder {
  color: var(--text-faint);
}

.command-palette__results {
  max-height: min(420px, 58vh);
  overflow: auto;
  padding: 8px;
}

.command-palette__group {
  padding: 10px 10px 5px;
  color: var(--text-faint);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.command-palette__option {
  display: block;
  width: 100%;
  padding: 0;
  border: 0;
  border-radius: 7px;
  background: transparent;
  text-align: left;
  cursor: pointer;
}

.command-palette__option:disabled {
  cursor: not-allowed;
}

.command-palette__option:focus {
  outline: none;
}

.command-palette__empty {
  margin: 0;
  padding: 22px 12px;
  color: var(--text-muted);
  font-size: 13px;
  text-align: center;
}

.command-palette-enter-active,
.command-palette-leave-active {
  transition: opacity 0.12s ease;
}

.command-palette-enter-active .command-palette__panel,
.command-palette-leave-active .command-palette__panel {
  transition: transform 0.12s ease;
}

.command-palette-enter-from,
.command-palette-leave-to {
  opacity: 0;
}

.command-palette-enter-from .command-palette__panel,
.command-palette-leave-to .command-palette__panel {
  transform: translateY(-8px);
}
</style>

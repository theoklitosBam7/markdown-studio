<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, shallowRef, useTemplateRef, watch } from 'vue'

import { useEscapeDismiss } from '@/composables/useEscapeDismiss'
import {
  Bold,
  Code2,
  Heading1,
  Italic,
  Link2,
  List,
  ListOrdered,
  Minus,
  MoreHorizontal,
  Quote,
  Redo2,
  Undo2,
} from '@lucide/vue'

import { useWorkspaceWidth } from '../composables/useWorkspaceWidth'

export type EditorFormattingCommand =
  | { direction: 'redo' | 'undo'; type: 'history' }
  | { level: 1 | 2 | 3 | 4 | 5 | 6; type: 'heading' }
  | {
      style: 'blockquote' | 'bullet-list' | 'code-block' | 'horizontal-rule' | 'numbered-list'
      type: 'block'
    }
  | { style: 'bold' | 'inline-code' | 'italic' | 'link'; type: 'style' }

export type EditorFormattingStyle =
  | 'blockquote'
  | 'bold'
  | 'bullet-list'
  | 'code-block'
  | 'horizontal-rule'
  | 'inline-code'
  | 'italic'
  | 'link'
  | 'numbered-list'

interface Props {
  activeStyles?: readonly EditorFormattingStyle[]
  headingLevel?: 1 | 2 | 3 | 4 | 5 | 6 | null
}

const props = withDefaults(defineProps<Props>(), {
  activeStyles: () => [],
  headingLevel: null,
})

const emit = defineEmits<{
  format: [command: EditorFormattingCommand]
}>()

function isActive(style: EditorFormattingStyle): boolean {
  return props.activeStyles.includes(style)
}

const blockControls = [
  { icon: ListOrdered, label: 'Numbered list', style: 'numbered-list' },
  { icon: Quote, label: 'Blockquote', style: 'blockquote' },
  { icon: Code2, label: 'Code block', style: 'code-block' },
  { icon: Minus, label: 'Horizontal rule', style: 'horizontal-rule' },
] as const

const isMoreMenuOpen = shallowRef(false)
const moreButtonContainer = useTemplateRef<HTMLElement>('moreButtonContainer')
const moreTrigger = useTemplateRef<HTMLButtonElement>('moreTrigger')

const toolbar = useTemplateRef<HTMLElement>('toolbar')
const toolbarWidth = useWorkspaceWidth(toolbar)
const showsInlineBlocks = computed(() => toolbarWidth.value >= 500)

watch(showsInlineBlocks, (showInline) => {
  if (showInline) closeMoreMenu()
})

function closeMoreMenu(restoreFocus = false): void {
  isMoreMenuOpen.value = false
  if (restoreFocus) void nextTick(() => moreTrigger.value?.focus())
}

useEscapeDismiss(isMoreMenuOpen, () => closeMoreMenu(true))

function handleOutsideClick(event: MouseEvent): void {
  if (!moreButtonContainer.value?.contains(event.target as Node)) {
    isMoreMenuOpen.value = false
  }
}

function toggleMoreMenu(): void {
  if (isMoreMenuOpen.value) closeMoreMenu(true)
  else isMoreMenuOpen.value = true
}

onMounted(() => {
  document.addEventListener('click', handleOutsideClick)
})

onUnmounted(() => {
  document.removeEventListener('click', handleOutsideClick)
})

function emitBlock(
  style: 'blockquote' | 'bullet-list' | 'code-block' | 'horizontal-rule' | 'numbered-list',
): void {
  isMoreMenuOpen.value = false
  emit('format', { style, type: 'block' })
}

function emitHistory(direction: 'redo' | 'undo'): void {
  emit('format', { direction, type: 'history' })
}

function emitStyle(style: 'bold' | 'inline-code' | 'italic' | 'link'): void {
  emit('format', { style, type: 'style' })
}

function handleHeadingChange(event: Event): void {
  const target = event.target
  if (!(target instanceof HTMLSelectElement)) return

  const levels: Record<string, 1 | 2 | 3 | 4 | 5 | 6> = {
    '1': 1,
    '2': 2,
    '3': 3,
    '4': 4,
    '5': 5,
    '6': 6,
  }
  const level = levels[target.value]
  if (!level) {
    target.value = props.headingLevel === null ? '' : String(props.headingLevel)
    return
  }

  emit('format', { level, type: 'heading' })
}
</script>

<template>
  <div
    ref="toolbar"
    class="editor-formatting-toolbar"
    role="toolbar"
    aria-label="Editor formatting"
  >
    <div class="editor-formatting-toolbar__row">
      <div class="editor-formatting-toolbar__scroll-area">
        <div class="editor-formatting-toolbar__group" aria-label="History">
          <button
            class="editor-formatting-toolbar__button"
            aria-label="Undo"
            title="Undo"
            type="button"
            @mousedown.prevent
            @click="emitHistory('undo')"
          >
            <Undo2 :size="18" :stroke-width="1.8" aria-hidden="true" />
          </button>
          <button
            class="editor-formatting-toolbar__button"
            aria-label="Redo"
            title="Redo"
            type="button"
            @mousedown.prevent
            @click="emitHistory('redo')"
          >
            <Redo2 :size="18" :stroke-width="1.8" aria-hidden="true" />
          </button>
        </div>

        <span class="editor-formatting-toolbar__divider" aria-hidden="true"></span>

        <label class="editor-formatting-toolbar__heading">
          <Heading1 :size="17" :stroke-width="1.8" aria-hidden="true" />
          <select
            aria-label="Set heading level"
            title="Set heading level"
            :value="props.headingLevel ?? ''"
            @change="handleHeadingChange"
          >
            <option value="">Text</option>
            <option v-for="level in 6" :key="level" :value="level">H{{ level }}</option>
          </select>
        </label>

        <div class="editor-formatting-toolbar__group" aria-label="Text formatting">
          <button
            class="editor-formatting-toolbar__button"
            aria-label="Bold"
            :aria-pressed="isActive('bold')"
            title="Bold"
            type="button"
            @mousedown.prevent
            @click="emitStyle('bold')"
          >
            <Bold :size="18" :stroke-width="2" aria-hidden="true" />
          </button>
          <button
            class="editor-formatting-toolbar__button"
            aria-label="Italic"
            :aria-pressed="isActive('italic')"
            title="Italic"
            type="button"
            @mousedown.prevent
            @click="emitStyle('italic')"
          >
            <Italic :size="18" :stroke-width="2" aria-hidden="true" />
          </button>
          <button
            class="editor-formatting-toolbar__button"
            aria-label="Insert link"
            :aria-pressed="isActive('link')"
            title="Insert link"
            type="button"
            @mousedown.prevent
            @click="emitStyle('link')"
          >
            <Link2 :size="18" :stroke-width="1.8" aria-hidden="true" />
          </button>
          <button
            class="editor-formatting-toolbar__button"
            aria-label="Inline code"
            :aria-pressed="isActive('inline-code')"
            title="Inline code"
            type="button"
            @mousedown.prevent
            @click="emitStyle('inline-code')"
          >
            <Code2 :size="18" :stroke-width="1.8" aria-hidden="true" />
          </button>
          <button
            class="editor-formatting-toolbar__button"
            aria-label="Bulleted list"
            :aria-pressed="isActive('bullet-list')"
            title="Bulleted list"
            type="button"
            @mousedown.prevent
            @click="emitBlock('bullet-list')"
          >
            <List :size="18" :stroke-width="1.8" aria-hidden="true" />
          </button>
        </div>

        <span class="editor-formatting-toolbar__divider" aria-hidden="true"></span>
      </div>

      <div v-show="showsInlineBlocks" class="editor-formatting-toolbar__group">
        <button
          v-for="control in blockControls"
          :key="control.style"
          class="editor-formatting-toolbar__button"
          :aria-label="control.label"
          :aria-pressed="isActive(control.style)"
          :title="control.label"
          type="button"
          @mousedown.prevent
          @click="emitBlock(control.style)"
        >
          <component :is="control.icon" :size="17" aria-hidden="true" />
        </button>
      </div>

      <div
        v-show="!showsInlineBlocks"
        ref="moreButtonContainer"
        class="editor-formatting-toolbar__more"
      >
        <button
          ref="moreTrigger"
          class="editor-formatting-toolbar__button"
          :aria-expanded="isMoreMenuOpen"
          aria-label="More formatting"
          aria-controls="editor-more-formatting"
          title="More formatting"
          type="button"
          @mousedown.prevent
          @click="toggleMoreMenu"
        >
          <MoreHorizontal :size="19" :stroke-width="1.8" aria-hidden="true" />
        </button>
        <div
          v-if="isMoreMenuOpen"
          id="editor-more-formatting"
          class="editor-formatting-toolbar__menu"
          role="group"
          aria-label="More formatting options"
        >
          <button
            v-for="control in blockControls"
            :key="control.style"
            type="button"
            :aria-pressed="isActive(control.style)"
            @mousedown.prevent
            @click="emitBlock(control.style)"
          >
            <component :is="control.icon" :size="17" aria-hidden="true" />
            <span>{{ control.label }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.editor-formatting-toolbar {
  position: relative;
  z-index: 4;
  display: flex;
  flex-direction: column;
  flex: 0 0 auto;
  align-items: stretch;
  overflow: visible;
  border-bottom: 1px solid var(--border);
  background: var(--surface);
}

.editor-formatting-toolbar__row {
  display: flex;
  min-height: 44px;
  align-items: center;
  gap: 7px;
  padding: 4px 12px;
}

.editor-formatting-toolbar__scroll-area {
  display: flex;
  min-width: 0;
  flex: 1;
  align-items: center;
  gap: 7px;
  overflow-x: auto;
  overflow-y: hidden;
  scrollbar-width: none;
}

.editor-formatting-toolbar__scroll-area::-webkit-scrollbar {
  display: none;
}

.editor-formatting-toolbar__group {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 2px;
}

.editor-formatting-toolbar__button {
  display: inline-grid;
  width: 34px;
  height: 34px;
  flex: 0 0 auto;
  place-items: center;
  border: 1px solid var(--border);
  border-radius: 7px;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
}

.editor-formatting-toolbar__button:hover,
.editor-formatting-toolbar__button[aria-expanded='true'] {
  border-color: var(--border);
  background: var(--panel);
  color: var(--text);
}

.editor-formatting-toolbar__button[aria-pressed='true'] {
  border-color: var(--accent-mid);
  background: var(--accent-light);
  color: var(--accent);
}

.editor-formatting-toolbar__button:focus-visible,
.editor-formatting-toolbar__heading:focus-within,
.editor-formatting-toolbar__menu button:focus-visible {
  outline: 2px solid var(--focus-ring);
  outline-offset: 2px;
}

.editor-formatting-toolbar__divider {
  width: 1px;
  height: 22px;
  flex: 0 0 auto;
  background: var(--border);
}

.editor-formatting-toolbar__heading {
  display: flex;
  height: 34px;
  flex: 0 0 auto;
  align-items: center;
  gap: 3px;
  padding: 0 5px;
  border: 1px solid transparent;
  border-radius: 7px;
  color: var(--text-muted);
}

.editor-formatting-toolbar__heading:hover {
  border-color: var(--border);
  background: var(--panel);
  color: var(--text);
}

.editor-formatting-toolbar__heading select {
  max-width: 72px;
  border: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  font-size: var(--font-size-ui-caption);
  cursor: pointer;
}

.editor-formatting-toolbar__heading select:focus-visible {
  outline: none;
}

.editor-formatting-toolbar__more {
  position: relative;
  flex: 0 0 auto;
}

.editor-formatting-toolbar__menu {
  display: flex;
  position: absolute;
  z-index: 1;
  top: calc(100% + 6px);
  right: 0;
  width: 190px;
  flex-direction: column;
  gap: 2px;
  padding: 6px;
  border: 1px solid var(--border);
  border-radius: 9px;
  background: var(--raised-bg);
  box-shadow: 0 10px 28px rgb(0 0 0 / 16%);
}

.editor-formatting-toolbar__menu button {
  display: flex;
  width: 100%;
  min-height: 38px;
  align-items: center;
  gap: 10px;
  padding: 0 10px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: var(--text);
  font: inherit;
  font-size: var(--font-size-ui-caption);
  text-align: left;
  cursor: pointer;
}

.editor-formatting-toolbar__menu button:hover {
  background: var(--panel);
}

.editor-formatting-toolbar__menu button[aria-pressed='true'] {
  background: var(--accent-light);
  color: var(--accent);
}

@media (max-width: 700px) {
  .editor-formatting-toolbar__row {
    min-height: 52px;
    gap: 5px;
    padding: 4px 8px;
  }

  .editor-formatting-toolbar__button {
    width: 44px;
    height: 44px;
  }
}

/* Landscape phones and tablets keep the desktop layout but still need touch targets. */
@media (pointer: coarse), (max-width: 1000px) and (max-height: 500px) {
  .editor-formatting-toolbar__button {
    width: 44px;
    height: 44px;
  }

  .editor-formatting-toolbar__heading {
    height: 44px;
  }

  .editor-formatting-toolbar__heading select {
    max-width: 96px;
    font-size: 16px;
  }
}
</style>

<script setup lang="ts">
import { shallowRef } from 'vue'
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

export type EditorFormattingCommand =
  | { direction: 'redo' | 'undo'; type: 'history' }
  | { level: 1 | 2 | 3 | 4 | 5 | 6; type: 'heading' }
  | {
      style: 'blockquote' | 'bullet-list' | 'code-block' | 'horizontal-rule' | 'numbered-list'
      type: 'block'
    }
  | { style: 'bold' | 'inline-code' | 'italic' | 'link'; type: 'style' }

const emit = defineEmits<{
  format: [command: EditorFormattingCommand]
}>()

const isMoreMenuOpen = shallowRef(false)

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
  if (!level) return

  emit('format', { level, type: 'heading' })
  target.value = ''
}
</script>

<template>
  <div class="editor-formatting-toolbar" role="toolbar" aria-label="Editor formatting">
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

      <div class="editor-formatting-toolbar__more">
        <button
          class="editor-formatting-toolbar__button"
          :aria-expanded="isMoreMenuOpen"
          aria-label="More formatting"
          aria-controls="editor-more-formatting"
          title="More formatting"
          type="button"
          @mousedown.prevent
          @click="isMoreMenuOpen = !isMoreMenuOpen"
        >
          <MoreHorizontal :size="19" :stroke-width="1.8" aria-hidden="true" />
        </button>
      </div>
    </div>

    <div
      v-if="isMoreMenuOpen"
      id="editor-more-formatting"
      class="editor-formatting-toolbar__menu"
      role="group"
      aria-label="More formatting options"
    >
      <button type="button" @mousedown.prevent @click="emitBlock('numbered-list')">
        <ListOrdered :size="17" aria-hidden="true" />
        <span>Numbered list</span>
      </button>
      <button type="button" @mousedown.prevent @click="emitBlock('blockquote')">
        <Quote :size="17" aria-hidden="true" />
        <span>Blockquote</span>
      </button>
      <button type="button" @mousedown.prevent @click="emitBlock('code-block')">
        <Code2 :size="17" aria-hidden="true" />
        <span>Code block</span>
      </button>
      <button type="button" @mousedown.prevent @click="emitBlock('horizontal-rule')">
        <Minus :size="17" aria-hidden="true" />
        <span>Horizontal rule</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.editor-formatting-toolbar {
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
  border: 1px solid transparent;
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
  font-size: 12px;
  cursor: pointer;
}

.editor-formatting-toolbar__heading select:focus-visible {
  outline: none;
}

.editor-formatting-toolbar__more {
  flex: 0 0 auto;
}

.editor-formatting-toolbar__menu {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  padding: 0 12px 8px;
}

.editor-formatting-toolbar__menu button {
  display: flex;
  width: auto;
  min-height: 36px;
  align-items: center;
  gap: 10px;
  padding: 0 9px;
  border: 1px solid var(--border);
  border-radius: 7px;
  background: transparent;
  color: var(--text);
  font: inherit;
  font-size: 12px;
  text-align: left;
  cursor: pointer;
}

.editor-formatting-toolbar__menu button:hover {
  background: var(--panel);
}

@media (max-width: 700px) {
  .editor-formatting-toolbar__row {
    min-height: 48px;
    gap: 5px;
    padding: 4px 8px;
  }

  .editor-formatting-toolbar__button {
    width: 40px;
    height: 40px;
  }
}
</style>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, shallowRef, useTemplateRef, watch } from 'vue'

import type { AppWindow } from '@/browser-window'

import { insertTextAtSelection } from '@/utils/insertTextAtSelection'

import type { FindMatch } from '../composables/useFindReplace'
import type { EditorScrollPayload } from '../types'

import FindReplaceBar from './FindReplaceBar.vue'
import MatchOverlay from './MatchOverlay.vue'

interface Props {
  activeMatchIndex?: number
  content: string
  findOpen?: boolean
  lineCount: number
  matchCase?: boolean
  matchCount?: number
  matches?: FindMatch[]
  query?: string
  replaceText?: string
  showReplace?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  activeMatchIndex: -1,
  findOpen: false,
  matchCase: false,
  matchCount: 0,
  matches: () => [],
  query: '',
  replaceText: '',
  showReplace: false,
})

const emit = defineEmits<{
  'find:close': []
  'find:next': []
  'find:previous': []
  'find:replace-all': []
  'find:replace-current': []
  'request-find': []
  'request-replace': []
  scroll: [payload: EditorScrollPayload]
  'update:content': [value: string]
  'update:match-case': [value: boolean]
  'update:query': [value: string]
  'update:replace-text': [value: string]
}>()

const editorRef = useTemplateRef<HTMLTextAreaElement>('editor')
const findReplaceBarRef = useTemplateRef<InstanceType<typeof FindReplaceBar>>('findReplaceBar')
const scrollbarWidth = shallowRef(0)
const scrollTop = shallowRef(0)
let resizeObserver: null | ResizeObserver = null

// Use computed for v-model to avoid direct prop mutation
const localContent = computed({
  get: () => props.content,
  set: (value: string) => emit('update:content', value),
})

function emitScroll(): void {
  const scrollState = getScrollState()
  if (!scrollState) return

  syncEditorMetrics()
  scrollTop.value = scrollState.scrollTop
  emit('scroll', scrollState)
}

// Expose focus method
function focus(): void {
  editorRef.value?.focus()
}

async function focusAtOffset(offset: number): Promise<void> {
  await setSelectionRange(offset, offset, true)
}

function focusFindQuery(): void {
  findReplaceBarRef.value?.focusQueryInput()
}

function getLineHeight(editor: HTMLTextAreaElement): number {
  const computedStyle = window.getComputedStyle(editor)
  const parsedLineHeight = Number.parseFloat(computedStyle.lineHeight)

  return Number.isFinite(parsedLineHeight) ? parsedLineHeight : 22
}

function getLineIndexForOffset(offset: number): number {
  const clampedOffset = Math.max(0, Math.min(offset, props.content.length))
  let lineIndex = 0

  for (let index = 0; index < clampedOffset; index += 1) {
    if (props.content[index] === '\n') {
      lineIndex += 1
    }
  }

  return lineIndex
}

function getScrollState(): EditorScrollPayload | null {
  const editor = editorRef.value
  if (!editor) return null

  return {
    clientHeight: editor.clientHeight,
    contentLength: props.content.length,
    lineHeight: getLineHeight(editor),
    scrollHeight: editor.scrollHeight,
    scrollTop: editor.scrollTop,
  }
}

function handleKeydown(event: KeyboardEvent): void {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'f') {
    event.preventDefault()
    event.stopPropagation()
    emit('request-find')
    return
  }

  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'h') {
    event.preventDefault()
    event.stopPropagation()
    emit('request-replace')
    return
  }

  if (event.key === 'Tab') {
    event.preventDefault()
    const editor = editorRef.value
    if (!editor) return

    const start = editor.selectionStart
    const end = editor.selectionEnd
    const newValue = editor.value.slice(0, start) + '  ' + editor.value.slice(end)
    localContent.value = newValue
    // Set cursor position after update
    setTimeout(() => {
      editor.selectionStart = editor.selectionEnd = start + 2
    }, 0)
  }
}

async function replaceAllContent(nextContent: string): Promise<void> {
  const editor = editorRef.value
  if (!editor) return

  editor.focus()
  await nextTick()
  editor.setSelectionRange(0, editor.value.length)
  const browserWindow = window as AppWindow

  if (browserWindow.desktop?.isDesktop) {
    await browserWindow.desktop.editing.insertText(nextContent)
    return
  }

  insertTextAtSelection(editor, nextContent, 0, editor.value.length)
}

async function replaceRange(start: number, end: number, replacement: string): Promise<void> {
  const editor = editorRef.value
  if (!editor) return

  const clampedStart = Math.max(0, Math.min(start, props.content.length))
  const clampedEnd = Math.max(clampedStart, Math.min(end, props.content.length))

  editor.focus()
  await nextTick()
  editor.setSelectionRange(clampedStart, clampedEnd)
  const browserWindow = window as AppWindow

  if (browserWindow.desktop?.isDesktop) {
    await browserWindow.desktop.editing.insertText(replacement)
    return
  }

  insertTextAtSelection(editor, replacement, clampedStart, clampedEnd)
}

async function setSelectionRange(start: number, end: number, shouldFocus = false): Promise<void> {
  const editor = editorRef.value
  if (!editor) return

  const clampedStart = Math.max(0, Math.min(start, props.content.length))
  const clampedEnd = Math.max(clampedStart, Math.min(end, props.content.length))
  const lineIndex = getLineIndexForOffset(clampedStart)
  const lineHeight = getLineHeight(editor)

  if (shouldFocus) {
    editor.focus()
  }

  await nextTick()
  editor.setSelectionRange(clampedStart, clampedEnd)
  editor.scrollTop = Math.max(0, lineIndex * lineHeight - editor.clientHeight / 2)
}

function syncEditorMetrics(): void {
  const editor = editorRef.value
  if (!editor) {
    scrollbarWidth.value = 0
    return
  }

  scrollbarWidth.value = Math.max(0, editor.offsetWidth - editor.clientWidth)
}

defineExpose({
  focus,
  focusAtOffset,
  focusFindQuery,
  getScrollState,
  replaceAllContent,
  replaceRange,
  setSelectionRange,
})

onMounted(() => {
  syncEditorMetrics()

  if (typeof ResizeObserver === 'undefined' || !editorRef.value) {
    return
  }

  resizeObserver = new ResizeObserver(() => {
    syncEditorMetrics()
  })
  resizeObserver.observe(editorRef.value)
})

onUnmounted(() => {
  resizeObserver?.disconnect()
  resizeObserver = null
})

watch(
  () => props.content,
  async () => {
    await nextTick()
    syncEditorMetrics()
  },
  { flush: 'post' },
)
</script>

<template>
  <div class="editor-pane">
    <div class="pane-header">
      <span class="pane-label">Markdown</span>
      <span class="line-count">{{ lineCount }} line{{ lineCount !== 1 ? 's' : '' }}</span>
    </div>

    <FindReplaceBar
      v-if="findOpen"
      ref="findReplaceBar"
      :active-match-number="activeMatchIndex >= 0 ? activeMatchIndex + 1 : 0"
      :match-case="matchCase"
      :match-count="matchCount"
      :query="query"
      :replace-text="replaceText"
      :show-replace="showReplace"
      @close="emit('find:close')"
      @next="emit('find:next')"
      @previous="emit('find:previous')"
      @replace-all="emit('find:replace-all')"
      @replace-current="emit('find:replace-current')"
      @update:match-case="emit('update:match-case', $event)"
      @update:query="emit('update:query', $event)"
      @update:replace-text="emit('update:replace-text', $event)"
    />

    <div class="editor-body">
      <MatchOverlay
        :active-match-index="activeMatchIndex"
        :content="content"
        :matches="findOpen ? matches : []"
        :scrollbar-width="scrollbarWidth"
        :scroll-top="scrollTop"
      />
      <textarea
        ref="editor"
        v-model="localContent"
        class="editor"
        spellcheck="false"
        placeholder="Write your markdown here...&#10;&#10;```mermaid&#10;graph LR&#10;  A --> B&#10;```"
        @keydown="handleKeydown"
        @scroll="emitScroll"
      ></textarea>
    </div>
  </div>
</template>

<style scoped>
.editor-pane {
  flex: 1;
  display: flex;
  flex-direction: column;
  border-right: 1px solid var(--border);
  min-width: 0;
}

.editor-body {
  position: relative;
  flex: 1;
  min-height: 0;
  background: var(--surface);
}

.pane-header {
  height: var(--pane-header-h);
  background: var(--panel);
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  padding: 0 var(--app-gutter);
  gap: 8px;
  flex-shrink: 0;
}

.pane-label {
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-faint);
}

.line-count {
  margin-left: auto;
  font-family: 'DM Mono', monospace;
  font-size: 11px;
  color: var(--text-faint);
}

.editor {
  flex: 1;
  width: 100%;
  height: 100%;
  position: relative;
  z-index: 1;
  background: transparent;
  color: transparent;
  border: none;
  outline: none;
  resize: none;
  padding: 24px;
  font-family: 'DM Mono', monospace;
  font-size: 13.5px;
  line-height: 1.7;
  tab-size: 2;
  caret-color: var(--text);
  text-shadow: 0 0 0 var(--text);
}

.editor::placeholder {
  color: var(--text-faint);
  text-shadow: none;
}

.editor::selection {
  background: color-mix(in srgb, var(--accent-light) 70%, transparent);
}

@media (max-width: 700px) {
  .line-count {
    display: none;
  }

  .editor {
    padding: 16px var(--app-gutter) 24px;
    font-size: 13px;
    line-height: 1.6;
  }
}
</style>

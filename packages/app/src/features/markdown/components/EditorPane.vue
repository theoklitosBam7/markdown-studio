<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, shallowRef, useTemplateRef, watch } from 'vue'

import type { AppWindow } from '@/browser-window'

import { insertTextAtSelection } from '@/utils/insertTextAtSelection'

import type { EditorFormattingCommand } from './EditorFormattingToolbar.vue'
import type { EditorScrollPayload, EditorWorkspaceFindState } from '../types'

type FindAction =
  | { type: 'close' }
  | { type: 'next' }
  | { type: 'open-replace' }
  | { type: 'open' }
  | { type: 'previous' }
  | { type: 'replace-all' }
  | { type: 'replace-current' }
  | { type: 'set-match-case'; value: boolean }
  | { type: 'set-query'; value: string }
  | { type: 'set-replace-text'; value: string }

import EditorFormattingToolbar from './EditorFormattingToolbar.vue'
import FindReplaceBar from './FindReplaceBar.vue'
import MatchOverlay from './MatchOverlay.vue'

interface Props {
  content: string
  documentPath?: null | string
  findState?: EditorWorkspaceFindState
  lineCount: number
}

const props = withDefaults(defineProps<Props>(), {
  documentPath: null,
  findState: () => ({
    activeMatchIndex: -1,
    isOpen: false,
    matchCase: false,
    matchCount: 0,
    matches: [],
    query: '',
    replaceText: '',
    showReplace: false,
  }),
})

const emit = defineEmits<{
  'find-action': [action: FindAction]
  scroll: [payload: EditorScrollPayload]
  'update:content': [value: string]
}>()

const editorRef = useTemplateRef<HTMLTextAreaElement>('editor')
const findReplaceBarRef = useTemplateRef<InstanceType<typeof FindReplaceBar>>('findReplaceBar')
const activeLineHeight = shallowRef(0)
const activeLineTop = shallowRef(0)
const isEditorFocused = shallowRef(false)
const isImageDragging = shallowRef(false)
const scrollbarWidth = shallowRef(0)
const scrollTop = shallowRef(0)
const rememberedSelection = shallowRef({ end: 0, start: 0 })
let resizeObserver: null | ResizeObserver = null

// Use computed for v-model to avoid direct prop mutation
const localContent = computed({
  get: () => props.content,
  set: (value: string) => emit('update:content', value),
})
const lineNumbers = computed(() =>
  Array.from({ length: Math.max(1, props.lineCount) }, (_, index) => index + 1),
)

async function applyFormattingCommand(command: EditorFormattingCommand): Promise<void> {
  const editor = editorRef.value
  if (!editor) return

  if (command.type === 'history') {
    editor.focus()
    editor.ownerDocument.execCommand(command.direction)
    return
  }

  const selection =
    editor.ownerDocument.activeElement === editor
      ? { end: editor.selectionEnd, start: editor.selectionStart }
      : rememberedSelection.value

  if (command.type === 'heading') {
    await formatHeading(editor, selection.start, selection.end, command.level)
    return
  }

  if (command.type === 'style') {
    await formatInlineStyle(editor, selection.start, selection.end, command.style)
    return
  }

  await formatBlock(editor, selection.start, selection.end, command.style)
}

function emitScroll(): void {
  const scrollState = getScrollState()
  if (!scrollState) return

  syncActiveLine()
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

async function formatBlock(
  editor: HTMLTextAreaElement,
  selectionStart: number,
  selectionEnd: number,
  style: 'blockquote' | 'bullet-list' | 'code-block' | 'horizontal-rule' | 'numbered-list',
): Promise<void> {
  if (style === 'horizontal-rule') {
    const lineBreak = selectionStart > 0 && editor.value[selectionStart - 1] !== '\n' ? '\n' : ''
    const replacement = `${lineBreak}---\n`
    const caret = selectionStart + replacement.length
    await replaceEditorRange(editor, selectionStart, selectionEnd, replacement, caret, caret)
    return
  }

  if (style === 'code-block') {
    const selectedText = editor.value.slice(selectionStart, selectionEnd) || 'code'
    const replacement = `\`\`\`\n${selectedText}\n\`\`\``
    const contentStart = selectionStart + 4
    await replaceEditorRange(
      editor,
      selectionStart,
      selectionEnd,
      replacement,
      contentStart,
      contentStart + selectedText.length,
    )
    return
  }

  const firstLineStart = editor.value.lastIndexOf('\n', Math.max(0, selectionStart - 1)) + 1
  const lastSelectedCharacter = selectionEnd > selectionStart ? selectionEnd - 1 : selectionStart
  const followingLineBreak = editor.value.indexOf('\n', lastSelectedCharacter)
  const lastLineEnd = followingLineBreak === -1 ? editor.value.length : followingLineBreak
  const lines = editor.value.slice(firstLineStart, lastLineEnd).split('\n')
  const linePrefix = {
    blockquote: '> ',
    'bullet-list': '- ',
    'numbered-list': '1. ',
  }[style]
  const replacement = lines.map((line) => `${linePrefix}${line}`).join('\n')
  const selectedBlock = selectionEnd > selectionStart
  const nextSelectionStart = selectedBlock ? firstLineStart : firstLineStart + linePrefix.length
  const nextSelectionEnd = selectedBlock ? firstLineStart + replacement.length : nextSelectionStart

  await replaceEditorRange(
    editor,
    firstLineStart,
    lastLineEnd,
    replacement,
    nextSelectionStart,
    nextSelectionEnd,
  )
}

async function formatHeading(
  editor: HTMLTextAreaElement,
  selectionStart: number,
  selectionEnd: number,
  level: 1 | 2 | 3 | 4 | 5 | 6,
): Promise<void> {
  const lineStart = editor.value.lastIndexOf('\n', Math.max(0, selectionStart - 1)) + 1
  const nextLineBreak = editor.value.indexOf('\n', selectionStart)
  const lineEnd = nextLineBreak === -1 ? editor.value.length : nextLineBreak
  const line = editor.value.slice(lineStart, lineEnd)
  const existingPrefix = /^#{1,6}\s+/.exec(line)?.[0] ?? ''
  const lineContent = line.slice(existingPrefix.length)
  const headingPrefix = `${'#'.repeat(level)} `
  const replacement = `${headingPrefix}${lineContent}`
  const caretInContent = Math.max(0, selectionStart - lineStart - existingPrefix.length)
  const nextSelectionStart =
    lineStart + headingPrefix.length + Math.min(caretInContent, lineContent.length)
  const selectionLength = Math.min(
    selectionEnd - selectionStart,
    lineContent.length - caretInContent,
  )

  await replaceEditorRange(
    editor,
    lineStart,
    lineEnd,
    replacement,
    nextSelectionStart,
    nextSelectionStart + selectionLength,
  )
}

async function formatInlineStyle(
  editor: HTMLTextAreaElement,
  start: number,
  end: number,
  style: 'bold' | 'inline-code' | 'italic' | 'link',
): Promise<void> {
  const selectedText = editor.value.slice(start, end)
  let replacement: string
  let selectionStart: number
  let selectionEnd: number

  if (style === 'link') {
    const linkText = selectedText || 'link text'
    replacement = `[${linkText}](url)`
    selectionStart = start + linkText.length + 3
    selectionEnd = selectionStart + 3
  } else {
    const styleTokens = {
      bold: { placeholder: 'bold text', token: '**' },
      'inline-code': { placeholder: 'code', token: '`' },
      italic: { placeholder: 'italic text', token: '*' },
    }
    const { placeholder, token } = styleTokens[style]
    const formattedText = selectedText || placeholder
    replacement = `${token}${formattedText}${token}`
    selectionStart = start + token.length
    selectionEnd = selectionStart + formattedText.length
  }

  await replaceEditorRange(editor, start, end, replacement, selectionStart, selectionEnd)
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

function handleDocumentSelectionChange(): void {
  const editor = editorRef.value
  if (!editor || editor.ownerDocument.activeElement !== editor) return

  rememberSelection(editor)
  syncActiveLine()
}

function handleDragLeave(): void {
  isImageDragging.value = false
}

function handleDragOver(event: DragEvent): void {
  const dataTransfer = event.dataTransfer
  if (!dataTransfer) {
    isImageDragging.value = false
    return
  }

  const hasSupportedImageItem = Array.from(dataTransfer.items ?? []).some(
    (item) => item.kind === 'file' && /image\/(gif|jpeg|png|svg\+xml|webp)/i.test(item.type),
  )
  isImageDragging.value =
    hasSupportedImageItem || Array.from(dataTransfer.files ?? []).some(isSupportedImage)
}

async function handleDrop(event: DragEvent): Promise<void> {
  isImageDragging.value = false
  const file = [...(event.dataTransfer?.files ?? [])].find(isSupportedImage)
  if (!file) return

  await insertImage(file)
}

function handleEditorBlur(): void {
  isEditorFocused.value = false
  rememberSelection()
}

function handleEditorSelection(): void {
  rememberSelection()
  syncActiveLine()
}

function handleKeydown(event: KeyboardEvent): void {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'f') {
    event.preventDefault()
    event.stopPropagation()
    emit('find-action', { type: 'open' })
    return
  }

  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'h') {
    event.preventDefault()
    event.stopPropagation()
    emit('find-action', { type: 'open-replace' })
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

async function insertImage(file: File): Promise<void> {
  const editor = editorRef.value
  const browserWindow = window as AppWindow
  const images = browserWindow.desktop?.images
  if (!editor || !props.documentPath || !browserWindow.desktop?.isDesktop || !images) return

  const start = editor.selectionStart
  const end = editor.selectionEnd
  const result = await images.save({
    data: new Uint8Array(await file.arrayBuffer()),
    documentPath: props.documentPath,
    filename: file.name,
  })

  editor.setSelectionRange(start, end)
  await insertText(`![${result.filename}](${result.relativePath})`)
}

async function insertText(text: string): Promise<void> {
  const editor = editorRef.value
  if (!editor) return

  const start = editor.selectionStart
  const end = editor.selectionEnd

  editor.focus()
  await nextTick()
  const browserWindow = window as AppWindow

  if (browserWindow.desktop?.isDesktop) {
    await browserWindow.desktop.editing.insertText(text)
    return
  }

  insertTextAtSelection(editor, text, start, end)
}

function isSupportedImage(file: File): boolean {
  return /\.(gif|jpe?g|png|svg|webp)$/i.test(file.name)
}

function rememberSelection(editor = editorRef.value): void {
  if (!editor) return

  rememberedSelection.value = {
    end: editor.selectionEnd,
    start: editor.selectionStart,
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

async function replaceEditorRange(
  editor: HTMLTextAreaElement,
  start: number,
  end: number,
  replacement: string,
  selectionStart: number,
  selectionEnd: number,
): Promise<void> {
  editor.focus()
  editor.setSelectionRange(start, end)
  await insertText(replacement)
  await nextTick()
  editor.setSelectionRange(selectionStart, selectionEnd)
  rememberSelection(editor)
  syncActiveLine()
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
  syncActiveLine()
}

function syncActiveLine(): void {
  const editor = editorRef.value
  if (!editor) return

  const computedStyle = window.getComputedStyle(editor)
  const lineHeight = getLineHeight(editor)
  const paddingTop = Number.parseFloat(computedStyle.paddingTop) || 0
  const caretOffset =
    editor.selectionDirection === 'backward' ? editor.selectionStart : editor.selectionEnd
  const lineIndex = getLineIndexForOffset(caretOffset)

  activeLineHeight.value = lineHeight
  activeLineTop.value = paddingTop + lineIndex * lineHeight - editor.scrollTop
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
  insertImage,
  insertText,
  replaceAllContent,
  replaceRange,
  setSelectionRange,
})

onMounted(() => {
  syncActiveLine()
  syncEditorMetrics()
  document.addEventListener('selectionchange', handleDocumentSelectionChange)

  if (typeof ResizeObserver === 'undefined' || !editorRef.value) {
    return
  }

  resizeObserver = new ResizeObserver(() => {
    syncActiveLine()
    syncEditorMetrics()
  })
  resizeObserver.observe(editorRef.value)
})

onUnmounted(() => {
  document.removeEventListener('selectionchange', handleDocumentSelectionChange)
  resizeObserver?.disconnect()
  resizeObserver = null
})

watch(
  () => props.content,
  async () => {
    await nextTick()
    syncActiveLine()
    syncEditorMetrics()
  },
  { flush: 'post' },
)
</script>

<template>
  <div
    class="editor-pane"
    @dragleave="handleDragLeave"
    @dragover.prevent="handleDragOver"
    @drop.prevent="handleDrop"
  >
    <div class="pane-header">
      <span class="pane-label">Markdown</span>
      <span class="line-count">{{ lineCount }} line{{ lineCount !== 1 ? 's' : '' }}</span>
    </div>

    <EditorFormattingToolbar @format="applyFormattingCommand" />

    <FindReplaceBar
      v-if="findState.isOpen"
      ref="findReplaceBar"
      :active-match-number="findState.activeMatchIndex >= 0 ? findState.activeMatchIndex + 1 : 0"
      :match-case="findState.matchCase"
      :match-count="findState.matchCount"
      :query="findState.query"
      :replace-text="findState.replaceText"
      :show-replace="findState.showReplace"
      @close="emit('find-action', { type: 'close' })"
      @next="emit('find-action', { type: 'next' })"
      @previous="emit('find-action', { type: 'previous' })"
      @replace-all="emit('find-action', { type: 'replace-all' })"
      @replace-current="emit('find-action', { type: 'replace-current' })"
      @update:match-case="emit('find-action', { type: 'set-match-case', value: $event })"
      @update:query="emit('find-action', { type: 'set-query', value: $event })"
      @update:replace-text="emit('find-action', { type: 'set-replace-text', value: $event })"
    />

    <div class="editor-body">
      <div v-show="isImageDragging" class="image-drop-overlay" aria-hidden="true">
        <div class="image-drop-message">
          <span class="image-drop-label">Drop image to add it</span>
          <span class="image-drop-hint">PNG, JPG, GIF, WebP, or SVG</span>
        </div>
      </div>
      <div
        class="active-line-highlight"
        :class="{ 'active-line-highlight--focused': isEditorFocused }"
        :style="{ height: `${activeLineHeight}px`, top: `${activeLineTop}px` }"
        aria-hidden="true"
      ></div>
      <ol
        class="editor-line-numbers"
        aria-hidden="true"
        :style="{ transform: `translateY(${-scrollTop}px)` }"
      >
        <li v-for="lineNumber in lineNumbers" :key="lineNumber">{{ lineNumber }}</li>
      </ol>
      <MatchOverlay
        :active-match-index="findState.activeMatchIndex"
        :content="content"
        :matches="findState.isOpen ? findState.matches : []"
        :scrollbar-width="scrollbarWidth"
        :scroll-top="scrollTop"
      />
      <textarea
        ref="editor"
        v-model="localContent"
        class="editor"
        spellcheck="false"
        placeholder="Write your markdown here...&#10;&#10;```mermaid&#10;graph LR&#10;  A --> B&#10;```"
        @blur="handleEditorBlur"
        @focus="isEditorFocused = true"
        @keydown="handleKeydown"
        @scroll="emitScroll"
        @select="handleEditorSelection"
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
  overflow: hidden;
  background: var(--surface);
}

.active-line-highlight {
  position: absolute;
  right: 0;
  left: 0;
  pointer-events: none;
  background: var(--editor-active-line-muted-bg);
}

.active-line-highlight--focused {
  background: var(--editor-active-line-bg);
}

.editor-line-numbers {
  position: absolute;
  z-index: 2;
  top: 0;
  bottom: 0;
  left: 0;
  width: 48px;
  margin: 0;
  padding: 24px 10px 24px 0;
  overflow: hidden;
  border-right: 1px solid var(--border);
  background: var(--panel);
  color: var(--text-faint);
  font-family: 'DM Mono', monospace;
  font-size: 11px;
  line-height: 22.95px;
  list-style: none;
  pointer-events: none;
  text-align: right;
  user-select: none;
}

.editor-line-numbers li {
  min-height: 22.95px;
}

.image-drop-overlay {
  position: absolute;
  inset: 12px;
  z-index: 3;
  display: grid;
  place-items: center;
  pointer-events: none;
  border: 2px dashed var(--accent);
  border-radius: 12px;
  background: color-mix(in srgb, var(--accent) 16%, var(--surface));
  box-shadow:
    0 0 0 12px color-mix(in srgb, var(--surface) 82%, transparent),
    0 16px 40px color-mix(in srgb, var(--accent) 22%, transparent);
}

.image-drop-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 16px 22px;
  border: 1px solid color-mix(in srgb, var(--accent) 45%, var(--border));
  border-radius: 10px;
  background: var(--panel);
  box-shadow: 0 8px 24px color-mix(in srgb, var(--text) 12%, transparent);
}

.image-drop-label {
  color: var(--text);
  font-size: 15px;
  font-weight: 600;
}

.image-drop-hint {
  color: var(--text-muted);
  font-family: 'DM Mono', monospace;
  font-size: 11px;
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
  padding: 24px 24px 24px 64px;
  font-family: 'DM Mono', monospace;
  font-size: 13.5px;
  line-height: 22.95px;
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
  .active-line-highlight {
    opacity: 0.72;
  }

  .line-count {
    display: none;
  }

  .editor {
    padding: 16px var(--app-gutter) 24px 52px;
    font-size: 13px;
    line-height: 20.8px;
  }

  .editor-line-numbers {
    width: 40px;
    padding-top: 16px;
    font-size: 10px;
    line-height: 20.8px;
  }

  .editor-line-numbers li {
    min-height: 20.8px;
  }
}
</style>

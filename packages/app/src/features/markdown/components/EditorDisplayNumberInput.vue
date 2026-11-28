<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, shallowRef, useId, useTemplateRef } from 'vue'

type EditSnapshot = { selectionEnd: number; selectionStart: number; value: string }

// Parent listeners such as blur and Enter belong on the input inside the frame.
defineOptions({ inheritAttrs: false })

const props = defineProps<{
  description: string
  invalid: boolean
  label: string
  max: number
  min: number
  step: number
  value: string
}>()
const emit = defineEmits<{
  update: [value: string]
}>()
const frame = useTemplateRef<HTMLIFrameElement>('frame')
const frameBody = shallowRef<HTMLElement | null>(null)
// The page does not match :focus on a frame whose content has focus, so the frame tracks it.
const hasFocus = shallowRef(false)
const input = useTemplateRef<HTMLInputElement>('input')
// aria-describedby IDs resolve only in the input's own document, so the description lives in the frame.
const descriptionId = useId()
const numericValue = computed(() => {
  if (props.invalid) return undefined
  const draft = props.value.trim()
  if (draft === '') return undefined
  const parsed = Number(draft.replace(',', '.'))
  return Number.isFinite(parsed) ? String(parsed) : undefined
})
const undoStack: EditSnapshot[] = []
const redoStack: EditSnapshot[] = []
const maxHistoryEntries = 100

function applySnapshot(element: HTMLInputElement, next: EditSnapshot): void {
  element.value = next.value
  element.setSelectionRange(next.selectionStart, next.selectionEnd)
  emit('update', next.value)
}

function attachFrame(): void {
  const frameDocument = frame.value?.contentDocument
  if (!frameDocument?.body) return

  if (!frameDocument.getElementById(frameStyleId)) {
    const style = frameDocument.createElement('style')
    style.id = frameStyleId
    style.textContent = frameStyles
    frameDocument.head.append(style)
  }
  syncFrameStyle()
  frameBody.value = frameDocument.body
}

// A page label cannot focus an input in another document, so the settings form calls this.
function focus(): void {
  input.value?.focus()
}

function handleBeforeInput(event: InputEvent): void {
  if (!event.cancelable || !input.value) return

  // Native edits in these fields must not clear the source editor's Redo stack.
  event.preventDefault()
  const element = input.value
  const { selectionEnd, selectionStart } = snapshot(element)
  let inserted: null | string = null
  let start = selectionStart
  let end = selectionEnd

  if (event.inputType === 'insertText' || event.inputType === 'insertReplacementText') {
    inserted = event.data
  } else if (event.inputType === 'insertFromPaste') {
    inserted = event.dataTransfer?.getData('text/plain') ?? event.data
  } else if (event.inputType === 'deleteContentBackward') {
    if (start === end && start > 0) start -= 1
    inserted = ''
  } else if (event.inputType === 'deleteWordBackward') {
    if (start === end) start = Math.max(0, element.value.slice(0, start).search(/\S+\s*$/u))
    inserted = ''
  } else if (
    event.inputType === 'deleteSoftLineBackward' ||
    event.inputType === 'deleteHardLineBackward'
  ) {
    if (start === end) start = 0
    inserted = ''
  } else if (event.inputType === 'deleteContentForward') {
    if (start === end && end < element.value.length) end += 1
    inserted = ''
  } else if (event.inputType === 'deleteWordForward') {
    if (start === end) {
      const following = element.value.slice(end)
      end += following.match(/^\s*\S+/u)?.[0].length ?? following.length
    }
    inserted = ''
  } else if (
    event.inputType === 'deleteSoftLineForward' ||
    event.inputType === 'deleteHardLineForward'
  ) {
    if (start === end) end = element.value.length
    inserted = ''
  } else if (event.inputType === 'deleteByCut' || event.inputType === 'deleteByDrag') {
    inserted = ''
  }

  if (inserted === null) return
  element.setSelectionRange(start, end)
  replaceSelection(element, inserted)
}

function handleCut(event: ClipboardEvent): void {
  if (!event.clipboardData || !input.value) return
  const element = input.value
  const { selectionEnd, selectionStart } = snapshot(element)
  if (selectionStart === selectionEnd) return

  event.preventDefault()
  event.clipboardData.setData('text/plain', element.value.slice(selectionStart, selectionEnd))
  replaceSelection(element, '')
}

function handleInput(): void {
  // The input belongs to the frame's window, so an instanceof check against this window fails.
  if (!input.value) return
  undoStack.length = 0
  redoStack.length = 0
  emit('update', input.value.value)
}

function handleKeydown(event: KeyboardEvent): void {
  const element = input.value
  if (!element) return

  if ((event.metaKey || event.ctrlKey) && !event.altKey) {
    const key = event.key.toLowerCase()
    if (key === 'z' || key === 'y') {
      event.preventDefault()
      event.stopPropagation()
      const source = key === 'z' && !event.shiftKey ? undoStack : redoStack
      const destination = source === undoStack ? redoStack : undoStack
      const previous = source.pop()
      if (!previous) return
      recordHistory(destination, snapshot(element))
      applySnapshot(element, previous)
    }
    return
  }

  if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return
  event.preventDefault()
  event.stopPropagation()
  const current = Number(element.value.replace(',', '.'))
  const base = Number.isFinite(current) ? current : props.min
  const position = (base - props.min) / props.step
  const nextStep =
    event.key === 'ArrowUp' ? Math.floor(position + 1e-8) + 1 : Math.ceil(position - 1e-8) - 1
  const nextValue = Math.min(props.max, Math.max(props.min, props.min + nextStep * props.step))
  const precision = Math.max(0, (String(props.step).split('.')[1] ?? '').length)
  const value = String(Number(nextValue.toFixed(precision)))
  recordHistory(undoStack, snapshot(element))
  redoStack.length = 0
  element.value = value
  element.setSelectionRange(value.length, value.length)
  emit('update', value)
}

function handlePaste(event: ClipboardEvent): void {
  if (!event.clipboardData || !input.value) return
  event.preventDefault()
  replaceSelection(input.value, event.clipboardData.getData('text/plain'))
}

function recordHistory(stack: EditSnapshot[], entry: EditSnapshot): void {
  stack.push(entry)
  if (stack.length > maxHistoryEntries) stack.shift()
}

function replaceSelection(element: HTMLInputElement, inserted: string): void {
  const previous = snapshot(element)
  const start = previous.selectionStart
  const end = previous.selectionEnd
  const nextValue = `${previous.value.slice(0, start)}${inserted}${previous.value.slice(end)}`
  const caret = start + inserted.length
  recordHistory(undoStack, previous)
  redoStack.length = 0
  element.setRangeText(inserted, start, end, 'end')
  element.setSelectionRange(caret, caret)
  emit('update', nextValue)
}

function snapshot(element: HTMLInputElement): EditSnapshot {
  return {
    selectionEnd: element.selectionEnd ?? element.value.length,
    selectionStart: element.selectionStart ?? element.value.length,
    value: element.value,
  }
}

// The frame document inherits no page styles, so it copies the text styles that the field shows.
// The settings panel closes when the theme changes, and a breakpoint change resizes the window.
function syncFrameStyle(): void {
  const frameDocument = frame.value?.contentDocument
  if (!frame.value || !frameDocument?.body) return
  const pageStyle = getComputedStyle(frame.value)
  frameDocument.documentElement.style.colorScheme = pageStyle.colorScheme
  Object.assign(frameDocument.body.style, {
    color: pageStyle.color,
    fontFamily: pageStyle.fontFamily,
    fontSize: pageStyle.fontSize,
    fontWeight: pageStyle.fontWeight,
  })
}

const frameStyleId = 'editor-display-number-input-style'
// The empty frame document renders in quirks mode, where Firefox does not resolve percentage heights.
// The frame's viewport height and a flex body make the input fill the frame in every browser.
const frameStyles = `
  html { overflow: hidden; }
  body { display: flex; height: 100vh; margin: 0; background: transparent; }
  input {
    box-sizing: border-box;
    flex: 1;
    min-width: 0;
    padding: 6px 0 6px 8px;
    border: 0;
    outline: none;
    background: transparent;
    color: inherit;
    font: inherit;
  }
  .visually-hidden {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }
`

defineExpose({ focus })

onMounted(() => {
  attachFrame()
  window.addEventListener('resize', syncFrameStyle)
})
onBeforeUnmount(() => window.removeEventListener('resize', syncFrameStyle))
</script>

<template>
  <!-- Each field has its own document so its native edits never share the source editor's Undo history. -->
  <iframe
    ref="frame"
    class="editor-display-number-input"
    :class="{ 'editor-display-number-input--focused': hasFocus }"
    :title="label"
    @load="attachFrame"
  ></iframe>
  <Teleport v-if="frameBody" :to="frameBody">
    <input
      ref="input"
      v-bind="$attrs"
      :aria-label="label"
      :aria-invalid="invalid"
      :aria-describedby="descriptionId"
      :aria-valuenow="numericValue"
      :aria-valuemin="min"
      :aria-valuemax="max"
      :min="min"
      :max="max"
      :step="step"
      :value="value"
      type="text"
      inputmode="decimal"
      autocomplete="off"
      autocapitalize="off"
      spellcheck="false"
      role="spinbutton"
      @input="handleInput"
      @beforeinput="handleBeforeInput"
      @paste="handlePaste"
      @cut="handleCut"
      @keydown="handleKeydown"
      @focus="hasFocus = true"
      @blur="hasFocus = false"
    />
    <span :id="descriptionId" class="visually-hidden">{{ description }}</span>
  </Teleport>
</template>

<style scoped>
.editor-display-number-input {
  display: block;
  min-width: 0;
  width: 100%;
  height: 32px;
  border: 0;
}

.editor-display-number-input--focused {
  outline: 2px solid var(--focus-ring);
  outline-offset: 2px;
}
</style>

<script setup lang="ts">
import { computed, useTemplateRef } from 'vue'

type EditSnapshot = { selectionEnd: number; selectionStart: number; value: string }

const props = defineProps<{
  describedBy: string
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
const input = useTemplateRef<HTMLInputElement>('input')
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

function handleInput(event: Event): void {
  if (!(event.target instanceof HTMLInputElement)) return
  undoStack.length = 0
  redoStack.length = 0
  emit('update', event.target.value)
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
</script>

<template>
  <input
    ref="input"
    :aria-label="label"
    :aria-invalid="invalid"
    :aria-describedby="describedBy"
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
  />
</template>

<script setup lang="ts">
import { onBeforeUnmount, shallowRef, useId, watch } from 'vue'

interface Props {
  controls: string
  disabled?: boolean
  instructions: string
  label: string
  max: number
  min: number
  value: number
  valueText: string
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
})

const emit = defineEmits<{
  cancel: []
  commit: []
  maximum: []
  minimum: []
  move: [displacement: number]
  reset: []
  start: []
  step: [direction: -1 | 1, large: boolean]
}>()

const descriptionId = useId()
let activePointer: { id: number; moved: boolean; startX: number; target: HTMLElement } | null = null
const isDragging = shallowRef(false)
let originalCursor = ''
let originalUserSelect = ''

function cancelGesture(releaseCapture = true) {
  const pointer = finishGesture()
  if (!pointer) return

  emit('cancel')
  if (releaseCapture) pointer.target.releasePointerCapture?.(pointer.id)
}

function finishGesture() {
  if (!activePointer) return null

  const pointer = activePointer
  activePointer = null
  isDragging.value = false
  restoreInteractionStyles()
  return pointer
}

function handleDoubleClick() {
  emit('reset')
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && activePointer) {
    event.preventDefault()
    cancelGesture()
    return
  }
  if (props.disabled) return

  if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
    event.preventDefault()
    emit('step', event.key === 'ArrowLeft' ? -1 : 1, event.shiftKey)
    return
  }

  if (event.key === 'Home') {
    event.preventDefault()
    emit('minimum')
    return
  }

  if (event.key === 'End') {
    event.preventDefault()
    emit('maximum')
  }
}

function handleLostPointerCapture(event: PointerEvent) {
  if (activePointer?.id === event.pointerId) cancelGesture(false)
}

function handlePointercancel(event: PointerEvent) {
  if (activePointer?.id === event.pointerId) cancelGesture()
}

function handlePointerdown(event: PointerEvent) {
  if (props.disabled || activePointer || !event.isPrimary || event.button !== 0) return

  const target = event.currentTarget as HTMLElement
  activePointer = {
    id: event.pointerId,
    moved: false,
    startX: event.clientX,
    target,
  }
  isDragging.value = true
  originalCursor = document.body.style.cursor
  originalUserSelect = document.body.style.userSelect
  document.body.style.cursor = 'col-resize'
  document.body.style.userSelect = 'none'
  target.setPointerCapture?.(event.pointerId)
  emit('start')
}

function handlePointermove(event: PointerEvent) {
  if (!activePointer || activePointer.id !== event.pointerId) return

  const displacement = event.clientX - activePointer.startX
  if (displacement === 0 && !activePointer.moved) return
  if (displacement !== 0) activePointer.moved = true
  emit('move', displacement)
}

function handlePointerup(event: PointerEvent) {
  if (!activePointer || activePointer.id !== event.pointerId) return

  const pointer = finishGesture()
  if (!pointer) return
  if (pointer.moved) emit('commit')
  pointer.target.releasePointerCapture?.(pointer.id)
}

function handleWindowBlur() {
  cancelGesture()
}

function handleWindowKeydown(event: KeyboardEvent) {
  if (event.key !== 'Escape' || !activePointer) return

  event.preventDefault()
  cancelGesture()
}

function restoreInteractionStyles() {
  document.body.style.cursor = originalCursor
  document.body.style.userSelect = originalUserSelect
}

watch(
  () => props.disabled,
  (disabled) => {
    if (disabled) cancelGesture()
  },
  { flush: 'sync' },
)

window.addEventListener('pointermove', handlePointermove)
window.addEventListener('pointerup', handlePointerup)
window.addEventListener('pointercancel', handlePointercancel)
window.addEventListener('blur', handleWindowBlur)
window.addEventListener('keydown', handleWindowKeydown)

onBeforeUnmount(() => {
  cancelGesture()
  window.removeEventListener('pointermove', handlePointermove)
  window.removeEventListener('pointerup', handlePointerup)
  window.removeEventListener('pointercancel', handlePointercancel)
  window.removeEventListener('blur', handleWindowBlur)
  window.removeEventListener('keydown', handleWindowKeydown)
})
</script>

<template>
  <div
    class="workspace-resize-divider"
    :class="{
      'workspace-resize-divider--disabled': disabled,
      'workspace-resize-divider--dragging': isDragging,
    }"
    role="separator"
    aria-orientation="vertical"
    :aria-controls="controls"
    :aria-label="label"
    :title="
      disabled
        ? 'Double-click to reset the width.'
        : 'Drag to resize. Double-click to reset. Use Left and Right Arrow when focused.'
    "
    :aria-valuenow="value"
    :aria-valuemin="min"
    :aria-valuemax="max"
    :aria-valuetext="valueText"
    :aria-describedby="descriptionId"
    :tabindex="disabled ? -1 : 0"
    @pointerdown="handlePointerdown"
    @lostpointercapture="handleLostPointerCapture"
    @keydown="handleKeydown"
    @dblclick="handleDoubleClick"
  >
    <span class="workspace-resize-divider__line" aria-hidden="true" />
    <span class="workspace-resize-divider__grip" aria-hidden="true" />
    <span :id="descriptionId" class="workspace-resize-divider__instructions">
      {{ instructions }}
    </span>
  </div>
</template>

<style scoped>
.workspace-resize-divider {
  position: relative;
  z-index: 1;
  display: flex;
  flex: 0 0 24px;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 100%;
  cursor: col-resize;
  touch-action: none;
  outline: none;
}

.workspace-resize-divider__line {
  position: absolute;
  inset-block: 0;
  width: 1px;
  background: var(--border);
  transition: background-color 120ms ease;
}

.workspace-resize-divider__grip {
  z-index: 1;
  width: 5px;
  height: 28px;
  border-radius: 3px;
  background: var(--border-dark);
  box-shadow: 0 0 0 4px var(--surface);
  transition: background-color 120ms ease;
}

.workspace-resize-divider__instructions {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}

.workspace-resize-divider:not(.workspace-resize-divider--disabled):hover
  .workspace-resize-divider__line,
.workspace-resize-divider:not(.workspace-resize-divider--disabled):focus-visible
  .workspace-resize-divider__line,
.workspace-resize-divider--dragging .workspace-resize-divider__line {
  background: var(--accent);
}

.workspace-resize-divider:not(.workspace-resize-divider--disabled):focus-visible {
  outline: 2px solid var(--focus-ring);
  outline-offset: -2px;
}

.workspace-resize-divider--dragging .workspace-resize-divider__grip {
  background: var(--accent);
}

.workspace-resize-divider--disabled {
  cursor: default;
}
</style>

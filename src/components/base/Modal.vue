<script setup lang="ts">
import { onMounted, onUnmounted, useId } from 'vue'

interface Props {
  isOpen: boolean
  titleId?: string
}

const props = defineProps<Props>()
const generatedTitleId = useId()

const emit = defineEmits<{
  close: []
}>()

const titleId = props.titleId ?? generatedTitleId

function handleClose(): void {
  emit('close')
}

function handleKeydown(e: KeyboardEvent): void {
  if (e.key === 'Escape' && props.isOpen) {
    handleClose()
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <div :class="['modal-overlay', { open: props.isOpen }]">
    <div class="modal" role="dialog" aria-modal="true" :aria-labelledby="titleId">
      <div class="modal-header">
        <slot name="header" :title-id="titleId" />
        <button class="modal-close" type="button" aria-label="Close dialog" @click="handleClose">
          ×
        </button>
      </div>
      <div class="modal-body">
        <slot />
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.2s;
}

.modal-overlay.open {
  opacity: 1;
  pointer-events: all;
}

.modal {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 12px;
  width: 580px;
  max-width: calc(100vw - 2 * var(--app-gutter));
  max-height: 75vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transform: translateY(8px);
  transition: transform 0.2s;
}

.modal-overlay.open .modal {
  transform: translateY(0);
}

.modal-header {
  padding: 16px 20px;
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
}

.modal-header :deep(h2) {
  font-family: 'Fraunces', serif;
  font-weight: 400;
  font-size: 17px;
  margin: 0;
}

.modal-close {
  margin-left: auto;
  cursor: pointer;
  font-size: 18px;
  color: var(--text-muted);
  background: none;
  border: none;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-body {
  padding: 16px 20px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

@media (max-width: 700px) {
  .modal-overlay {
    align-items: flex-end;
  }

  .modal {
    width: 100%;
    max-width: 100%;
    max-height: min(82dvh, 82vh);
    border-radius: 16px 16px 0 0;
    transform: translateY(20px);
  }

  .modal-header {
    padding: 14px 16px;
  }

  .modal-body {
    padding: 14px 16px 18px;
  }
}
</style>

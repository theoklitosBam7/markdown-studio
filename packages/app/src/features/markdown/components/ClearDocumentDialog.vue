<script setup lang="ts">
import Modal from '@/components/base/Modal.vue'

interface Props {
  isOpen: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  cancel: []
  confirm: []
}>()
</script>

<template>
  <Modal :is-open="props.isOpen" @close="emit('cancel')">
    <template #header="{ titleId }">
      <h2 :id="titleId">Clear this document?</h2>
    </template>
    <p class="clear-dialog__message">
      This removes the current Markdown Document and starts a new one. Unsaved changes cannot be
      recovered.
    </p>
    <div class="clear-dialog__actions">
      <button type="button" aria-label="Cancel clear" @click="emit('cancel')">Cancel</button>
      <button
        type="button"
        class="clear-dialog__confirm"
        aria-label="Confirm clear"
        @click="emit('confirm')"
      >
        Clear document
      </button>
    </div>
  </Modal>
</template>

<style scoped>
.clear-dialog__message {
  color: var(--text-muted);
  font-size: var(--font-size-ui-caption);
  line-height: 1.5;
  margin: 0;
}

.clear-dialog__actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 12px;
}

.clear-dialog__actions button {
  min-height: 34px;
  padding: 0 14px;
  border: 1px solid var(--border);
  border-radius: 7px;
  background: var(--surface);
  color: var(--text);
  font: inherit;
  font-size: var(--font-size-ui-caption);
  cursor: pointer;
}

.clear-dialog__actions button:hover {
  border-color: var(--border-dark);
  background: var(--panel);
}

.clear-dialog__actions .clear-dialog__confirm {
  border-color: var(--error-border);
  background: var(--error-bg);
  color: var(--error-text);
  font-weight: 600;
}

.clear-dialog__actions .clear-dialog__confirm:hover {
  border-color: var(--error-text);
  background: var(--error-bg);
}
</style>

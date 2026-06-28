<script setup lang="ts">
import { useTemplateRef } from 'vue'

import Modal from '@/components/base/Modal.vue'

import { TABLE_DIMENSION_BOUNDS } from '../utils/tableDimensions'

interface Props {
  columns: number
  isOpen: boolean
  maxColumns?: number
  maxRows?: number
  minColumns?: number
  minRows?: number
  rows: number
}

const props = withDefaults(defineProps<Props>(), {
  maxColumns: TABLE_DIMENSION_BOUNDS.maxColumns,
  maxRows: TABLE_DIMENSION_BOUNDS.maxRows,
  minColumns: TABLE_DIMENSION_BOUNDS.minColumns,
  minRows: TABLE_DIMENSION_BOUNDS.minRows,
})

const emit = defineEmits<{
  cancel: []
  confirm: []
  'update:columns': [columns: number]
  'update:rows': [rows: number]
}>()
const formRef = useTemplateRef<HTMLFormElement>('form')

function handleCancel(): void {
  emit('cancel')
}

function handleColumnsInput(event: Event): void {
  const input = event.target as HTMLInputElement
  emit('update:columns', input.valueAsNumber)
}

function handleEnterKey(event: KeyboardEvent): void {
  event.preventDefault()
  formRef.value?.requestSubmit()
}

function handleRowsInput(event: Event): void {
  const input = event.target as HTMLInputElement
  emit('update:rows', input.valueAsNumber)
}

function handleSubmit(): void {
  emit('confirm')
}
</script>

<template>
  <Modal :is-open="props.isOpen" @close="handleCancel">
    <template #header="{ titleId }">
      <h2 :id="titleId">Insert table</h2>
    </template>

    <form ref="form" class="table-dimension-form" @submit.prevent="handleSubmit">
      <div class="table-dimension-form__fields">
        <label class="table-dimension-form__field">
          <span>Columns</span>
          <input
            aria-label="Columns"
            :max="props.maxColumns"
            :min="props.minColumns"
            required
            type="number"
            :value="props.columns"
            @keydown.enter="handleEnterKey"
            @input="handleColumnsInput"
          />
        </label>

        <span class="table-dimension-form__separator" aria-hidden="true">×</span>

        <label class="table-dimension-form__field">
          <span>Rows</span>
          <input
            aria-label="Rows"
            :max="props.maxRows"
            :min="props.minRows"
            required
            type="number"
            :value="props.rows"
            @keydown.enter="handleEnterKey"
            @input="handleRowsInput"
          />
        </label>
      </div>

      <div class="table-dimension-form__actions">
        <button class="table-dimension-form__cancel" type="button" @click="handleCancel">
          Cancel
        </button>
        <button class="table-dimension-form__confirm" type="submit">Insert table</button>
      </div>
    </form>
  </Modal>
</template>

<style scoped>
.table-dimension-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.table-dimension-form__fields {
  display: flex;
  align-items: flex-end;
  justify-content: center;
  gap: 14px;
}

.table-dimension-form__field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
}

.table-dimension-form__field span {
  font-size: 12px;
  font-weight: 500;
  color: var(--text-muted);
}

.table-dimension-form__field input {
  width: 100%;
  height: 44px;
  padding: 0 12px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--surface);
  color: var(--text);
  font-family: 'DM Sans', sans-serif;
  font-size: 15px;
}

.table-dimension-form__field input:focus {
  outline: none;
  border-color: var(--accent);
}

.table-dimension-form__separator {
  padding-bottom: 10px;
  color: var(--text-muted);
  font-size: 15px;
}

.table-dimension-form__actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.table-dimension-form__actions button {
  height: 36px;
  padding: 0 16px;
  border-radius: 8px;
  font-family: 'DM Sans', sans-serif;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  border: 1px solid var(--border);
}

.table-dimension-form__cancel {
  background: transparent;
  color: var(--text);
}

.table-dimension-form__confirm {
  background: var(--accent);
  color: white;
  border-color: var(--accent);
}

@media (max-width: 700px) {
  .table-dimension-form__fields {
    gap: 10px;
  }
}
</style>

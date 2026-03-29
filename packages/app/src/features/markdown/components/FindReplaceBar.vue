<script setup lang="ts">
import { computed, useTemplateRef } from 'vue'

interface Props {
  activeMatchNumber: number
  matchCase: boolean
  matchCount: number
  query: string
  replaceText: string
  showReplace: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  close: []
  next: []
  previous: []
  replaceAll: []
  replaceCurrent: []
  'update:match-case': [value: boolean]
  'update:query': [value: string]
  'update:replace-text': [value: string]
}>()

const queryInputRef = useTemplateRef<HTMLInputElement>('queryInput')
const statusText = computed(() => `${props.activeMatchNumber} of ${props.matchCount}`)

function focusQueryInput(): void {
  queryInputRef.value?.focus()
  queryInputRef.value?.select()
}

function handleKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape') {
    event.preventDefault()
    emit('close')
    return
  }

  if (event.key !== 'Enter') {
    return
  }

  event.preventDefault()
  if (event.shiftKey) {
    emit('previous')
    return
  }

  emit('next')
}

function preserveFocusOnMouseDown(event: MouseEvent): void {
  event.preventDefault()
}

function updateMatchCase(): void {
  emit('update:match-case', !props.matchCase)
}

defineExpose({ focusQueryInput })
</script>

<template>
  <div class="find-replace-bar" @keydown.capture="handleKeydown">
    <div class="find-replace-bar__row">
      <input
        ref="queryInput"
        :value="query"
        class="find-replace-bar__input"
        placeholder="Find"
        type="text"
        @input="emit('update:query', ($event.target as HTMLInputElement).value)"
      />

      <span class="find-replace-bar__status" aria-live="polite">{{ statusText }}</span>

      <button
        :aria-pressed="matchCase"
        class="find-replace-bar__toggle"
        type="button"
        @mousedown="preserveFocusOnMouseDown"
        @click="updateMatchCase"
      >
        Aa
      </button>

      <button
        :disabled="matchCount === 0"
        class="find-replace-bar__button"
        type="button"
        @mousedown="preserveFocusOnMouseDown"
        @click="emit('previous')"
      >
        Prev
      </button>
      <button
        :disabled="matchCount === 0"
        class="find-replace-bar__button"
        type="button"
        @mousedown="preserveFocusOnMouseDown"
        @click="emit('next')"
      >
        Next
      </button>
      <button
        class="find-replace-bar__button"
        type="button"
        @mousedown="preserveFocusOnMouseDown"
        @click="emit('close')"
      >
        Close
      </button>
    </div>

    <div v-if="showReplace" class="find-replace-bar__row">
      <input
        :value="replaceText"
        class="find-replace-bar__input"
        placeholder="Replace"
        type="text"
        @input="emit('update:replace-text', ($event.target as HTMLInputElement).value)"
      />
      <button
        :disabled="matchCount === 0"
        class="find-replace-bar__button"
        type="button"
        @mousedown="preserveFocusOnMouseDown"
        @click="emit('replaceCurrent')"
      >
        Replace
      </button>
      <button
        :disabled="matchCount === 0"
        class="find-replace-bar__button"
        type="button"
        @mousedown="preserveFocusOnMouseDown"
        @click="emit('replaceAll')"
      >
        Replace All
      </button>
    </div>
  </div>
</template>

<style scoped>
.find-replace-bar {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px var(--app-gutter);
  background: color-mix(in srgb, var(--surface) 90%, var(--panel));
  border-bottom: 1px solid var(--border);
}

.find-replace-bar__row {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.find-replace-bar__input {
  min-width: 0;
  flex: 1;
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--text);
  padding: 8px 10px;
  border-radius: 10px;
  outline: none;
}

.find-replace-bar__input:focus {
  border-color: var(--border-dark);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent-light) 70%, transparent);
}

.find-replace-bar__status {
  min-width: 52px;
  font-family: 'DM Mono', monospace;
  font-size: 11px;
  color: var(--text-muted);
  text-align: center;
}

.find-replace-bar__toggle,
.find-replace-bar__button {
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--text);
  border-radius: 10px;
  padding: 8px 10px;
}

.find-replace-bar__toggle[aria-pressed='true'],
.find-replace-bar__button:hover:not(:disabled),
.find-replace-bar__toggle:hover {
  background: var(--panel);
  border-color: var(--border-dark);
}

.find-replace-bar__button:disabled {
  color: var(--text-faint);
  cursor: not-allowed;
}

@media (max-width: 700px) {
  .find-replace-bar__row {
    flex-wrap: wrap;
  }

  .find-replace-bar__status {
    order: 10;
    min-width: auto;
    margin-left: auto;
  }
}
</style>

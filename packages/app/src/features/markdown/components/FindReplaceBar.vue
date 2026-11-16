<script setup lang="ts">
import { ChevronDown, ChevronUp, Replace, ReplaceAll, X } from '@lucide/vue'
import { useTemplateRef } from 'vue'

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

      <span
        class="find-replace-bar__count"
        :aria-label="`${activeMatchNumber} of ${matchCount} matches`"
        aria-live="polite"
      >
        {{ activeMatchNumber }}/{{ matchCount }}
      </span>

      <button
        aria-label="Match case"
        title="Match case"
        :aria-pressed="matchCase"
        class="find-replace-bar__toggle"
        type="button"
        @mousedown="preserveFocusOnMouseDown"
        @click="updateMatchCase"
      >
        Aa
      </button>

      <button
        aria-label="Find previous"
        title="Find previous (Shift+Enter)"
        class="find-replace-bar__icon-button"
        type="button"
        :disabled="matchCount === 0"
        @mousedown="preserveFocusOnMouseDown"
        @click="emit('previous')"
      >
        <ChevronUp :size="16" :stroke-width="1.8" aria-hidden="true" />
      </button>
      <button
        aria-label="Find next"
        title="Find next (Enter)"
        class="find-replace-bar__icon-button"
        type="button"
        :disabled="matchCount === 0"
        @mousedown="preserveFocusOnMouseDown"
        @click="emit('next')"
      >
        <ChevronDown :size="16" :stroke-width="1.8" aria-hidden="true" />
      </button>
      <button
        aria-label="Close find"
        title="Close (Escape)"
        class="find-replace-bar__icon-button"
        type="button"
        @mousedown="preserveFocusOnMouseDown"
        @click="emit('close')"
      >
        <X :size="16" :stroke-width="1.8" aria-hidden="true" />
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
        aria-label="Replace current"
        title="Replace current"
        class="find-replace-bar__icon-button"
        type="button"
        :disabled="matchCount === 0"
        @mousedown="preserveFocusOnMouseDown"
        @click="emit('replaceCurrent')"
      >
        <Replace :size="16" :stroke-width="1.8" aria-hidden="true" />
      </button>
      <button
        aria-label="Replace all"
        title="Replace all"
        class="find-replace-bar__icon-button"
        type="button"
        :disabled="matchCount === 0"
        @mousedown="preserveFocusOnMouseDown"
        @click="emit('replaceAll')"
      >
        <ReplaceAll :size="16" :stroke-width="1.8" aria-hidden="true" />
      </button>
    </div>
  </div>
</template>

<style scoped>
.find-replace-bar {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 6px var(--app-gutter);
  background: color-mix(in srgb, var(--surface) 90%, var(--panel));
  border-bottom: 1px solid var(--border);
}

.find-replace-bar__row {
  display: flex;
  align-items: center;
  gap: 4px;
  min-width: 0;
}

.find-replace-bar__input {
  min-width: 0;
  flex: 1;
  height: 30px;
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--text);
  padding: 0 8px;
  border-radius: 6px;
  outline: none;
  font-size: var(--font-size-ui-caption);
}

.find-replace-bar__input:focus {
  border-color: var(--border-dark);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent-light) 70%, transparent);
}

.find-replace-bar__count {
  min-width: 42px;
  font-family: 'DM Mono', monospace;
  font-size: var(--font-size-ui-caption);
  font-variant-numeric: tabular-nums;
  color: var(--text-muted);
  text-align: center;
}

.find-replace-bar__toggle,
.find-replace-bar__icon-button {
  display: grid;
  flex: 0 0 auto;
  width: 30px;
  height: 30px;
  place-items: center;
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--text-muted);
  border-radius: 6px;
  font-family: 'DM Mono', monospace;
  font-size: var(--font-size-ui-caption);
  cursor: pointer;
}

.find-replace-bar__toggle[aria-pressed='true'],
.find-replace-bar__toggle:hover,
.find-replace-bar__icon-button:hover:not(:disabled) {
  background: var(--panel);
  border-color: var(--border-dark);
  color: var(--text);
}

.find-replace-bar__icon-button:disabled {
  color: var(--text-faint);
  cursor: not-allowed;
}

@media (max-width: 700px) {
  .find-replace-bar__row {
    flex-wrap: wrap;
  }

  .find-replace-bar__count {
    order: 10;
    margin-left: auto;
  }
}
</style>

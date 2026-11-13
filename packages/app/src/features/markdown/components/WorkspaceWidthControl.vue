<script setup lang="ts">
import { RotateCcw, X } from '@lucide/vue'
import { nextTick, shallowRef, useId, useTemplateRef, watch } from 'vue'

const props = defineProps<{
  disabled: boolean
  explanation?: string
  fieldLabel: string
  inputLabel: string
  label: string
  max: number
  min: number
  notice?: null | string
  resetLabel: string
  step: number
  unit: '%' | 'px'
  value: number
}>()
const emit = defineEmits<{ apply: [value: number]; reset: [] }>()
const panelId = useId()
const isOpen = shallowRef(false)
const inputValue = shallowRef<number | string>('')
const control = useTemplateRef<HTMLElement>('control')
const trigger = useTemplateRef<HTMLButtonElement>('trigger')
const input = useTemplateRef<HTMLInputElement>('input')

async function apply(): Promise<void> {
  if (props.disabled || inputValue.value === '') return
  const value = Number(inputValue.value)
  if (!Number.isFinite(value)) return
  emit('apply', value)
  await nextTick()
  inputValue.value = String(props.value)
}

function close(): void {
  isOpen.value = false
  trigger.value?.focus()
}

async function toggle(): Promise<void> {
  inputValue.value = String(props.value)
  isOpen.value = !isOpen.value
  if (!isOpen.value) return
  await nextTick()
  input.value?.focus()
}

watch(isOpen, (open, _previous, onCleanup) => {
  if (!open) return

  function dismissOutside(event: Event): void {
    if (event.target instanceof Node && !control.value?.contains(event.target)) {
      isOpen.value = false
    }
  }

  document.addEventListener('click', dismissOutside, true)
  document.addEventListener('focusin', dismissOutside)
  onCleanup(() => {
    document.removeEventListener('click', dismissOutside, true)
    document.removeEventListener('focusin', dismissOutside)
  })
})

watch(
  () => props.value,
  (value) => {
    inputValue.value = String(value)
  },
)
</script>

<template>
  <div ref="control" class="workspace-width-control" @keydown.esc.stop.prevent="close">
    <button
      ref="trigger"
      class="workspace-width-control__trigger"
      type="button"
      :aria-label="label"
      :title="label"
      :aria-expanded="isOpen"
      :aria-controls="panelId"
      @click="toggle"
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path
          d="M6 3v10M10 3v10M4 6 2 8l2 2M12 6l2 2-2 2"
          stroke="currentColor"
          stroke-width="1.25"
        />
      </svg>
    </button>
    <div v-if="isOpen || notice" class="workspace-width-control__popover">
      <form
        v-if="isOpen"
        :id="panelId"
        class="workspace-width-control__panel"
        :aria-label="label"
        novalidate
        @submit.prevent="apply"
      >
        <div class="workspace-width-control__header">
          <span class="workspace-width-control__title">{{ label }}</span>
          <button
            class="workspace-width-control__close"
            type="button"
            aria-label="Close width controls"
            @click="close"
          >
            <X :size="14" aria-hidden="true" />
          </button>
        </div>
        <div class="workspace-width-control__row">
          <label class="workspace-width-control__label">
            <span>{{ fieldLabel }}</span>
            <span class="workspace-width-control__value">
              <input
                ref="input"
                v-model="inputValue"
                :aria-label="inputLabel"
                :aria-describedby="explanation ? `${panelId}-help` : undefined"
                name="width"
                autocomplete="off"
                type="number"
                :min="min"
                :max="max"
                :step="step"
                :disabled="disabled"
              />
              <span class="workspace-width-control__unit" aria-hidden="true">{{ unit }}</span>
            </span>
          </label>
          <button class="workspace-width-control__apply" type="submit" :disabled="disabled">
            Apply
          </button>
        </div>
        <p v-if="explanation" :id="`${panelId}-help`" class="workspace-width-control__explanation">
          {{ explanation }}
        </p>
        <div class="workspace-width-control__footer">
          <button class="workspace-width-control__reset" type="button" @click="emit('reset')">
            <RotateCcw :size="13" aria-hidden="true" />
            {{ resetLabel }}
          </button>
        </div>
      </form>
      <p v-if="notice" class="workspace-width-control__notice" role="status">{{ notice }}</p>
    </div>
  </div>
</template>

<style scoped>
.workspace-width-control {
  position: absolute;
  z-index: 4;
  top: 8px;
  left: 0;
}

.workspace-width-control__trigger {
  display: grid;
  width: 24px;
  height: 24px;
  place-items: center;
  padding: 0;
  border: 1px solid var(--border);
  border-radius: 5px;
  background: var(--surface);
  color: var(--text-muted);
  cursor: pointer;
}

.workspace-width-control__trigger:hover,
.workspace-width-control__trigger[aria-expanded='true'] {
  color: var(--accent);
  border-color: var(--accent);
  background: var(--accent-light);
}

.workspace-width-control__popover {
  position: absolute;
  top: 30px;
  right: 0;
  width: 224px;
  padding: 12px;
  border: 1px solid var(--border);
  border-radius: 7px;
  background: var(--raised-bg);
  color: var(--text);
  box-shadow: 0 6px 20px rgb(0 0 0 / 12%);
  font-size: 12px;
}

.workspace-width-control__header,
.workspace-width-control__row,
.workspace-width-control__label {
  display: flex;
  align-items: center;
  gap: 8px;
}

.workspace-width-control__header {
  justify-content: space-between;
  margin-bottom: 10px;
}

.workspace-width-control__title {
  font-size: 13px;
  font-weight: 500;
}

.workspace-width-control__close {
  display: grid;
  place-items: center;
  width: 24px;
  height: 24px;
  padding: 0;
  border: 0;
  border-radius: 4px;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
}

.workspace-width-control__label {
  flex: 1;
  min-width: 0;
  color: var(--text-muted);
}

.workspace-width-control__value {
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 0;
  border: 1px solid var(--border-dark);
  border-radius: 4px;
  background: var(--surface);
}

.workspace-width-control__value input {
  min-width: 0;
  width: 100%;
  height: 30px;
  padding: 4px 0 4px 8px;
  border: 0;
  border-radius: 4px;
  background: transparent;
  color: var(--text);
  font: inherit;
  font-variant-numeric: tabular-nums;
}

.workspace-width-control__unit {
  padding: 0 7px 0 3px;
  color: var(--text-muted);
}

.workspace-width-control__apply {
  min-height: 32px;
  padding: 4px 12px;
  border: 1px solid var(--accent);
  border-radius: 4px;
  background: var(--accent);
  color: var(--accent-contrast);
  font: inherit;
  font-weight: 500;
  cursor: pointer;
}

.workspace-width-control__apply:hover:not(:disabled) {
  background: var(--accent-mid);
  border-color: var(--accent-mid);
}

.workspace-width-control__footer {
  margin-top: 12px;
  padding-top: 6px;
  border-top: 1px solid var(--border);
}

.workspace-width-control__reset {
  display: flex;
  align-items: center;
  gap: 6px;
  min-height: 28px;
  padding: 4px 6px;
  border: 0;
  border-radius: 4px;
  background: transparent;
  color: var(--text-muted);
  font: inherit;
  cursor: pointer;
}

.workspace-width-control__close:hover,
.workspace-width-control__reset:hover {
  background: var(--accent-light);
  color: var(--text);
}

.workspace-width-control__explanation {
  margin: 10px 0 0;
  color: var(--text-muted);
  line-height: 1.5;
}

.workspace-width-control__notice {
  margin: 0;
  line-height: 1.5;
}

.workspace-width-control__panel + .workspace-width-control__notice {
  margin-top: 12px;
  padding-top: 10px;
  border-top: 1px solid var(--border);
}

.workspace-width-control button:focus-visible,
.workspace-width-control__value:focus-within {
  outline: 2px solid var(--focus-ring);
  outline-offset: 2px;
}

.workspace-width-control__value input:focus-visible {
  outline: none;
}

.workspace-width-control button:disabled {
  cursor: default;
  opacity: 0.5;
}
</style>

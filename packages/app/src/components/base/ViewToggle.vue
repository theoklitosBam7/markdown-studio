<script setup lang="ts">
import { computed } from 'vue'

import type { ViewMode } from '@/features/markdown/types'

interface Props {
  availableModes?: ViewMode[]
  compact?: boolean
  modelValue: ViewMode
}

const props = withDefaults(defineProps<Props>(), {
  availableModes: () => ['editor', 'split', 'preview'],
  compact: false,
})

const emit = defineEmits<{
  'update:modelValue': [mode: ViewMode]
}>()

const allModes: { label: string; value: ViewMode }[] = [
  { label: 'Editor', value: 'editor' },
  { label: 'Split', value: 'split' },
  { label: 'Preview', value: 'preview' },
]

const activeMode = computed({
  get: () => props.modelValue,
  set: (value: ViewMode) => emit('update:modelValue', value),
})

const modes = computed(() => allModes.filter((mode) => props.availableModes.includes(mode.value)))

function setMode(mode: ViewMode): void {
  activeMode.value = mode
}
</script>

<template>
  <div :class="['view-toggle', { compact: props.compact }]">
    <button
      v-for="mode in modes"
      :key="mode.value"
      :data-mode="mode.value"
      :class="{ active: activeMode === mode.value }"
      type="button"
      @click="setMode(mode.value)"
    >
      {{ mode.label }}
    </button>
  </div>
</template>

<style scoped>
.view-toggle {
  display: flex;
  border: 1px solid var(--border);
  border-radius: 7px;
  overflow: hidden;
}

.view-toggle.compact {
  width: 100%;
}

.view-toggle button {
  height: 34px;
  padding: 0 10px;
  border: none;
  background: transparent;
  color: var(--text-muted);
  font-family: 'DM Sans', sans-serif;
  font-size: 11px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
}

.view-toggle.compact button {
  flex: 1;
  height: 36px;
  font-size: 13px;
  font-weight: 600;
  min-width: 36px;
}

.view-toggle button.active {
  background: var(--accent);
  color: white;
}

.view-toggle button:not(.active):hover {
  background: var(--panel);
  color: var(--text);
}

/* Mobile touch targets */
@media (max-width: 700px) {
  .view-toggle {
    border-radius: 10px;
  }

  .view-toggle button {
    height: 44px;
    font-size: 14px;
    min-width: 44px;
    padding: 0 14px;
  }
}
</style>

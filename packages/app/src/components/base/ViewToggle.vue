<script setup lang="ts">
import type { Component } from 'vue'

import { computed } from 'vue'
import { BookOpen, Columns2, PanelLeft } from '@lucide/vue'

import type { ViewMode } from '@/types/editor'

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

const allModes: { icon: Component; label: string; value: ViewMode }[] = [
  { icon: PanelLeft, label: 'Editor', value: 'editor' },
  { icon: Columns2, label: 'Split', value: 'split' },
  { icon: BookOpen, label: 'Preview', value: 'preview' },
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
      :aria-pressed="activeMode === mode.value"
      type="button"
      @click="setMode(mode.value)"
    >
      <component :is="mode.icon" :size="16" :stroke-width="1.8" aria-hidden="true" />
      <span>{{ mode.label }}</span>
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
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 38px;
  padding: 0 10px;
  border: none;
  background: transparent;
  color: var(--text-muted);
  font-family: 'DM Sans', sans-serif;
  font-size: 11px;
  font-weight: 500;
  cursor: pointer;
  transition:
    background-color 0.15s,
    color 0.15s;
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
  color: var(--accent-contrast);
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

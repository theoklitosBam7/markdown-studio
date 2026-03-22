<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue'

import type { ViewMode } from '@/features/markdown/types'

interface Props {
  modelValue: ViewMode
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [mode: ViewMode]
}>()

const modes: { label: string; value: ViewMode }[] = [
  { label: 'Editor', value: 'editor' },
  { label: 'Split', value: 'split' },
  { label: 'Preview', value: 'preview' },
]

const mobileBreakpoint = 700

const activeMode = computed({
  get: () => props.modelValue,
  set: (value: ViewMode) => emit('update:modelValue', value),
})

function setMode(mode: ViewMode): void {
  activeMode.value = mode
}

function syncMobileMode(): void {
  if (typeof window === 'undefined') return

  if (window.innerWidth <= mobileBreakpoint && props.modelValue === 'split') {
    activeMode.value = 'preview'
  }
}

onMounted(() => {
  syncMobileMode()
  window.addEventListener('resize', syncMobileMode)
})

onUnmounted(() => {
  window.removeEventListener('resize', syncMobileMode)
})
</script>

<template>
  <div class="view-toggle">
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

.view-toggle button {
  height: 28px;
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

.view-toggle button.active {
  background: var(--accent);
  color: white;
}

.view-toggle button:not(.active):hover {
  background: var(--panel);
  color: var(--text);
}

@media (max-width: 700px) {
  .view-toggle button[data-mode='split'] {
    display: none;
  }
}
</style>

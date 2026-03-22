<script setup lang="ts">
import { computed } from 'vue'

import type { Theme } from '@/features/markdown/types'

interface Props {
  modelValue: Theme
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [theme: Theme]
}>()

const themeIcon = computed(() => (props.modelValue === 'dark' ? '☀️' : '🌙'))

function toggle(): void {
  const newTheme: Theme = props.modelValue === 'light' ? 'dark' : 'light'
  emit('update:modelValue', newTheme)
}
</script>

<template>
  <button
    class="theme-toggle"
    type="button"
    :title="`Toggle ${modelValue === 'light' ? 'dark' : 'light'} mode`"
    :aria-label="`Toggle ${modelValue === 'light' ? 'dark' : 'light'} mode`"
    @click="toggle"
  >
    {{ themeIcon }}
  </button>
</template>

<style scoped>
.theme-toggle {
  width: 30px;
  height: 30px;
  border-radius: 6px;
  border: 1px solid var(--border);
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  transition: all 0.15s;
}

.theme-toggle:hover {
  background: var(--panel);
}
</style>

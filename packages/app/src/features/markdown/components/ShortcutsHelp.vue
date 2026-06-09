<script setup lang="ts">
import { computed } from 'vue'

import Modal from '@/components/base/Modal.vue'
import { formatShortcutLabel } from '@/utils/shortcutLabel'

import type { Shortcut } from '../types/shortcuts'

interface Props {
  isOpen: boolean
  shortcuts: Shortcut[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  close: []
}>()

type ShortcutGroup = Shortcut['group']

const grouped = computed(() => {
  const groups = new Map<ShortcutGroup, Shortcut[]>()

  for (const shortcut of props.shortcuts) {
    const existing = groups.get(shortcut.group)
    if (existing) {
      existing.push(shortcut)
    } else {
      groups.set(shortcut.group, [shortcut])
    }
  }

  return groups
})

function handleClose(): void {
  emit('close')
}
</script>

<template>
  <Modal :is-open="props.isOpen" @close="handleClose">
    <template #header="{ titleId }">
      <h2 :id="titleId">Keyboard Shortcuts</h2>
    </template>
    <div v-for="[group, items] in grouped" :key="group" class="shortcuts-group">
      <h3 class="shortcuts-group__title">{{ group }}</h3>
      <div v-for="shortcut in items" :key="shortcut.id" class="shortcuts-row">
        <span class="shortcuts-row__label">{{ shortcut.label }}</span>
        <span class="shortcuts-row__keys">{{ formatShortcutLabel(shortcut.keys) }}</span>
      </div>
    </div>
  </Modal>
</template>

<style scoped>
.shortcuts-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.shortcuts-group__title {
  font-family: 'DM Sans', sans-serif;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-muted);
  margin: 8px 0 2px;
}

.shortcuts-group:first-child .shortcuts-group__title {
  margin-top: 0;
}

.shortcuts-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 32px;
  padding: 4px 0;
}

.shortcuts-row__label {
  font-size: 13px;
  color: var(--text);
}

.shortcuts-row__keys {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border: 1px solid var(--border);
  border-radius: 5px;
  padding: 2px 7px;
  color: var(--text-muted);
  font-family: 'DM Mono', monospace;
  font-size: 11px;
  line-height: 1.3;
}
</style>

<script setup lang="ts">
import { computed } from 'vue'

import { formatShortcutLabel } from '@/utils/shortcutLabel'

import type { EditorWorkspaceCommand } from '../types/commands'

interface Props {
  command: EditorWorkspaceCommand
  isActive?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isActive: false,
})

const shortcutLabel = computed(() =>
  props.command.shortcut ? formatShortcutLabel(props.command.shortcut) : '',
)
</script>

<template>
  <div
    class="command-palette-item"
    :class="{
      'command-palette-item--active': isActive,
      'command-palette-item--disabled': command.disabledReason !== null,
    }"
  >
    <span class="command-palette-item__label">{{ command.title }}</span>
    <span v-if="command.isCurrent" class="command-palette-item__meta">Current</span>
    <span v-if="shortcutLabel" class="command-palette-item__shortcut">{{ shortcutLabel }}</span>
    <span v-if="command.disabledReason" class="command-palette-item__reason">
      {{ command.disabledReason }}
    </span>
  </div>
</template>

<style scoped>
.command-palette-item {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto auto;
  align-items: center;
  gap: 8px;
  min-height: 42px;
  padding: 8px 10px;
  border-radius: 7px;
  color: var(--text);
}

.command-palette-item--active {
  background: var(--panel);
}

.command-palette-item--disabled {
  color: color-mix(in srgb, var(--text) 54%, transparent);
}

.command-palette-item__label {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 13px;
  font-weight: 500;
}

.command-palette-item__meta,
.command-palette-item__shortcut {
  border: 1px solid var(--border);
  border-radius: 5px;
  padding: 2px 5px;
  color: var(--text-muted);
  font-family: 'DM Mono', monospace;
  font-size: 10px;
  line-height: 1.3;
}

.command-palette-item__meta {
  font-family: 'DM Sans', sans-serif;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.command-palette-item__reason {
  grid-column: 1 / -1;
  color: var(--text-faint);
  font-size: 12px;
  line-height: 1.35;
}
</style>

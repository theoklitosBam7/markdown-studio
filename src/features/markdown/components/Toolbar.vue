<script setup lang="ts">
import ThemeToggle from '@/components/base/ThemeToggle.vue'
import ToolbarButton from '@/components/base/ToolbarButton.vue'
import ViewToggle from '@/components/base/ViewToggle.vue'

import type { Theme, ViewMode } from '../types'

interface Props {
  isCopied: boolean
  theme: Theme
  viewMode: ViewMode
}

const props = defineProps<Props>()

const emit = defineEmits<{
  clear: []
  copy: []
  openExamples: []
  'update:theme': [theme: Theme]
  'update:viewMode': [mode: ViewMode]
}>()

function clear(): void {
  emit('clear')
}

function copy(): void {
  emit('copy')
}

function handleThemeChange(theme: Theme): void {
  emit('update:theme', theme)
}

function handleViewModeChange(mode: ViewMode): void {
  emit('update:viewMode', mode)
}

function openExamples(): void {
  emit('openExamples')
}
</script>

<template>
  <header class="toolbar">
    <span class="brand">Markdown <em>Studio</em></span>
    <div class="divider"></div>

    <ToolbarButton @click="openExamples">
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
        <rect x="2" y="2" width="5" height="5" rx="1" />
        <rect x="9" y="2" width="5" height="5" rx="1" />
        <rect x="2" y="9" width="5" height="5" rx="1" />
        <rect x="9" y="9" width="5" height="5" rx="1" />
      </svg>
      Examples
    </ToolbarButton>

    <ToolbarButton @click="clear">
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="M3 3l10 10M13 3L3 13" />
      </svg>
      Clear
    </ToolbarButton>

    <ToolbarButton @click="copy">
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
        <rect x="5" y="5" width="9" height="9" rx="1.5" />
        <path d="M11 5V3a1 1 0 00-1-1H3a1 1 0 00-1 1v7a1 1 0 001 1h2" />
      </svg>
      {{ isCopied ? '✓ Copied' : 'Copy MD' }}
    </ToolbarButton>

    <div class="spacer"></div>

    <ViewToggle :model-value="props.viewMode" @update:model-value="handleViewModeChange" />
    <ThemeToggle :model-value="props.theme" @update:model-value="handleThemeChange" />
  </header>
</template>

<style scoped>
.toolbar {
  height: var(--toolbar-h);
  background: var(--surface);
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  padding: 0 16px;
  gap: 12px;
  flex-shrink: 0;
  z-index: 10;
}

.brand {
  font-family: 'Fraunces', serif;
  font-size: 17px;
  font-weight: 300;
  letter-spacing: -0.02em;
  color: var(--accent);
  margin-right: 4px;
}

.brand em {
  font-style: italic;
  font-weight: 300;
}

.divider {
  width: 1px;
  height: 20px;
  background: var(--border);
  margin: 0 4px;
}

.spacer {
  flex: 1;
}
</style>

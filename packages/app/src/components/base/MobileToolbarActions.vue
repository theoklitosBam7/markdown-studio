<script setup lang="ts">
import { computed, shallowRef } from 'vue'

import type { Theme, ViewMode } from '@/features/markdown/types'

import { GITHUB_REPO_URL } from '@/utils/constants'

import MobileActionSheet from './MobileActionSheet.vue'
import ThemeToggle from './ThemeToggle.vue'
import ToolbarButton from './ToolbarButton.vue'
import ViewToggle from './ViewToggle.vue'

interface Props {
  availableModes?: ViewMode[]
  canInstall?: boolean
  canOpenDocuments?: boolean
  canSaveDocuments?: boolean
  isCopied: boolean
  theme: Theme
  viewMode: ViewMode
}

const props = withDefaults(defineProps<Props>(), {
  availableModes: () => ['editor', 'preview'],
  canInstall: false,
  canOpenDocuments: false,
  canSaveDocuments: false,
})

const emit = defineEmits<{
  clear: []
  copy: []
  exportHtml: []
  exportPdf: []
  install: []
  openDocument: []
  openExamples: []
  saveDocument: []
  'update:theme': [payload: { origin: { x: number; y: number }; theme: Theme }]
  'update:viewMode': [mode: ViewMode]
}>()

const isActionSheetOpen = shallowRef(false)

const secondaryActions = computed(() => {
  const actions: {
    action: () => void
    icon: string
    label: string
    variant?: 'danger' | 'default' | 'primary'
  }[] = []

  if (props.canOpenDocuments) {
    actions.push({
      action: () => emit('openDocument'),
      icon: '📂',
      label: 'Open',
    })
  }

  if (props.canSaveDocuments) {
    actions.push({
      action: () => emit('saveDocument'),
      icon: '💾',
      label: 'Save',
    })
  }

  if (props.canInstall) {
    actions.push({
      action: () => emit('install'),
      icon: '⬇️',
      label: 'Install App',
      variant: 'primary',
    })
  }

  actions.push(
    {
      action: () => emit('openExamples'),
      icon: '✨',
      label: 'Load Examples',
    },
    {
      action: () => emit('copy'),
      icon: '📋',
      label: props.isCopied ? 'Copied!' : 'Copy Markdown',
      variant: props.isCopied ? 'primary' : 'default',
    },
    {
      action: () => emit('clear'),
      icon: '🗑️',
      label: 'Clear Document',
      variant: 'danger',
    },
  )

  actions.push(
    {
      action: () => emit('exportHtml'),
      icon: '📄',
      label: 'Export as HTML',
    },
    {
      action: () => emit('exportPdf'),
      icon: '📑',
      label: 'Export as PDF',
    },
  )

  // GitHub link - opens in new tab
  actions.push({
    action: () => window.open(GITHUB_REPO_URL, '_blank', 'noopener,noreferrer'),
    icon: '🐙',
    label: 'View on GitHub',
    variant: 'primary',
  })

  return actions
})

function closeActionSheet(): void {
  isActionSheetOpen.value = false
}

function handleThemeChange(payload: { origin: { x: number; y: number }; theme: Theme }): void {
  emit('update:theme', payload)
}

function handleViewModeChange(mode: ViewMode): void {
  emit('update:viewMode', mode)
}

function openActionSheet(): void {
  isActionSheetOpen.value = true
}
</script>

<template>
  <div class="mobile-toolbar-actions">
    <div class="mobile-toolbar-actions__row">
      <ToolbarButton
        icon-only
        aria-label="Menu"
        class="mobile-toolbar-actions__menu-btn"
        @click="openActionSheet"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M4 6h16" stroke-linecap="round" />
          <path d="M4 12h16" stroke-linecap="round" />
          <path d="M4 18h16" stroke-linecap="round" />
        </svg>
      </ToolbarButton>

      <span class="mobile-toolbar-actions__brand">
        <span class="brand-short">MD</span>
        <span class="brand-full">Markdown <em>Studio</em></span>
      </span>

      <ThemeToggle compact :theme="theme" @toggle="handleThemeChange" />
    </div>

    <div class="mobile-toolbar-actions__row mobile-toolbar-actions__row--secondary">
      <ViewToggle
        compact
        :available-modes="availableModes"
        :model-value="viewMode"
        @update:model-value="handleViewModeChange"
      />
    </div>

    <MobileActionSheet
      :is-open="isActionSheetOpen"
      title="Actions"
      :actions="secondaryActions"
      @close="closeActionSheet"
    />
  </div>
</template>

<style scoped>
.mobile-toolbar-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 12px 16px;
  background: var(--surface);
  border-bottom: 1px solid var(--border);
}

.mobile-toolbar-actions__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: 44px;
}

.mobile-toolbar-actions__row--secondary {
  justify-content: center;
}

.mobile-toolbar-actions__brand {
  display: flex;
  align-items: center;
  font-family: 'Fraunces', serif;
  font-weight: 300;
  color: var(--accent);
  flex-shrink: 0;
}

.brand-short {
  display: none;
  font-size: 18px;
  font-weight: 500;
  letter-spacing: -0.02em;
}

.brand-full {
  font-size: 17px;
  letter-spacing: -0.02em;
}

.brand-full em {
  font-style: italic;
  font-weight: 300;
}

.mobile-toolbar-actions__menu-btn {
  min-width: 44px;
  min-height: 44px;
  border-radius: 10px;
  flex-shrink: 0;
}

/* Prevent ViewToggle from stretching full width in centered row */
.mobile-toolbar-actions__row--secondary :deep(.view-toggle) {
  width: auto;
  max-width: 280px;
}

.mobile-toolbar-actions :deep(.theme-toggle) {
  flex-shrink: 0;
  min-width: 44px;
  min-height: 44px;
  aspect-ratio: 1;
}

/* Compact mode for very small screens */
@media (max-width: 380px) {
  .brand-short {
    display: block;
  }

  .brand-full {
    display: none;
  }

  .mobile-toolbar-actions {
    padding: 10px 12px;
    gap: 10px;
  }
}
</style>

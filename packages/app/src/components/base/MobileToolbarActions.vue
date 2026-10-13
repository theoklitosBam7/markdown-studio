<script setup lang="ts">
import type { Component } from 'vue'

import { computed, shallowRef } from 'vue'
import {
  Copy,
  Download,
  FileDown,
  FileText,
  FolderOpen,
  Grid2X2,
  Keyboard,
  Menu,
  PanelLeft,
  Save,
  Search,
  Table2,
  Trash2,
} from '@lucide/vue'

import type { Theme, ViewMode } from '@/types/editor'

import { GITHUB_REPO_URL } from '@/utils/constants'

import MobileActionSheet from './MobileActionSheet.vue'
import ThemeToggle from './ThemeToggle.vue'
import ToolbarButton from './ToolbarButton.vue'
import ViewToggle from './ViewToggle.vue'

interface Props {
  availableModes?: ViewMode[]
  canExportPdf?: boolean
  canInstall?: boolean
  canOpenDocuments?: boolean
  canSaveDocuments?: boolean
  documentName?: string
  isCopied: boolean
  isDirty?: boolean
  isOutlineOpen?: boolean
  pdfExportUnavailableReason?: string
  theme: Theme
  viewMode: ViewMode
}

const props = withDefaults(defineProps<Props>(), {
  availableModes: () => ['editor', 'preview'],
  canExportPdf: true,
  canInstall: false,
  canOpenDocuments: false,
  canSaveDocuments: false,
  documentName: 'Untitled.md',
  isDirty: false,
  isOutlineOpen: false,
  pdfExportUnavailableReason: '',
})

const emit = defineEmits<{
  clear: []
  copy: []
  exportHtml: []
  exportPdf: []
  insertTable: []
  install: []
  openDocument: []
  openExamples: []
  openFind: []
  openShortcuts: []
  saveDocument: []
  toggleOutline: []
  'update:theme': [payload: { origin: { x: number; y: number }; theme: Theme }]
  'update:viewMode': [mode: ViewMode]
}>()

const isActionSheetOpen = shallowRef(false)

const secondaryActions = computed(() => {
  const actions: {
    action: () => void
    description?: string
    disabled?: boolean
    icon: 'github' | Component
    label: string
    variant?: 'danger' | 'default' | 'primary'
  }[] = []

  if (props.canOpenDocuments) {
    actions.push({
      action: () => emit('openDocument'),
      icon: FolderOpen,
      label: 'Open',
    })
  }

  if (props.canSaveDocuments) {
    actions.push({
      action: () => emit('saveDocument'),
      icon: Save,
      label: 'Save',
    })
  }

  if (props.canInstall) {
    actions.push({
      action: () => emit('install'),
      icon: Download,
      label: 'Install App',
      variant: 'primary',
    })
  }

  actions.push(
    {
      action: () => emit('openFind'),
      icon: Search,
      label: 'Find in Document',
    },
    {
      action: () => emit('openExamples'),
      icon: Grid2X2,
      label: 'Load Examples',
    },
    {
      action: () => emit('insertTable'),
      icon: Table2,
      label: 'Insert Table',
    },
    {
      action: () => emit('copy'),
      icon: Copy,
      label: props.isCopied ? 'Copied!' : 'Copy Markdown',
      variant: props.isCopied ? 'primary' : 'default',
    },
    {
      action: () => emit('clear'),
      icon: Trash2,
      label: 'Clear Document',
      variant: 'danger',
    },
  )

  actions.push(
    {
      action: () => emit('exportHtml'),
      icon: FileText,
      label: 'Export as HTML',
    },
    {
      action: () => emit('exportPdf'),
      description: props.canExportPdf ? undefined : props.pdfExportUnavailableReason,
      disabled: !props.canExportPdf,
      icon: FileDown,
      label: 'Export as PDF',
    },
  )

  // GitHub link - opens in new tab
  actions.push({
    action: () => window.open(GITHUB_REPO_URL, '_blank', 'noopener,noreferrer'),
    icon: 'github',
    label: 'View on GitHub',
    variant: 'primary',
  })

  actions.push({
    action: () => emit('openShortcuts'),
    icon: Keyboard,
    label: 'Keyboard Shortcuts',
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
        <Menu :size="20" :stroke-width="1.8" aria-hidden="true" />
      </ToolbarButton>

      <div class="mobile-toolbar-actions__identity">
        <span class="mobile-toolbar-actions__brand">
          <span class="brand-short">MD</span>
          <span class="brand-full">Markdown Studio</span>
        </span>
        <span class="mobile-toolbar-actions__document" aria-live="polite">
          <strong class="mobile-toolbar-actions__document-name">{{ props.documentName }}</strong>
          <span
            class="mobile-toolbar-actions__document-status"
            :class="{ 'mobile-toolbar-actions__document-status--dirty': props.isDirty }"
          >
            <span class="mobile-toolbar-actions__document-dot" aria-hidden="true"></span>
            {{ props.isDirty ? 'Unsaved' : 'Saved' }}
          </span>
        </span>
      </div>

      <ThemeToggle compact :theme="theme" @toggle="handleThemeChange" />
    </div>

    <div class="mobile-toolbar-actions__row mobile-toolbar-actions__row--secondary">
      <ToolbarButton
        icon-only
        :aria-label="props.isOutlineOpen ? 'Hide document outline' : 'Show document outline'"
        :aria-pressed="props.isOutlineOpen"
        @click="emit('toggleOutline')"
      >
        <PanelLeft :size="20" :stroke-width="1.8" aria-hidden="true" />
      </ToolbarButton>
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
  padding: max(12px, env(safe-area-inset-top)) 16px 12px;
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

.mobile-toolbar-actions__identity {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
  gap: 2px;
}

.mobile-toolbar-actions__brand {
  display: flex;
  align-items: center;
  color: var(--text);
  flex-shrink: 0;
  font-size: 13px;
  font-weight: 650;
  letter-spacing: -0.02em;
}

.brand-short {
  display: none;
}

.brand-full {
  font-size: 13px;
}

.mobile-toolbar-actions__document {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 7px;
  color: var(--text-muted);
  font-size: 11px;
}

.mobile-toolbar-actions__document-name {
  overflow: hidden;
  font-weight: 500;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mobile-toolbar-actions__document-status {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 4px;
  font-size: 10px;
}

.mobile-toolbar-actions__document-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--accent-mid);
}

.mobile-toolbar-actions__document-status--dirty .mobile-toolbar-actions__document-dot {
  background: var(--brass);
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
    font-size: 14px;
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

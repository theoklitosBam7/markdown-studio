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
  Moon,
  PanelLeft,
  Save,
  Search,
  Sun,
  Table2,
  Trash2,
} from '@lucide/vue'

import type { Theme, ViewMode } from '@/types/editor'

import { GITHUB_REPO_URL } from '@/utils/constants'

import MobileActionSheet from './MobileActionSheet.vue'
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

interface SheetAction {
  action: (element?: HTMLElement) => void
  description?: string
  disabled?: boolean
  icon: 'github' | Component
  label: string
  variant?: 'danger' | 'default' | 'primary'
}

interface SheetGroup {
  items: SheetAction[]
  label: string
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
  'update:theme': [payload: { theme: Theme }]
  'update:viewMode': [mode: ViewMode]
}>()

const isActionSheetOpen = shallowRef(false)
const outlineLabel = computed(() =>
  props.isOutlineOpen ? 'Hide document outline' : 'Show document outline',
)
const nextTheme = computed<Theme>(() => (props.theme === 'light' ? 'dark' : 'light'))

const actionGroups = computed<SheetGroup[]>(() => {
  const documentActions: SheetAction[] = []

  if (props.canOpenDocuments) {
    documentActions.push({
      action: () => emit('openDocument'),
      icon: FolderOpen,
      label: 'Open',
    })
  }

  if (props.canSaveDocuments) {
    documentActions.push({
      action: () => emit('saveDocument'),
      icon: Save,
      label: 'Save',
    })
  }

  if (props.canInstall) {
    documentActions.push({
      action: () => emit('install'),
      icon: Download,
      label: 'Install App',
      variant: 'primary',
    })
  }

  const groups: SheetGroup[] = []

  if (documentActions.length > 0) {
    groups.push({ items: documentActions, label: 'Document' })
  }

  groups.push({
    items: [
      { action: () => emit('openFind'), icon: Search, label: 'Find in Document' },
      { action: () => emit('insertTable'), icon: Table2, label: 'Insert Table' },
      { action: () => emit('openExamples'), icon: Grid2X2, label: 'Load Examples' },
      {
        action: () => emit('copy'),
        icon: Copy,
        label: props.isCopied ? 'Copied!' : 'Copy Markdown',
        variant: props.isCopied ? 'primary' : 'default',
      },
    ],
    label: 'Edit',
  })

  groups.push({
    items: [
      { action: () => emit('exportHtml'), icon: FileText, label: 'Export as HTML' },
      {
        action: () => emit('exportPdf'),
        description: props.canExportPdf ? undefined : props.pdfExportUnavailableReason,
        disabled: !props.canExportPdf,
        icon: FileDown,
        label: 'Export as PDF',
      },
    ],
    label: 'Export',
  })

  groups.push({
    items: [
      {
        action: () => emit('update:theme', { theme: nextTheme.value }),
        icon: props.theme === 'light' ? Moon : Sun,
        label: `Switch to ${nextTheme.value} mode`,
      },
    ],
    label: 'Appearance',
  })

  groups.push({
    items: [
      {
        action: () => window.open(GITHUB_REPO_URL, '_blank', 'noopener,noreferrer'),
        icon: 'github',
        label: 'View on GitHub',
      },
      { action: () => emit('openShortcuts'), icon: Keyboard, label: 'Keyboard Shortcuts' },
    ],
    label: 'More',
  })

  groups.push({
    items: [
      { action: () => emit('clear'), icon: Trash2, label: 'Clear Document', variant: 'danger' },
    ],
    label: 'Danger',
  })

  return groups
})

function closeActionSheet(): void {
  isActionSheetOpen.value = false
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
        aria-controls="mobile-action-sheet"
        :aria-expanded="isActionSheetOpen"
        aria-haspopup="dialog"
        class="mobile-toolbar-actions__menu-btn"
        @click="openActionSheet"
      >
        <Menu :size="20" :stroke-width="1.8" aria-hidden="true" />
      </ToolbarButton>

      <div class="mobile-toolbar-actions__identity">
        <strong class="mobile-toolbar-actions__document-name">{{ props.documentName }}</strong>
        <span
          class="mobile-toolbar-actions__document-status"
          :class="{ 'mobile-toolbar-actions__document-status--dirty': props.isDirty }"
          aria-live="polite"
        >
          <span class="mobile-toolbar-actions__document-dot" aria-hidden="true"></span>
          {{ props.isDirty ? 'Unsaved' : 'Saved' }}
        </span>
      </div>

      <ToolbarButton
        icon-only
        class="mobile-toolbar-actions__outline-btn"
        :active="props.isOutlineOpen"
        :aria-label="outlineLabel"
        :aria-pressed="props.isOutlineOpen"
        @click="emit('toggleOutline')"
      >
        <PanelLeft :size="20" :stroke-width="1.8" aria-hidden="true" />
      </ToolbarButton>

      <ViewToggle
        v-if="!props.isOutlineOpen"
        compact
        icons-only
        :available-modes="availableModes"
        :model-value="viewMode"
        @update:model-value="handleViewModeChange"
      />

      <MobileActionSheet
        id="mobile-action-sheet"
        :groups="actionGroups"
        :is-open="isActionSheetOpen"
        title="Actions"
        @close="closeActionSheet"
      />
    </div>
  </div>
</template>

<style scoped>
.mobile-toolbar-actions {
  display: flex;
  width: 100%;
  flex-direction: column;
  padding: max(8px, env(safe-area-inset-top)) max(12px, env(safe-area-inset-right)) 8px
    max(12px, env(safe-area-inset-left));
  background: var(--surface);
}

.mobile-toolbar-actions__row {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 48px;
}

.mobile-toolbar-actions__identity {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
  gap: 1px;
  color: var(--text-muted);
}

.mobile-toolbar-actions__document-name {
  overflow: hidden;
  color: var(--text);
  font-size: 13px;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mobile-toolbar-actions__document-status {
  display: flex;
  align-items: center;
  gap: 5px;
  color: var(--text-muted);
  font-size: 11px;
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

.mobile-toolbar-actions__menu-btn,
.mobile-toolbar-actions__outline-btn {
  flex: 0 0 auto;
}

.mobile-toolbar-actions :deep(.view-toggle) {
  flex: 0 0 auto;
}
</style>

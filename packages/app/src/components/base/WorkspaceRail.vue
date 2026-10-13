<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, useTemplateRef } from 'vue'
import {
  Check,
  Copy,
  Download,
  FileDown,
  FolderOpen,
  LayoutGrid,
  MoreHorizontal,
  PanelLeft,
  Save,
  Search,
  Table2,
  Trash2,
} from '@lucide/vue'

import type { Component } from 'vue'

interface DocumentAction {
  ariaLabel: string
  icon: Component
  label: string
  name: DocumentActionName
  variant?: 'danger'
}

type DocumentActionName =
  | 'clear'
  | 'copy'
  | 'exportHtml'
  | 'exportPdf'
  | 'insertTable'
  | 'install'
  | 'openDocument'
  | 'openExamples'
  | 'saveDocument'

interface Props {
  canExportPdf?: boolean
  canInstall?: boolean
  canOpenDocuments?: boolean
  canSaveDocuments?: boolean
  isCopied?: boolean
  isOutlineOpen: boolean
  pdfExportUnavailableReason?: string
}

const props = withDefaults(defineProps<Props>(), {
  canExportPdf: true,
  canInstall: false,
  canOpenDocuments: false,
  canSaveDocuments: false,
  isCopied: false,
  pdfExportUnavailableReason: '',
})

const emit = defineEmits<{
  clear: []
  copy: []
  exportHtml: []
  exportPdf: []
  find: []
  insertTable: []
  install: []
  openDocument: []
  openExamples: []
  saveDocument: []
  toggleOutline: []
}>()

const isActionsMenuOpen = ref(false)
const actionsTrigger = useTemplateRef<HTMLButtonElement>('actionsTrigger')
const actionsPanel = useTemplateRef<HTMLElement>('actionsPanel')

const documentActions = computed<DocumentAction[]>(() => {
  const actions: DocumentAction[] = []

  if (props.canOpenDocuments) {
    actions.push({
      ariaLabel: 'Open document',
      icon: FolderOpen,
      label: 'Open',
      name: 'openDocument',
    })
  }

  if (props.canSaveDocuments) {
    actions.push({
      ariaLabel: 'Save document',
      icon: Save,
      label: 'Save',
      name: 'saveDocument',
    })
  }

  if (props.canInstall) {
    actions.push({
      ariaLabel: 'Install app',
      icon: Download,
      label: 'Install',
      name: 'install',
    })
  }

  actions.push(
    { ariaLabel: 'Load examples', icon: LayoutGrid, label: 'Examples', name: 'openExamples' },
    { ariaLabel: 'Insert table', icon: Table2, label: 'Table', name: 'insertTable' },
    {
      ariaLabel: 'Copy Markdown',
      icon: props.isCopied ? Check : Copy,
      label: props.isCopied ? 'Copied' : 'Copy MD',
      name: 'copy',
    },
    { ariaLabel: 'Clear document', icon: Trash2, label: 'Clear', name: 'clear', variant: 'danger' },
    { ariaLabel: 'Export HTML', icon: FileDown, label: 'Export HTML', name: 'exportHtml' },
    { ariaLabel: 'Export PDF', icon: FileDown, label: 'Export PDF', name: 'exportPdf' },
  )

  return actions
})

const actionHandlers: Record<DocumentActionName, () => void> = {
  clear: () => emit('clear'),
  copy: () => emit('copy'),
  exportHtml: () => emit('exportHtml'),
  exportPdf: () => emit('exportPdf'),
  insertTable: () => emit('insertTable'),
  install: () => emit('install'),
  openDocument: () => emit('openDocument'),
  openExamples: () => emit('openExamples'),
  saveDocument: () => emit('saveDocument'),
}

function closeActionsMenu(restoreFocus = false): void {
  isActionsMenuOpen.value = false

  if (restoreFocus) {
    void nextTick(() => actionsTrigger.value?.focus())
  }
}

function handleOutsideClick(event: MouseEvent): void {
  if (!isActionsMenuOpen.value) {
    return
  }

  const target = event.target
  if (
    target instanceof Node &&
    !actionsPanel.value?.contains(target) &&
    !actionsTrigger.value?.contains(target)
  ) {
    closeActionsMenu()
  }
}

function performAction(name: DocumentActionName): void {
  actionHandlers[name]()
  closeActionsMenu()
}

onMounted(() => {
  document.addEventListener('click', handleOutsideClick, true)
})

onUnmounted(() => {
  document.removeEventListener('click', handleOutsideClick, true)
})
</script>

<template>
  <aside class="workspace-rail" aria-label="Workspace tools">
    <div class="workspace-rail__brand" aria-label="Markdown Studio" title="Markdown Studio">M</div>

    <nav class="workspace-rail__navigation" aria-label="Workspace actions">
      <button
        class="workspace-rail__button"
        :aria-pressed="isOutlineOpen"
        :aria-label="isOutlineOpen ? 'Hide document outline' : 'Show document outline'"
        :title="isOutlineOpen ? 'Hide document outline' : 'Show document outline'"
        type="button"
        @click="emit('toggleOutline')"
      >
        <PanelLeft :size="20" :stroke-width="1.8" aria-hidden="true" />
      </button>
      <button
        class="workspace-rail__button"
        aria-label="Find in document"
        title="Find in document"
        type="button"
        @click="emit('find')"
      >
        <Search :size="20" :stroke-width="1.8" aria-hidden="true" />
      </button>
    </nav>

    <div class="workspace-rail__divider" aria-hidden="true"></div>

    <div class="workspace-rail__actions-wrap">
      <button
        ref="actionsTrigger"
        class="workspace-rail__button workspace-rail__actions-trigger"
        :aria-expanded="isActionsMenuOpen"
        aria-controls="workspace-document-actions"
        aria-label="Document actions"
        title="Document actions"
        type="button"
        @click="isActionsMenuOpen = !isActionsMenuOpen"
      >
        <MoreHorizontal :size="20" :stroke-width="1.8" aria-hidden="true" />
      </button>

      <section
        v-if="isActionsMenuOpen"
        id="workspace-document-actions"
        ref="actionsPanel"
        class="workspace-rail__actions-panel"
        aria-label="Document actions"
        @keydown.esc.stop.prevent="closeActionsMenu(true)"
      >
        <h2 class="workspace-rail__actions-title">Document actions</h2>
        <div class="workspace-rail__action-list">
          <button
            v-for="action in documentActions"
            :key="action.name"
            class="workspace-rail__action"
            :class="{ 'workspace-rail__action--danger': action.variant === 'danger' }"
            :aria-label="action.ariaLabel"
            :disabled="action.name === 'exportPdf' && !props.canExportPdf"
            :aria-describedby="
              action.name === 'exportPdf' && !props.canExportPdf
                ? 'workspace-pdf-export-hint'
                : undefined
            "
            type="button"
            @click="performAction(action.name)"
          >
            <component :is="action.icon" :size="18" :stroke-width="1.8" aria-hidden="true" />
            <span>{{ action.label }}</span>
          </button>
        </div>
        <p
          v-if="!props.canExportPdf && props.pdfExportUnavailableReason"
          id="workspace-pdf-export-hint"
          class="workspace-rail__actions-hint"
        >
          {{ props.pdfExportUnavailableReason }}
        </p>
      </section>
    </div>
  </aside>
</template>

<style scoped>
.workspace-rail {
  position: relative;
  z-index: 20;
  display: flex;
  width: 56px;
  flex: 0 0 56px;
  flex-direction: column;
  align-items: center;
  gap: 18px;
  padding: 14px 6px;
  border-right: 1px solid var(--border);
  background: var(--rail-bg);
}

.workspace-rail__brand {
  display: grid;
  width: 34px;
  height: 34px;
  place-items: center;
  border-radius: 10px;
  background: var(--accent);
  color: var(--accent-contrast);
  font-size: 18px;
  font-weight: 700;
  letter-spacing: -0.06em;
}

.workspace-rail__navigation {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
}

.workspace-rail__button {
  display: grid;
  width: 42px;
  height: 42px;
  place-items: center;
  border: 1px solid transparent;
  border-radius: 10px;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
}

.workspace-rail__button:hover,
.workspace-rail__button[aria-pressed='true'],
.workspace-rail__actions-trigger[aria-expanded='true'] {
  border-color: var(--border);
  background: var(--raised-bg);
  color: var(--text);
}

.workspace-rail__button:focus-visible,
.workspace-rail__action:focus-visible {
  outline: 2px solid var(--focus-ring);
  outline-offset: 2px;
}

.workspace-rail__divider {
  width: 30px;
  height: 1px;
  background: var(--border);
}

.workspace-rail__actions-wrap {
  position: relative;
}

.workspace-rail__actions-panel {
  position: absolute;
  z-index: 30;
  top: 0;
  left: calc(100% + 12px);
  width: 244px;
  max-height: calc(100dvh - 32px);
  overflow-y: auto;
  padding: 10px;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: var(--raised-bg);
  box-shadow: 0 12px 34px rgb(15 28 20 / 18%);
}

.workspace-rail__actions-title {
  margin: 2px 8px 8px;
  color: var(--text-muted);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.workspace-rail__action-list {
  display: grid;
  gap: 2px;
}

.workspace-rail__action {
  display: flex;
  min-height: 40px;
  align-items: center;
  gap: 11px;
  padding: 0 10px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: var(--text);
  font: inherit;
  font-size: 13px;
  text-align: left;
  cursor: pointer;
}

.workspace-rail__action:hover:not(:disabled) {
  background: var(--panel);
}

.workspace-rail__action:disabled {
  color: var(--text-faint);
  cursor: not-allowed;
}

.workspace-rail__action--danger {
  color: var(--danger, #a94e46);
}

.workspace-rail__actions-hint {
  margin: 8px 8px 2px;
  color: var(--text-muted);
  font-size: 11px;
  line-height: 1.45;
}

@media (max-width: 700px) {
  .workspace-rail {
    display: none;
  }
}
</style>

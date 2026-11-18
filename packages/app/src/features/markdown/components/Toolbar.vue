<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, shallowRef, useTemplateRef } from 'vue'
import {
  ChevronDown,
  FileDown,
  FileText,
  FolderOpen,
  Keyboard,
  Save,
  SlidersHorizontal,
} from '@lucide/vue'

import type { Theme, ViewMode } from '@/types/editor'

import { useEscapeDismiss } from '@/composables/useEscapeDismiss'

import MobileToolbarActions from '@/components/base/MobileToolbarActions.vue'
import ThemeToggle from '@/components/base/ThemeToggle.vue'
import ToolbarButton from '@/components/base/ToolbarButton.vue'
import ViewToggle from '@/components/base/ViewToggle.vue'

import type { ThemeChangeRequest } from '../types'

interface Props {
  availableModes?: ViewMode[]
  canExportPdf?: boolean
  canInstall?: boolean
  canOpenDocuments?: boolean
  canSaveDocuments?: boolean
  documentName?: string
  isCopied: boolean
  isDirty?: boolean
  isMobile?: boolean
  isOutlineOpen?: boolean
  pdfExportUnavailableReason?: string
  theme: Theme
  viewMode: ViewMode
}

const props = withDefaults(defineProps<Props>(), {
  availableModes: () => ['editor', 'split', 'preview'],
  canExportPdf: true,
  canInstall: false,
  canOpenDocuments: false,
  canSaveDocuments: false,
  documentName: 'Untitled.md',
  isDirty: false,
  isMobile: false,
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
  openEditorDisplay: []
  openExamples: []
  openFind: []
  openShortcuts: []
  saveDocument: []
  toggleOutline: []
  'update:theme': [payload: ThemeChangeRequest]
  'update:viewMode': [mode: ViewMode]
}>()

const isExportMenuOpen = shallowRef(false)
const exportMenuRef = useTemplateRef<HTMLElement>('exportMenu')

function closeExportMenu(restoreFocus = false): void {
  isExportMenuOpen.value = false
  if (restoreFocus) void nextTick(() => exportMenuRef.value?.querySelector('button')?.focus())
}

useEscapeDismiss(isExportMenuOpen, () => closeExportMenu(true))

function handleDocumentPointerDown(event: PointerEvent): void {
  if (
    isExportMenuOpen.value &&
    exportMenuRef.value &&
    event.target instanceof Node &&
    !exportMenuRef.value.contains(event.target)
  ) {
    closeExportMenu()
  }
}

onMounted(() => {
  document.addEventListener('pointerdown', handleDocumentPointerDown)
})

onUnmounted(() => {
  document.removeEventListener('pointerdown', handleDocumentPointerDown)
})

function clear(): void {
  emit('clear')
}

function copy(): void {
  emit('copy')
}

function exportHtml(): void {
  closeExportMenu()
  emit('exportHtml')
}

function exportPdf(): void {
  closeExportMenu()
  emit('exportPdf')
}

function handleThemeChange(payload: ThemeChangeRequest): void {
  emit('update:theme', payload)
}

function handleViewModeChange(mode: ViewMode): void {
  emit('update:viewMode', mode)
}

function insertTable(): void {
  emit('insertTable')
}

function install(): void {
  emit('install')
}

function openDocument(): void {
  emit('openDocument')
}

function openExamples(): void {
  emit('openExamples')
}

function openFind(): void {
  emit('openFind')
}

function openShortcuts(): void {
  emit('openShortcuts')
}

function saveDocument(): void {
  emit('saveDocument')
}

function toggleOutline(): void {
  emit('toggleOutline')
}
</script>

<template>
  <header class="toolbar">
    <MobileToolbarActions
      v-if="props.isMobile"
      :available-modes="props.availableModes"
      :can-export-pdf="props.canExportPdf"
      :can-install="props.canInstall"
      :can-open-documents="props.canOpenDocuments"
      :can-save-documents="props.canSaveDocuments"
      :document-name="props.documentName"
      :is-copied="props.isCopied"
      :is-dirty="props.isDirty"
      :is-outline-open="props.isOutlineOpen"
      :pdf-export-unavailable-reason="props.pdfExportUnavailableReason"
      :theme="props.theme"
      :view-mode="props.viewMode"
      @clear="clear"
      @copy="copy"
      @export-html="exportHtml"
      @export-pdf="exportPdf"
      @insert-table="insertTable"
      @install="install"
      @open-document="openDocument"
      @open-editor-display="emit('openEditorDisplay')"
      @open-find="openFind"
      @open-examples="openExamples"
      @open-shortcuts="openShortcuts"
      @save-document="saveDocument"
      @toggle-outline="toggleOutline"
      @update:theme="handleThemeChange"
      @update:view-mode="handleViewModeChange"
    />

    <template v-else>
      <div class="toolbar__top">
        <div class="toolbar__document" aria-live="polite">
          <FileText :size="19" :stroke-width="1.8" aria-hidden="true" />
          <strong>{{ props.documentName }}</strong>
          <span
            class="toolbar__document-status"
            :class="{ 'toolbar__document-status--dirty': props.isDirty }"
          >
            <span class="toolbar__document-dot" aria-hidden="true"></span>
            {{ props.isDirty ? 'Unsaved changes' : 'Saved' }}
          </span>
        </div>

        <div class="toolbar__primary">
          <ToolbarButton
            v-if="props.canOpenDocuments"
            aria-label="Open document"
            title="Open document"
            @click="openDocument"
          >
            <FolderOpen :size="15" :stroke-width="1.8" aria-hidden="true" />
            <span>Open</span>
          </ToolbarButton>
          <ToolbarButton
            v-if="props.canSaveDocuments"
            variant="primary"
            aria-label="Save document"
            title="Save document"
            @click="saveDocument"
          >
            <Save :size="15" :stroke-width="1.8" aria-hidden="true" />
            <span>Save</span>
          </ToolbarButton>
        </div>

        <div ref="exportMenu" class="toolbar__export">
          <ToolbarButton
            aria-label="Export document"
            title="Export document"
            :aria-expanded="isExportMenuOpen"
            aria-haspopup="menu"
            @click="isExportMenuOpen = !isExportMenuOpen"
          >
            <FileDown :size="15" :stroke-width="1.8" aria-hidden="true" />
            <span>Export</span>
            <ChevronDown :size="13" :stroke-width="1.8" aria-hidden="true" />
          </ToolbarButton>
          <div v-if="isExportMenuOpen" class="toolbar__export-menu">
            <div role="menu">
              <button type="button" role="menuitem" aria-label="Export HTML" @click="exportHtml">
                Export HTML
              </button>
              <button
                type="button"
                role="menuitem"
                aria-label="Export PDF"
                :disabled="!props.canExportPdf"
                @click="exportPdf"
              >
                Export PDF
              </button>
            </div>
            <p
              v-if="!props.canExportPdf && props.pdfExportUnavailableReason"
              class="toolbar__export-hint"
            >
              {{ props.pdfExportUnavailableReason }}
            </p>
          </div>
        </div>

        <div class="toolbar__desktop-controls">
          <ViewToggle
            :available-modes="props.availableModes"
            :model-value="props.viewMode"
            @update:model-value="handleViewModeChange"
          />
          <ToolbarButton
            class="shortcuts-button"
            icon-only
            aria-label="Keyboard shortcuts"
            title="Keyboard shortcuts"
            @click="openShortcuts"
          >
            <Keyboard :size="18" :stroke-width="1.8" aria-hidden="true" />
          </ToolbarButton>
          <ToolbarButton
            class="editor-display-button"
            aria-label="Editor display"
            title="Editor display"
            @click="emit('openEditorDisplay')"
          >
            <SlidersHorizontal :size="18" :stroke-width="1.8" aria-hidden="true" />
            <span>Editor display</span>
          </ToolbarButton>
          <ThemeToggle :theme="props.theme" @toggle="handleThemeChange" />
        </div>
      </div>
    </template>
  </header>
</template>

<style scoped>
.toolbar {
  background: var(--surface);
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  padding: 6px 18px;
  flex-shrink: 0;
  z-index: 10;
}

.toolbar__top {
  display: flex;
  align-items: center;
  gap: 16px;
  min-width: 0;
  width: 100%;
}

.toolbar__document {
  display: flex;
  flex: 1;
  min-width: 0;
  align-items: center;
  gap: 9px;
  color: var(--text-muted);
}

.toolbar__document strong {
  min-width: 0;
  overflow: hidden;
  color: var(--text);
  font-size: var(--font-size-ui-caption);
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.toolbar__document-status {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  gap: 5px;
  color: var(--text-muted);
  font-size: var(--font-size-ui-caption);
}

.toolbar__document-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--accent-mid);
}

.toolbar__document-status--dirty .toolbar__document-dot {
  background: var(--brass);
}

.toolbar__primary {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  gap: 8px;
}

.toolbar__export {
  position: relative;
  flex-shrink: 0;
}

.toolbar__export-menu {
  position: absolute;
  z-index: 20;
  top: calc(100% + 6px);
  left: 0;
  width: 220px;
  padding: 6px;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--raised-bg);
  box-shadow: 0 12px 30px rgb(0 0 0 / 14%);
}

.toolbar__export-menu button {
  display: flex;
  width: 100%;
  min-height: 36px;
  align-items: center;
  padding: 0 10px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: var(--text);
  font: inherit;
  font-size: var(--font-size-ui-caption);
  text-align: left;
  cursor: pointer;
}

.toolbar__export-menu button:hover:not(:disabled) {
  background: var(--panel);
}

.toolbar__export-menu button:disabled {
  color: var(--text-faint);
  cursor: not-allowed;
}

.toolbar__export-hint {
  margin: 6px 10px 4px;
  color: var(--text-muted);
  font-size: var(--font-size-ui-caption);
  line-height: 1.4;
}

.toolbar__desktop-controls {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-left: auto;
  flex-shrink: 0;
}

.shortcuts-button {
  border-radius: 999px;
}

.shortcuts-button.shortcuts-button :deep(svg) {
  width: 18px;
  height: 18px;
}

@media (max-width: 1000px) {
  .toolbar {
    gap: 8px;
    padding-inline: 10px;
  }

  .toolbar__primary,
  .toolbar__desktop-controls {
    gap: 6px;
  }

  .toolbar__desktop-controls :deep(.view-toggle button span),
  .toolbar__desktop-controls .editor-display-button :deep(span) {
    display: none;
  }

  .toolbar__desktop-controls :deep(.view-toggle button) {
    min-width: 38px;
    padding: 0 9px;
  }
}

/* The compact header owns its own padding. */
@media (max-width: 700px), (max-width: 1000px) and (max-height: 500px) {
  .toolbar {
    padding: 0;
  }
}
</style>

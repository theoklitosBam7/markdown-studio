<script setup lang="ts">
import { onMounted, onUnmounted, shallowRef, useTemplateRef } from 'vue'
import {
  Copy,
  Download,
  FileDown,
  FolderOpen,
  Keyboard,
  LayoutGrid,
  Save,
  Table2,
  X,
} from '@lucide/vue'

import type { Theme, ViewMode } from '@/types/editor'

import MobileToolbarActions from '@/components/base/MobileToolbarActions.vue'
import ThemeToggle from '@/components/base/ThemeToggle.vue'
import ToolbarButton from '@/components/base/ToolbarButton.vue'
import ViewToggle from '@/components/base/ViewToggle.vue'
import { GITHUB_REPO_URL } from '@/utils/constants'

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
  openExamples: []
  openFind: []
  openShortcuts: []
  saveDocument: []
  toggleOutline: []
  'update:theme': [payload: ThemeChangeRequest]
  'update:viewMode': [mode: ViewMode]
}>()

function clear(): void {
  emit('clear')
}

function copy(): void {
  emit('copy')
}

function handleThemeChange(payload: ThemeChangeRequest): void {
  emit('update:theme', payload)
}

function handleViewModeChange(mode: ViewMode): void {
  emit('update:viewMode', mode)
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

const exportMenuRef = useTemplateRef<HTMLDetailsElement>('exportMenu')
const isExportMenuOpen = shallowRef(false)

function closeExportMenu(): void {
  isExportMenuOpen.value = false
  if (exportMenuRef.value) {
    exportMenuRef.value.open = false
  }
}

function exportHtml(): void {
  emit('exportHtml')
  closeExportMenu()
}

function exportPdf(): void {
  emit('exportPdf')
  closeExportMenu()
}

function handleExportMenuToggle(event: Event): void {
  if (event.currentTarget instanceof HTMLDetailsElement) {
    toggleExportMenu(event.currentTarget.open)
  }
}

function handleOutsideClick(event: MouseEvent): void {
  if (!exportMenuRef.value?.contains(event.target as Node)) {
    closeExportMenu()
  }
}

function insertTable(): void {
  emit('insertTable')
}

function install(): void {
  emit('install')
}

function toggleExportMenu(nextOpen: boolean): void {
  isExportMenuOpen.value = nextOpen
}

onMounted(() => {
  if (!props.isMobile) {
    document.addEventListener('click', handleOutsideClick, true)
  }
})

onUnmounted(() => {
  document.removeEventListener('click', handleOutsideClick, true)
})
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
        <div class="toolbar__brand-group">
          <span class="brand-mark" aria-hidden="true">M</span>
          <span class="brand">Markdown Studio</span>
        </div>

        <div class="toolbar__document" aria-live="polite">
          <strong>{{ props.documentName }}</strong>
          <span
            class="toolbar__document-status"
            :class="{ 'toolbar__document-status--dirty': props.isDirty }"
          >
            <span class="toolbar__document-dot" aria-hidden="true"></span>
            {{ props.isDirty ? 'Unsaved changes' : 'Saved' }}
          </span>
        </div>

        <div class="toolbar__actions" aria-label="Document actions">
          <ToolbarButton v-if="props.canInstall" variant="primary" @click="install">
            <Download :size="18" :stroke-width="1.8" aria-hidden="true" />
            <span>Install</span>
          </ToolbarButton>

          <ToolbarButton v-if="props.canOpenDocuments" @click="openDocument">
            <FolderOpen :size="18" :stroke-width="1.8" aria-hidden="true" />
            <span>Open</span>
          </ToolbarButton>

          <ToolbarButton v-if="props.canSaveDocuments" @click="saveDocument">
            <Save :size="18" :stroke-width="1.8" aria-hidden="true" />
            <span>Save</span>
          </ToolbarButton>

          <ToolbarButton @click="openExamples">
            <LayoutGrid :size="18" :stroke-width="1.8" aria-hidden="true" />
            <span>Examples</span>
          </ToolbarButton>

          <ToolbarButton aria-label="Insert table" @click="insertTable">
            <Table2 :size="18" :stroke-width="1.8" aria-hidden="true" />
            <span>Table</span>
          </ToolbarButton>

          <ToolbarButton @click="clear">
            <X :size="18" :stroke-width="1.8" aria-hidden="true" />
            <span>Clear</span>
          </ToolbarButton>

          <ToolbarButton @click="copy">
            <Copy :size="18" :stroke-width="1.8" aria-hidden="true" />
            <span>{{ isCopied ? 'Copied' : 'Copy MD' }}</span>
          </ToolbarButton>

          <details
            ref="exportMenu"
            class="export-menu"
            :open="isExportMenuOpen"
            @toggle="handleExportMenuToggle"
          >
            <summary class="toolbar-btn export-menu__trigger" aria-label="Export document">
              <FileDown :size="18" :stroke-width="1.8" aria-hidden="true" />
              <span>Export</span>
            </summary>

            <div class="export-menu__popover" role="menu" aria-label="Export options">
              <button class="export-menu__item" type="button" role="menuitem" @click="exportHtml">
                Export HTML
              </button>
              <button
                class="export-menu__item"
                :disabled="!props.canExportPdf"
                type="button"
                role="menuitem"
                @click="exportPdf"
              >
                Export PDF
              </button>
              <p
                v-if="!props.canExportPdf && props.pdfExportUnavailableReason"
                class="export-menu__hint"
              >
                {{ props.pdfExportUnavailableReason }}
              </p>
            </div>
          </details>
        </div>

        <a
          :href="GITHUB_REPO_URL"
          target="_blank"
          rel="noopener noreferrer"
          class="toolbar-btn github-link"
          aria-label="View on GitHub"
          title="View on GitHub"
        >
          <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
            <path
              d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"
            />
          </svg>
          <span class="github-link__text">GitHub</span>
        </a>

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
  flex-direction: column;
  gap: 10px;
  padding: 10px 18px;
  flex-shrink: 0;
  z-index: 10;
}

.toolbar__top {
  display: grid;
  grid-template-areas: 'brand document github controls' 'actions actions actions actions';
  grid-template-columns: auto minmax(100px, 1fr) auto auto;
  align-items: center;
  gap: 8px 18px;
  min-width: 0;
}

.toolbar__brand-group {
  grid-area: brand;
  display: flex;
  align-items: center;
  flex-shrink: 0;
  gap: 9px;
}

.brand-mark {
  display: grid;
  width: 30px;
  height: 30px;
  place-items: center;
  border-radius: 9px;
  background: var(--accent);
  color: var(--accent-contrast);
  font-size: 16px;
  font-weight: 700;
  letter-spacing: -0.06em;
}

.brand {
  color: var(--text);
  font-size: 14px;
  font-weight: 650;
  letter-spacing: -0.03em;
  white-space: nowrap;
}

.toolbar__document {
  grid-area: document;
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 2px;
  padding-left: 16px;
  border-left: 1px solid var(--border);
}

.toolbar__document strong {
  overflow: hidden;
  color: var(--text);
  font-size: 12px;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.toolbar__document-status {
  display: flex;
  align-items: center;
  gap: 5px;
  color: var(--text-muted);
  font-size: 10px;
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

.toolbar__actions {
  grid-area: actions;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  min-width: 0;
}

/* Medium screens - reduce gaps and make buttons more compact */
@media (max-width: 1200px) {
  .toolbar__actions {
    gap: 6px;
  }

  .toolbar__actions :deep(.toolbar-btn) {
    padding: 0 8px;
    font-size: 11px;
  }

  .toolbar__actions :deep(.toolbar-btn svg) {
    width: 18px;
    height: 18px;
  }
}

.toolbar__desktop-controls {
  grid-area: controls;
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

.export-menu {
  position: relative;
}

.export-menu summary {
  list-style: none;
}

.export-menu summary::-webkit-details-marker {
  display: none;
}

.export-menu__trigger {
  height: 38px;
  min-width: 38px;
  padding: 0 10px;
  border-radius: 6px;
  border: 1px solid var(--border);
  background: transparent;
  color: var(--text-muted);
  font-family: 'DM Sans', sans-serif;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 5px;
  white-space: nowrap;
  transition:
    background-color 0.15s,
    border-color 0.15s,
    color 0.15s;
}

.export-menu__trigger:hover,
.export-menu[open] .export-menu__trigger {
  background: var(--panel);
  color: var(--text);
  border-color: var(--border-dark);
}

.export-menu__trigger svg {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

.export-menu__popover {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  min-width: 148px;
  padding: 6px;
  border-radius: 10px;
  border: 1px solid var(--border);
  background: var(--surface);
  box-shadow: 0 14px 30px rgba(17, 15, 12, 0.12);
  display: grid;
  gap: 4px;
  z-index: 20;
}

.export-menu:not([open]) .export-menu__popover {
  display: none;
}

.export-menu__item {
  appearance: none;
  border: none;
  background: transparent;
  color: var(--text);
  border-radius: 6px;
  text-align: left;
  padding: 8px 10px;
  font-family: 'DM Sans', sans-serif;
  font-size: 12px;
  cursor: pointer;
}

.export-menu__item:hover {
  background: var(--panel);
}

.export-menu__item:disabled {
  cursor: not-allowed;
  color: color-mix(in srgb, var(--text) 55%, transparent);
}

.export-menu__item:disabled:hover {
  background: transparent;
}

.export-menu__hint {
  margin: 0;
  padding: 6px 10px 4px;
  font-size: 12px;
  line-height: 1.4;
  color: color-mix(in srgb, var(--text) 72%, transparent);
}

.github-link {
  grid-area: github;
  height: 38px;
  min-width: 38px;
  padding: 0 10px;
  border-radius: 6px;
  border: 1px solid var(--border);
  background: transparent;
  color: var(--text-muted);
  font-family: 'DM Sans', sans-serif;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 5px;
  white-space: nowrap;
  transition:
    background-color 0.15s,
    border-color 0.15s,
    color 0.15s;
  text-decoration: none;
}

.github-link:hover {
  background: var(--panel);
  color: var(--text);
  border-color: var(--border-dark);
}

.github-link svg {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

/* Medium screens - hide GitHub text to save space */
@media (max-width: 1100px) {
  .github-link {
    padding: 0 8px;
  }

  .github-link__text {
    display: none;
  }
}

/* Mobile styles removed - handled by MobileToolbarActions component */
@media (max-width: 700px) {
  .toolbar {
    padding: 0;
    gap: 0;
  }
}
</style>

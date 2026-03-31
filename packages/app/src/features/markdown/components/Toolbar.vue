<script setup lang="ts">
import { onMounted, onUnmounted, shallowRef, useTemplateRef } from 'vue'

import MobileToolbarActions from '@/components/base/MobileToolbarActions.vue'
import ThemeToggle from '@/components/base/ThemeToggle.vue'
import ToolbarButton from '@/components/base/ToolbarButton.vue'
import ViewToggle from '@/components/base/ViewToggle.vue'
import { GITHUB_REPO_URL } from '@/utils/constants'

import type { Theme, ViewMode } from '../types'

interface Props {
  availableModes?: ViewMode[]
  canInstall?: boolean
  canOpenDocuments?: boolean
  canSaveDocuments?: boolean
  isCopied: boolean
  isMobile?: boolean
  theme: Theme
  viewMode: ViewMode
}

interface ThemeChangeRequest {
  origin: { x: number; y: number }
  theme: Theme
}

const props = withDefaults(defineProps<Props>(), {
  availableModes: () => ['editor', 'split', 'preview'],
  canInstall: false,
  canOpenDocuments: false,
  canSaveDocuments: false,
  isMobile: false,
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

function saveDocument(): void {
  emit('saveDocument')
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
      :can-install="props.canInstall"
      :can-open-documents="props.canOpenDocuments"
      :can-save-documents="props.canSaveDocuments"
      :is-copied="props.isCopied"
      :theme="props.theme"
      :view-mode="props.viewMode"
      @clear="clear"
      @copy="copy"
      @export-html="exportHtml"
      @export-pdf="exportPdf"
      @install="install"
      @open-document="openDocument"
      @open-examples="openExamples"
      @save-document="saveDocument"
      @update:theme="handleThemeChange"
      @update:view-mode="handleViewModeChange"
    />

    <template v-else>
      <div class="toolbar__top">
        <div class="toolbar__brand-group">
          <span class="brand">Markdown <em>Studio</em></span>
          <div class="divider" aria-hidden="true"></div>
        </div>

        <div class="toolbar__actions" aria-label="Document actions">
          <ToolbarButton v-if="props.canInstall" variant="primary" @click="install">
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M8 2.5v7" />
              <path d="M5.5 7 8 9.5 10.5 7" />
              <path d="M3 12.5h10" />
            </svg>
            <span>Install</span>
          </ToolbarButton>

          <ToolbarButton v-if="props.canOpenDocuments" @click="openDocument">
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M2 5.5l6-3 6 3M2 5.5V13h12V5.5" />
              <path d="M6 8h4" />
            </svg>
            <span>Open</span>
          </ToolbarButton>

          <ToolbarButton v-if="props.canSaveDocuments" @click="saveDocument">
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M3 2.5h8l2 2V13a1 1 0 01-1 1H4a1 1 0 01-1-1v-9.5z" />
              <path d="M5 2.5v4h5v-4" />
              <path d="M5 11h6" />
            </svg>
            <span>Save</span>
          </ToolbarButton>

          <ToolbarButton @click="openExamples">
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
              <rect x="2" y="2" width="5" height="5" rx="1" />
              <rect x="9" y="2" width="5" height="5" rx="1" />
              <rect x="2" y="9" width="5" height="5" rx="1" />
              <rect x="9" y="9" width="5" height="5" rx="1" />
            </svg>
            <span>Examples</span>
          </ToolbarButton>

          <ToolbarButton @click="clear">
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M3 3l10 10M13 3L3 13" />
            </svg>
            <span>Clear</span>
          </ToolbarButton>

          <ToolbarButton @click="copy">
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
              <rect x="5" y="5" width="9" height="9" rx="1.5" />
              <path d="M11 5V3a1 1 0 00-1-1H3a1 1 0 00-1 1v7a1 1 0 001 1h2" />
            </svg>
            <span>{{ isCopied ? 'Copied' : 'Copy MD' }}</span>
          </ToolbarButton>

          <details
            ref="exportMenu"
            class="export-menu"
            :open="isExportMenuOpen"
            @toggle="handleExportMenuToggle"
          >
            <summary class="toolbar-btn export-menu__trigger" aria-label="Export document">
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M8 2.5v7" />
                <path d="M5.5 7 8 9.5 10.5 7" />
                <path d="M2.5 11.5h11" />
              </svg>
              <span>Export</span>
            </summary>

            <div class="export-menu__popover" role="menu" aria-label="Export options">
              <button class="export-menu__item" type="button" role="menuitem" @click="exportHtml">
                Export HTML
              </button>
              <button class="export-menu__item" type="button" role="menuitem" @click="exportPdf">
                Export PDF
              </button>
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
  padding: 10px var(--app-gutter);
  flex-shrink: 0;
  z-index: 10;
}

.toolbar__top {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.toolbar__brand-group {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  gap: 8px;
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
}

.toolbar__actions {
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
    width: 12px;
    height: 12px;
  }
}

.toolbar__desktop-controls {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-left: auto;
  flex-shrink: 0;
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
  height: 34px;
  min-width: 34px;
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
  transition: all 0.15s;
}

.export-menu__trigger:hover,
.export-menu[open] .export-menu__trigger {
  background: var(--panel);
  color: var(--text);
  border-color: var(--border-dark);
}

.export-menu__trigger svg {
  width: 13px;
  height: 13px;
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

.github-link {
  height: 34px;
  min-width: 34px;
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
  transition: all 0.15s;
  text-decoration: none;
}

.github-link:hover {
  background: var(--panel);
  color: var(--text);
  border-color: var(--border-dark);
}

.github-link svg {
  width: 14px;
  height: 14px;
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

<script setup lang="ts">
import { shallowRef, useTemplateRef } from 'vue'

import ThemeToggle from '@/components/base/ThemeToggle.vue'
import ToolbarButton from '@/components/base/ToolbarButton.vue'
import ViewToggle from '@/components/base/ViewToggle.vue'

import type { Theme, ViewMode } from '../types'

interface Props {
  availableModes?: ViewMode[]
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
  canOpenDocuments: false,
  canSaveDocuments: false,
  isMobile: false,
})

const emit = defineEmits<{
  clear: []
  copy: []
  exportHtml: []
  exportPdf: []
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

function toggleExportMenu(nextOpen: boolean): void {
  isExportMenuOpen.value = nextOpen
}
</script>

<template>
  <header class="toolbar">
    <div class="toolbar__top">
      <div class="toolbar__brand-group">
        <span class="brand">Markdown <em>Studio</em></span>
        <div class="divider" aria-hidden="true"></div>
      </div>

      <div class="toolbar__actions" aria-label="Document actions">
        <ToolbarButton
          v-if="props.canOpenDocuments"
          :compact="props.isMobile"
          @click="openDocument"
        >
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M2 5.5l6-3 6 3M2 5.5V13h12V5.5" />
            <path d="M6 8h4" />
          </svg>
          <span>Open</span>
        </ToolbarButton>

        <ToolbarButton
          v-if="props.canSaveDocuments"
          :compact="props.isMobile"
          @click="saveDocument"
        >
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M3 2.5h8l2 2V13a1 1 0 01-1 1H4a1 1 0 01-1-1v-9.5z" />
            <path d="M5 2.5v4h5v-4" />
            <path d="M5 11h6" />
          </svg>
          <span>Save</span>
        </ToolbarButton>

        <ToolbarButton :compact="props.isMobile" @click="openExamples">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
            <rect x="2" y="2" width="5" height="5" rx="1" />
            <rect x="9" y="2" width="5" height="5" rx="1" />
            <rect x="2" y="9" width="5" height="5" rx="1" />
            <rect x="9" y="9" width="5" height="5" rx="1" />
          </svg>
          <span>Examples</span>
        </ToolbarButton>

        <ToolbarButton :compact="props.isMobile" @click="clear">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M3 3l10 10M13 3L3 13" />
          </svg>
          <span>Clear</span>
        </ToolbarButton>

        <ToolbarButton :compact="props.isMobile" @click="copy">
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
          <summary
            :class="['toolbar-btn', 'export-menu__trigger', { compact: props.isMobile }]"
            aria-label="Export document"
          >
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

      <div class="toolbar__desktop-controls">
        <ViewToggle
          :available-modes="props.availableModes"
          :model-value="props.viewMode"
          @update:model-value="handleViewModeChange"
        />
        <ThemeToggle :theme="props.theme" @toggle="handleThemeChange" />
      </div>
    </div>

    <div v-if="props.isMobile" class="toolbar__mobile-controls">
      <ViewToggle
        compact
        :available-modes="props.availableModes"
        :model-value="props.viewMode"
        @update:model-value="handleViewModeChange"
      />
      <ThemeToggle compact :theme="props.theme" @toggle="handleThemeChange" />
    </div>
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

.toolbar__desktop-controls {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-left: auto;
  flex-shrink: 0;
}

.toolbar__mobile-controls {
  display: none;
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

.export-menu__trigger.compact {
  padding: 0 9px;
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

@media (max-width: 700px) {
  .toolbar {
    gap: 8px;
    padding-top: 8px;
    padding-bottom: 8px;
  }

  .toolbar__top {
    display: grid;
    grid-template-columns: 1fr;
    gap: 8px;
  }

  .toolbar__brand-group {
    justify-content: space-between;
  }

  .toolbar__actions {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(0, 1fr));
    width: 100%;
  }

  .toolbar__actions :deep(.toolbar-btn) {
    justify-content: center;
  }

  .export-menu {
    width: 100%;
  }

  .export-menu__trigger {
    height: 36px;
    min-width: 36px;
    justify-content: center;
    font-size: 11px;
  }

  .export-menu__popover {
    left: 0;
    right: auto;
    width: 100%;
  }

  .toolbar__desktop-controls {
    display: none;
  }

  .toolbar__mobile-controls {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 8px;
    align-items: center;
  }

  .divider {
    display: none;
  }
}
</style>

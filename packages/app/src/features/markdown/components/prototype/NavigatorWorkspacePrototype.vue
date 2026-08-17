<script setup lang="ts">
import type { PrototypeWorkspaceEmits, PrototypeWorkspaceProps } from '../../types/prototype'
import NavigatorCanvas from './NavigatorCanvas.vue'

const props = defineProps<PrototypeWorkspaceProps>()
const emit = defineEmits<PrototypeWorkspaceEmits>()
</script>

<template>
  <div
    class="prototype-layout hybrid-layout"
    :class="{ 'hybrid-layout--outline-open': props.isOutlineOpen }"
  >
    <aside class="hybrid-rail" aria-label="Document navigation and commands">
      <div class="hybrid-rail__brand">
        <span class="hybrid-rail__mark">M</span>
        <span>
          <strong>Markdown</strong>
          <em>Studio</em>
        </span>
      </div>

      <button class="hybrid-new" type="button" @click="emit('clear')">
        <span aria-hidden="true">＋</span>
        New Markdown Document
      </button>

      <div class="hybrid-section-heading">
        <span>DOCUMENTS</span>
      </div>
      <div class="hybrid-document-item hybrid-document-item--active">
        <span class="hybrid-document-item__icon" aria-hidden="true">MD</span>
        <span>
          <strong>{{ props.displayName }}</strong>
          <small>{{ props.isDirty ? 'Unsaved changes' : 'Saved locally' }}</small>
        </span>
        <i v-if="props.isDirty" aria-label="Unsaved changes"></i>
      </div>

      <div class="hybrid-action-group" aria-label="Document commands">
        <button v-if="props.canOpenDocuments" type="button" @click="emit('openDocument')">
          <span aria-hidden="true">↥</span>
          Open document
        </button>
        <button v-if="props.canSaveDocuments" type="button" @click="emit('saveDocument')">
          <span aria-hidden="true">↓</span>
          Save document
        </button>
        <button type="button" @click="emit('openExamples')">
          <span aria-hidden="true">✦</span>
          Example Documents
        </button>
        <button aria-label="Insert table" type="button" @click="emit('insertTable')">
          <span aria-hidden="true">▦</span>
          Insert table
        </button>
        <button type="button" @click="emit('copy')">
          <span aria-hidden="true">◫</span>
          {{ props.isCopied ? 'Copied' : 'Copy Markdown' }}
        </button>
        <button v-if="props.canInstall" type="button" @click="emit('install')">
          <span aria-hidden="true">⌄</span>
          Install App
        </button>
        <button
          :disabled="!props.canExportPdf"
          :title="props.pdfExportUnavailableReason"
          type="button"
          @click="emit('exportPdf')"
        >
          <span aria-hidden="true">⌁</span>
          Export PDF
        </button>
      </div>

      <div class="hybrid-outline">
        <div class="hybrid-outline__heading">
          <span>OUTLINE</span>
          <button
            :aria-label="props.isOutlineOpen ? 'Hide document outline' : 'Show document outline'"
            :aria-pressed="props.isOutlineOpen"
            type="button"
            @click="emit('toggleOutline')"
          >
            {{ props.isOutlineOpen ? 'Hide' : 'Show' }}
          </button>
        </div>
        <slot name="outline" />
        <p v-if="!props.isOutlineOpen" class="hybrid-outline__hint">Show the document map</p>
      </div>

      <div class="hybrid-rail__footer">
        <button type="button" @click="emit('openShortcuts')">
          <span aria-hidden="true">⌘</span>
          Keyboard Shortcuts
        </button>
      </div>
    </aside>

    <section class="hybrid-main">
      <div class="hybrid-breadcrumb" aria-label="Document location">
        <div class="hybrid-breadcrumb__path">
          <span>EDITOR WORKSPACE</span>
          <b>/</b>
          <strong>{{ props.displayName }}</strong>
        </div>
        <div class="hybrid-tabs" role="tablist" aria-label="Open documents">
          <button class="hybrid-tab hybrid-tab--active" role="tab" type="button">
            <span class="hybrid-tab__dot"></span>
            {{ props.displayName }}
            <i v-if="props.isDirty" aria-label="Unsaved changes">•</i>
          </button>
        </div>
      </div>

      <div class="hybrid-canvas">
        <NavigatorCanvas
          :available-modes="props.availableModes"
          :can-export-pdf="props.canExportPdf"
          :can-install="props.canInstall"
          :can-open-documents="props.canOpenDocuments"
          :can-save-documents="props.canSaveDocuments"
          :display-name="props.displayName"
          :is-copied="props.isCopied"
          :is-dirty="props.isDirty"
          :is-outline-open="props.isOutlineOpen"
          :pdf-export-unavailable-reason="props.pdfExportUnavailableReason"
          :stats="props.stats"
          :status-text="props.statusText"
          :theme="props.theme"
          :view-mode="props.viewMode"
          @clear="emit('clear')"
          @copy="emit('copy')"
          @export-html="emit('exportHtml')"
          @export-pdf="emit('exportPdf')"
          @install="emit('install')"
          @insert-table="emit('insertTable')"
          @open-command-palette="emit('openCommandPalette')"
          @open-document="emit('openDocument')"
          @open-examples="emit('openExamples')"
          @open-find="emit('openFind')"
          @open-shortcuts="emit('openShortcuts')"
          @save-document="emit('saveDocument')"
          @toggle-outline="emit('toggleOutline')"
          @update:theme="emit('update:theme', $event)"
          @update:view-mode="emit('update:viewMode', $event)"
        >
          <template #banner>
            <slot name="banner" />
          </template>
          <template #editor>
            <slot name="editor" />
          </template>
          <template #preview>
            <slot name="preview" />
          </template>
          <template #outline>
            <slot name="outline" />
          </template>
          <template #status>
            <slot name="status" />
          </template>
        </NavigatorCanvas>
      </div>
    </section>
  </div>
</template>

<style scoped>
.prototype-layout {
  display: flex;
  min-height: 0;
  flex: 1;
  background: var(--bg);
  color: var(--text);
}

.hybrid-rail {
  display: flex;
  width: 260px;
  min-width: 260px;
  flex-direction: column;
  padding: 20px 14px 13px;
  border-right: 1px solid var(--border);
  background: color-mix(in srgb, var(--panel) 76%, var(--surface));
}

.hybrid-rail__brand {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 8px 20px;
  color: var(--accent);
  font-family: 'Fraunces', serif;
  font-size: 17px;
  line-height: 0.95;
}

.hybrid-rail__brand span:last-child {
  display: grid;
  gap: 3px;
}

.hybrid-rail__brand strong {
  font-weight: 500;
}

.hybrid-rail__brand em {
  font-weight: 300;
}

.hybrid-rail__mark {
  display: grid;
  width: 30px;
  height: 30px;
  place-items: center;
  border-radius: 9px;
  background: var(--accent);
  color: var(--surface);
  font-family: 'DM Sans', sans-serif;
  font-size: 13px;
  font-weight: 700;
}

.hybrid-new {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  min-height: 42px;
  padding: 0 12px;
  border: 1px solid var(--accent);
  border-radius: 10px;
  background: var(--accent);
  color: white;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}

.hybrid-new:hover {
  background: var(--accent-mid);
}

.hybrid-new span {
  font-size: 18px;
  font-weight: 300;
}

.hybrid-section-heading,
.hybrid-outline__heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: var(--text-faint);
  font-family: 'DM Mono', monospace;
  font-size: 9px;
  letter-spacing: 0.1em;
}

.hybrid-section-heading {
  margin: 24px 3px 8px;
}

.hybrid-outline__heading button {
  border: 0;
  background: transparent;
  color: var(--accent);
  font: inherit;
  cursor: pointer;
}

.hybrid-document-item {
  display: flex;
  align-items: center;
  gap: 9px;
  min-height: 48px;
  padding: 6px 8px;
  border: 1px solid var(--border);
  border-radius: 9px;
  background: var(--surface);
}

.hybrid-document-item__icon {
  display: grid;
  width: 27px;
  height: 27px;
  flex: 0 0 auto;
  place-items: center;
  border-radius: 7px;
  background: var(--accent-light);
  color: var(--accent);
  font-family: 'DM Mono', monospace;
  font-size: 8px;
  font-weight: 600;
}

.hybrid-document-item > span:nth-child(2) {
  display: grid;
  min-width: 0;
  gap: 3px;
}

.hybrid-document-item strong {
  overflow: hidden;
  font-size: 11px;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.hybrid-document-item small {
  color: var(--text-muted);
  font-size: 9px;
}

.hybrid-document-item i,
.hybrid-tab__dot {
  width: 6px;
  height: 6px;
  flex: 0 0 auto;
  border-radius: 50%;
  background: var(--accent);
}

.hybrid-document-item i {
  margin-left: auto;
}

.hybrid-action-group {
  display: grid;
  gap: 2px;
  margin: 14px -6px 13px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border);
}

.hybrid-action-group button,
.hybrid-rail__footer button {
  display: flex;
  align-items: center;
  gap: 9px;
  min-height: 32px;
  padding: 0 8px;
  border: 0;
  border-radius: 7px;
  background: transparent;
  color: var(--text-muted);
  font-size: 10px;
  text-align: left;
  cursor: pointer;
}

.hybrid-action-group button:hover,
.hybrid-rail__footer button:hover {
  background: var(--surface);
  color: var(--text);
}

.hybrid-action-group button span,
.hybrid-rail__footer button span {
  width: 17px;
  color: var(--accent);
  font-family: 'DM Mono', monospace;
  text-align: center;
}

.hybrid-action-group button:disabled {
  cursor: not-allowed;
  opacity: 0.45;
}

.hybrid-outline {
  display: flex;
  min-height: 0;
  flex: 1;
  flex-direction: column;
  overflow: hidden;
}

.hybrid-outline__heading {
  min-height: 31px;
  padding: 0 3px;
}

.hybrid-outline__heading button {
  font-family: 'DM Sans', sans-serif;
  font-size: 10px;
  letter-spacing: 0;
}

.hybrid-outline :deep(.outline-sidebar) {
  width: 100%;
  height: 100%;
  border-right: 0;
  background: transparent;
}

.hybrid-outline :deep(.outline-sidebar__header) {
  display: none;
}

.hybrid-outline :deep(.outline-sidebar__navigation) {
  height: 100%;
  padding: 0;
}

.hybrid-outline__hint {
  margin: 0;
  padding: 9px 3px;
  color: var(--text-faint);
  font-size: 10px;
}

.hybrid-rail__footer {
  display: grid;
  gap: 2px;
  padding-top: 11px;
  border-top: 1px solid var(--border);
}

.hybrid-main {
  display: flex;
  min-width: 0;
  min-height: 0;
  flex: 1;
  flex-direction: column;
}

.hybrid-breadcrumb {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  min-height: 50px;
  padding: 7px 18px 7px 22px;
  border-bottom: 1px solid var(--border);
  background: var(--surface);
}

.hybrid-breadcrumb__path {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  color: var(--text-faint);
  font-family: 'DM Mono', monospace;
  font-size: 9px;
  letter-spacing: 0.08em;
  white-space: nowrap;
}

.hybrid-breadcrumb__path b {
  color: var(--border-dark);
  font-weight: 400;
}

.hybrid-breadcrumb__path strong {
  max-width: 28vw;
  overflow: hidden;
  color: var(--text-muted);
  font-weight: 400;
  text-overflow: ellipsis;
}

.hybrid-tabs {
  display: flex;
  align-items: center;
  gap: 4px;
}

.hybrid-tab {
  min-height: 34px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--panel);
  color: var(--text-muted);
  font-size: 10px;
  cursor: pointer;
}

.hybrid-tab {
  display: flex;
  align-items: center;
  gap: 7px;
  max-width: 220px;
  padding: 0 10px;
}

.hybrid-tab--active {
  border-color: var(--accent-mid);
  background: var(--accent-light);
  color: var(--text);
}

.hybrid-tab__dot {
  width: 5px;
  height: 5px;
}

.hybrid-tab i {
  color: var(--accent);
  font-style: normal;
}

.hybrid-canvas {
  display: flex;
  min-height: 0;
  flex: 1;
}

.hybrid-canvas :deep(.focus-rail) {
  display: none;
}

.hybrid-canvas :deep(.focus-inspector) {
  display: none !important;
}

.hybrid-canvas :deep(.focus-preview-slot .focus-panel-label button) {
  display: none;
}

@media (max-width: 1100px) and (min-width: 701px) {
  .hybrid-rail {
    width: 220px;
    min-width: 220px;
  }

  .hybrid-breadcrumb {
    padding-right: 14px;
    padding-left: 16px;
  }
}

@media (max-width: 700px) {
  .hybrid-layout {
    position: relative;
    overflow: hidden;
  }

  .hybrid-rail {
    display: none;
  }

  .hybrid-breadcrumb {
    min-height: 48px;
    padding: 6px var(--app-gutter);
  }

  .hybrid-breadcrumb__path {
    display: none;
  }

  .hybrid-tabs {
    width: 100%;
  }

  .hybrid-tab {
    flex: 1;
    max-width: none;
    min-height: 36px;
    font-size: 11px;
  }

  .hybrid-canvas :deep(.focus-layout--outline-open .focus-inspector) {
    display: flex !important;
  }
}
</style>

<script setup lang="ts">
import ThemeToggle from '@/components/base/ThemeToggle.vue'
import ViewToggle from '@/components/base/ViewToggle.vue'

import type { PrototypeWorkspaceEmits, PrototypeWorkspaceProps } from '../../types/prototype'

const props = defineProps<PrototypeWorkspaceProps>()
const emit = defineEmits<PrototypeWorkspaceEmits>()

function handleThemeChange(payload: {
  origin: { x: number; y: number }
  theme: 'dark' | 'light'
}): void {
  emit('update:theme', payload)
}
</script>

<template>
  <div
    class="prototype-layout focus-layout"
    :class="[
      `focus-layout--${props.viewMode}`,
      { 'focus-layout--outline-open': props.isOutlineOpen },
    ]"
  >
    <aside class="focus-rail" aria-label="Workspace commands">
      <button
        class="focus-rail__logo"
        aria-label="New Markdown Document"
        type="button"
        @click="emit('clear')"
      >
        M
      </button>

      <div class="focus-rail__group">
        <button
          class="focus-rail__button focus-rail__button--new"
          type="button"
          @click="emit('clear')"
        >
          <span aria-hidden="true">＋</span>
          <span>New</span>
        </button>
        <button
          v-if="props.canOpenDocuments"
          class="focus-rail__button"
          type="button"
          @click="emit('openDocument')"
        >
          <span aria-hidden="true">↥</span>
          <span>Open</span>
        </button>
        <button
          v-if="props.canSaveDocuments"
          class="focus-rail__button"
          type="button"
          @click="emit('saveDocument')"
        >
          <span aria-hidden="true">↓</span>
          <span>Save</span>
        </button>
      </div>

      <div class="focus-rail__group focus-rail__group--scroll">
        <button class="focus-rail__button" type="button" @click="emit('openExamples')">
          <span aria-hidden="true">✦</span>
          <span>Examples</span>
        </button>
        <button
          aria-label="Insert table"
          class="focus-rail__button"
          type="button"
          @click="emit('insertTable')"
        >
          <span aria-hidden="true">▦</span>
          <span>Table</span>
        </button>
        <button class="focus-rail__button" type="button" @click="emit('copy')">
          <span aria-hidden="true">◫</span>
          <span>{{ props.isCopied ? 'Copied' : 'Copy' }}</span>
        </button>
        <button class="focus-rail__button" type="button" @click="emit('exportHtml')">
          <span aria-hidden="true">↗</span>
          <span>HTML</span>
        </button>
        <button
          class="focus-rail__button"
          :disabled="!props.canExportPdf"
          :title="props.pdfExportUnavailableReason"
          type="button"
          @click="emit('exportPdf')"
        >
          <span aria-hidden="true">⌁</span>
          <span>PDF</span>
        </button>
        <button
          v-if="props.canInstall"
          class="focus-rail__button"
          type="button"
          @click="emit('install')"
        >
          <span aria-hidden="true">⌄</span>
          <span>Install</span>
        </button>
      </div>

      <div class="focus-rail__group focus-rail__group--bottom">
        <button class="focus-rail__button" type="button" @click="emit('openFind')">
          <span aria-hidden="true">⌕</span>
          <span>Find</span>
        </button>
        <button
          :class="['focus-rail__button', { 'is-active': props.isOutlineOpen }]"
          type="button"
          @click="emit('toggleOutline')"
        >
          <span aria-hidden="true">☷</span>
          <span>Outline</span>
        </button>
        <button class="focus-rail__button" type="button" @click="emit('openShortcuts')">
          <span aria-hidden="true">⌘</span>
          <span>Shortcuts</span>
        </button>
        <button class="focus-rail__button" type="button" @click="emit('openCommandPalette')">
          <span aria-hidden="true">⌘K</span>
          <span>Commands</span>
        </button>
        <ThemeToggle compact :theme="props.theme" @toggle="handleThemeChange" />
      </div>
    </aside>

    <section class="focus-main">
      <slot name="banner" />

      <header class="focus-header">
        <div class="focus-header__document">
          <span class="focus-header__eyebrow">MARKDOWN DOCUMENT</span>
          <h1>
            {{ props.displayName }}
            <span v-if="props.isDirty" aria-label="unsaved" class="focus-header__dirty">●</span>
          </h1>
        </div>
        <div class="focus-header__center">
          <span class="focus-header__mode-label">WORKSPACE VIEW</span>
          <ViewToggle
            :available-modes="props.availableModes"
            :model-value="props.viewMode"
            @update:model-value="emit('update:viewMode', $event)"
          />
        </div>
        <div class="focus-header__actions">
          <button class="focus-header__command" type="button" @click="emit('openCommandPalette')">
            <span aria-hidden="true">⌘K</span>
            Commands
          </button>
          <button class="focus-header__export" type="button" @click="emit('exportHtml')">
            Export HTML
          </button>
        </div>
      </header>

      <div class="focus-workarea">
        <main class="focus-canvas">
          <div class="focus-canvas__meta">
            <div>
              <span class="focus-canvas__status"></span>
              {{ props.statusText }}
            </div>
            <div class="focus-canvas__stats">
              {{ props.stats.lines }} lines
              <span>·</span>
              {{ props.stats.words.toLocaleString() }} words
              <span>·</span>
              {{ props.stats.diagrams }} Mermaid
            </div>
          </div>

          <div class="focus-panels">
            <section class="focus-editor-slot" aria-label="Markdown editor">
              <div class="focus-panel-label">
                <span>01</span>
                Write
                <button type="button" @click="emit('openFind')">Find in document</button>
              </div>
              <slot name="editor" />
            </section>
            <section class="focus-preview-slot" aria-label="Live Preview">
              <div class="focus-panel-label">
                <span>02</span>
                Live Preview
                <button type="button" @click="emit('toggleOutline')">
                  {{ props.isOutlineOpen ? 'Close outline' : 'Show outline' }}
                </button>
              </div>
              <slot name="preview" />
            </section>
          </div>
        </main>

        <aside class="focus-inspector" aria-label="Document outline">
          <div class="focus-inspector__header">
            <span>DOCUMENT MAP</span>
            <button type="button" @click="emit('toggleOutline')">×</button>
          </div>
          <slot name="outline" />
        </aside>
      </div>

      <footer class="focus-status">
        <slot name="status" />
      </footer>
    </section>

    <nav class="focus-mobile-dock" aria-label="Mobile workspace commands">
      <button type="button" @click="emit('clear')"><span aria-hidden="true">＋</span>New</button>
      <button v-if="props.canOpenDocuments" type="button" @click="emit('openDocument')">
        <span aria-hidden="true">↥</span>Open
      </button>
      <button v-if="props.canSaveDocuments" type="button" @click="emit('saveDocument')">
        <span aria-hidden="true">↓</span>Save
      </button>
      <button type="button" @click="emit('openExamples')">
        <span aria-hidden="true">✦</span>Examples
      </button>
      <button type="button" @click="emit('insertTable')">
        <span aria-hidden="true">▦</span>Table
      </button>
      <button type="button" @click="emit('copy')"><span aria-hidden="true">◫</span>Copy</button>
      <button type="button" @click="emit('exportHtml')">
        <span aria-hidden="true">↗</span>HTML
      </button>
      <button type="button" :disabled="!props.canExportPdf" @click="emit('exportPdf')">
        <span aria-hidden="true">⌁</span>PDF
      </button>
      <button v-if="props.canInstall" type="button" @click="emit('install')">
        <span aria-hidden="true">⌄</span>Install
      </button>
      <button type="button" @click="emit('openFind')"><span aria-hidden="true">⌕</span>Find</button>
      <button type="button" @click="emit('toggleOutline')">
        <span aria-hidden="true">☷</span>Outline
      </button>
      <button type="button" @click="emit('openShortcuts')">
        <span aria-hidden="true">⌘</span>Shortcuts
      </button>
      <button type="button" @click="emit('openCommandPalette')">
        <span aria-hidden="true">⌘K</span>Commands
      </button>
      <ThemeToggle compact :theme="props.theme" @toggle="handleThemeChange" />
    </nav>
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

.focus-rail {
  display: flex;
  z-index: 4;
  width: 68px;
  min-width: 68px;
  flex-direction: column;
  align-items: center;
  gap: 13px;
  padding: 14px 8px;
  border-right: 1px solid var(--border);
  background: color-mix(in srgb, var(--text) 3%, var(--surface));
}

.focus-rail__logo {
  display: grid;
  width: 38px;
  height: 38px;
  place-items: center;
  border: 0;
  border-radius: 12px;
  background: var(--accent);
  color: white;
  font-family: 'Fraunces', serif;
  font-size: 18px;
  cursor: pointer;
}

.focus-rail__group {
  display: flex;
  width: 100%;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding-top: 12px;
  border-top: 1px solid var(--border);
}

.focus-rail__group--scroll {
  min-height: 0;
  overflow-y: auto;
  border-top: 0;
  scrollbar-width: none;
}

.focus-rail__group--scroll::-webkit-scrollbar {
  display: none;
}

.focus-rail__group--bottom {
  margin-top: auto;
}

.focus-rail__button {
  display: grid;
  width: 48px;
  min-height: 43px;
  place-items: center;
  gap: 2px;
  padding: 4px 2px;
  border: 1px solid transparent;
  border-radius: 10px;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
}

.focus-rail__button > span:first-child {
  color: var(--accent);
  font-family: 'DM Mono', monospace;
  font-size: 16px;
  line-height: 1;
}

.focus-rail__button > span:last-child {
  font-size: 8px;
}

.focus-rail__button:hover,
.focus-rail__button.is-active {
  border-color: var(--border);
  background: var(--panel);
  color: var(--text);
}

.focus-rail__button--new {
  background: var(--accent-light);
}

.focus-rail__button:disabled {
  cursor: not-allowed;
  opacity: 0.4;
}

.focus-rail__group--bottom :deep(.theme-toggle) {
  width: 40px;
  height: 40px;
  margin-top: 4px;
}

.focus-main {
  display: flex;
  min-width: 0;
  min-height: 0;
  flex: 1;
  flex-direction: column;
}

.focus-header {
  display: grid;
  grid-template-columns: minmax(170px, 1fr) auto minmax(170px, 1fr);
  align-items: center;
  gap: 18px;
  min-height: 82px;
  padding: 16px 24px;
  border-bottom: 1px solid var(--border);
  background: var(--surface);
}

.focus-header__document h1 {
  max-width: 320px;
  overflow: hidden;
  margin-top: 5px;
  font-family: 'Fraunces', serif;
  font-size: 21px;
  font-weight: 400;
  letter-spacing: -0.02em;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.focus-header__eyebrow,
.focus-header__mode-label,
.focus-panel-label,
.focus-inspector__header span {
  color: var(--text-faint);
  font-family: 'DM Mono', monospace;
  font-size: 9px;
  letter-spacing: 0.1em;
}

.focus-header__dirty {
  margin-left: 6px;
  color: var(--accent);
  font-family: 'DM Sans', sans-serif;
  font-size: 10px;
  vertical-align: middle;
}

.focus-header__center {
  display: grid;
  justify-items: center;
  gap: 7px;
}

.focus-header__center :deep(.view-toggle) {
  border-radius: 8px;
}

.focus-header__center :deep(.view-toggle button) {
  height: 31px;
  font-size: 10px;
}

.focus-header__actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.focus-header__command,
.focus-header__export {
  min-height: 35px;
  padding: 0 11px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: transparent;
  color: var(--text-muted);
  font-size: 11px;
  cursor: pointer;
}

.focus-header__command:hover {
  background: var(--panel);
  color: var(--text);
}

.focus-header__command span {
  margin-right: 4px;
  color: var(--accent);
  font-family: 'DM Mono', monospace;
}

.focus-header__export {
  border-color: var(--accent);
  background: var(--accent);
  color: white;
  font-weight: 600;
}

.focus-header__export:hover {
  background: var(--accent-mid);
}

.focus-workarea {
  display: flex;
  min-height: 0;
  flex: 1;
  overflow: hidden;
}

.focus-canvas {
  display: flex;
  min-width: 0;
  min-height: 0;
  flex: 1;
  flex-direction: column;
  padding: 15px 18px 18px;
}

.focus-canvas__meta {
  display: flex;
  justify-content: space-between;
  gap: 14px;
  padding: 0 3px 12px;
  color: var(--text-muted);
  font-family: 'DM Mono', monospace;
  font-size: 10px;
}

.focus-canvas__meta > div:first-child {
  display: flex;
  align-items: center;
  gap: 7px;
}

.focus-canvas__status {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #54bc93;
}

.focus-canvas__stats {
  color: var(--text-faint);
}

.focus-canvas__stats span {
  padding: 0 5px;
  color: var(--border-dark);
}

.focus-panels {
  display: flex;
  min-height: 0;
  flex: 1;
  overflow: hidden;
  border: 1px solid var(--border);
  border-radius: 14px;
  background: var(--surface);
  box-shadow: 0 10px 28px color-mix(in srgb, var(--text) 5%, transparent);
}

.focus-editor-slot,
.focus-preview-slot {
  display: flex;
  min-width: 0;
  min-height: 0;
  flex: 1;
  flex-direction: column;
}

.focus-editor-slot {
  border-right: 1px solid var(--border);
}

.focus-panel-label {
  display: flex;
  align-items: center;
  gap: 9px;
  min-height: 34px;
  padding: 0 13px;
  border-bottom: 1px solid var(--border);
  background: var(--panel);
  color: var(--text-muted);
  font-family: 'DM Sans', sans-serif;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.focus-panel-label > span {
  color: var(--accent);
  font-family: 'DM Mono', monospace;
  font-size: 9px;
}

.focus-panel-label button {
  margin-left: auto;
  border: 0;
  background: transparent;
  color: var(--text-faint);
  font-size: 10px;
  cursor: pointer;
}

.focus-panel-label button:hover {
  color: var(--accent);
}

.focus-editor-slot :deep(.editor-pane),
.focus-preview-slot :deep(.preview-pane) {
  border-right: 0;
}

.focus-editor-slot :deep(.pane-header),
.focus-preview-slot :deep(.pane-header) {
  display: none;
}

.focus-layout--editor .focus-preview-slot,
.focus-layout--preview .focus-editor-slot {
  display: none;
}

.focus-inspector {
  display: none;
  width: 250px;
  min-width: 250px;
  flex-direction: column;
  border-left: 1px solid var(--border);
  background: var(--surface);
}

.focus-layout--outline-open .focus-inspector {
  display: flex;
}

.focus-inspector__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 43px;
  padding: 0 13px;
  border-bottom: 1px solid var(--border);
}

.focus-inspector__header button {
  border: 0;
  background: transparent;
  color: var(--text-muted);
  font-size: 18px;
  cursor: pointer;
}

.focus-inspector :deep(.outline-sidebar) {
  width: 100%;
  height: calc(100% - 43px);
  border-right: 0;
}

.focus-inspector :deep(.outline-sidebar__header) {
  display: none;
}

.focus-inspector :deep(.outline-sidebar__navigation) {
  height: 100%;
}

.focus-status {
  min-height: var(--status-h);
}

.focus-mobile-dock {
  display: none;
}

@media (max-width: 1100px) and (min-width: 701px) {
  .focus-header {
    grid-template-columns: minmax(150px, 1fr) auto auto;
    padding-right: 16px;
    padding-left: 16px;
  }

  .focus-header__command {
    width: 35px;
    overflow: hidden;
    padding: 0;
    font-size: 0;
  }

  .focus-header__command span {
    margin: 0;
    font-size: 14px;
  }

  .focus-header__export {
    font-size: 10px;
  }

  .focus-inspector {
    width: 210px;
    min-width: 210px;
  }
}

@media (max-width: 700px) {
  .focus-layout {
    position: relative;
    overflow: hidden;
    padding-bottom: 66px;
  }

  .focus-rail {
    display: none;
  }

  .focus-header {
    display: flex;
    align-items: center;
    gap: 10px;
    min-height: 69px;
    padding: 11px var(--app-gutter);
  }

  .focus-header__document {
    min-width: 0;
    flex: 1;
  }

  .focus-header__document h1 {
    max-width: 52vw;
    font-size: 19px;
  }

  .focus-header__eyebrow {
    font-size: 8px;
  }

  .focus-header__center {
    order: 3;
  }

  .focus-header__mode-label {
    display: none;
  }

  .focus-header__center :deep(.view-toggle) {
    border-radius: 10px;
  }

  .focus-header__center :deep(.view-toggle button) {
    height: 42px;
    font-size: 12px;
  }

  .focus-header__actions {
    order: 2;
  }

  .focus-header__command {
    display: grid;
    width: 42px;
    height: 42px;
    place-items: center;
    padding: 0;
    font-size: 0;
    border-radius: 10px;
  }

  .focus-header__command span {
    margin: 0;
    font-size: 15px;
  }

  .focus-header__export {
    display: none;
  }

  .focus-workarea {
    position: relative;
  }

  .focus-canvas {
    padding: 10px 0 0;
  }

  .focus-canvas__meta {
    min-height: 30px;
    padding: 0 var(--app-gutter) 9px;
    font-size: 9px;
  }

  .focus-canvas__stats {
    display: none;
  }

  .focus-panels {
    border-right: 0;
    border-bottom: 0;
    border-left: 0;
    border-radius: 0;
    box-shadow: none;
  }

  .focus-editor-slot {
    border-right: 0;
  }

  .focus-panel-label {
    min-height: 34px;
  }

  .focus-inspector {
    position: absolute;
    z-index: 30;
    inset: 0;
    width: 100%;
    min-width: 0;
    border-left: 0;
  }

  .focus-inspector__header {
    min-height: 49px;
    padding: 0 var(--app-gutter);
  }

  .focus-mobile-dock {
    position: absolute;
    z-index: 20;
    right: 0;
    bottom: 0;
    left: 0;
    display: flex;
    align-items: center;
    gap: 7px;
    min-height: 66px;
    overflow-x: auto;
    padding: 9px var(--app-gutter) max(9px, env(safe-area-inset-bottom));
    border-top: 1px solid var(--border);
    background: color-mix(in srgb, var(--surface) 94%, transparent);
    box-shadow: 0 -10px 25px color-mix(in srgb, var(--text) 8%, transparent);
    scrollbar-width: none;
    backdrop-filter: blur(14px);
  }

  .focus-mobile-dock::-webkit-scrollbar {
    display: none;
  }

  .focus-mobile-dock button {
    display: grid;
    min-width: 58px;
    min-height: 46px;
    flex: 0 0 auto;
    place-items: center;
    gap: 2px;
    padding: 3px 6px;
    border: 1px solid var(--border);
    border-radius: 10px;
    background: var(--surface);
    color: var(--text-muted);
    font-size: 10px;
    cursor: pointer;
  }

  .focus-mobile-dock button:hover,
  .focus-mobile-dock button:focus-visible {
    border-color: var(--accent-mid);
    color: var(--accent);
  }

  .focus-mobile-dock button > span {
    color: var(--accent);
    font-family: 'DM Mono', monospace;
    font-size: 15px;
  }

  .focus-mobile-dock button:disabled {
    cursor: not-allowed;
    opacity: 0.4;
  }

  .focus-mobile-dock :deep(.theme-toggle) {
    min-width: 46px;
    min-height: 46px;
  }

  .focus-status :deep(.status-bar) {
    padding-right: var(--app-gutter);
    padding-left: var(--app-gutter);
  }
}
</style>

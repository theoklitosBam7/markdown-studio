<script setup lang="ts">
import type { DocumentFolderNode, SidebarTab } from '../types'

import SidebarTabs from './SidebarTabs.vue'

interface Props {
  activePath?: null | string
  isAvailable: boolean
  message?: null | string
  nodes: DocumentFolderNode[]
  tab: SidebarTab
}

const props = withDefaults(defineProps<Props>(), {
  activePath: null,
  message: null,
})

const emit = defineEmits<{
  add: []
  changeTab: [tab: SidebarTab]
  open: [node: DocumentFolderNode]
  remove: [folderId: string]
  toggle: [node: DocumentFolderNode]
}>()

const nodeElements: HTMLButtonElement[] = []

function activate(node: DocumentFolderNode): void {
  if (node.kind === 'folder') {
    emit('toggle', node)
    return
  }

  emit('open', node)
}

function focusNode(index: number): void {
  nodeElements[index]?.focus()
}

function handleKeydown(event: KeyboardEvent, index: number): void {
  const node = props.nodes[index]
  if (!node) return

  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault()
      focusNode(index + 1)
      return
    case 'ArrowLeft':
      event.preventDefault()
      if (node.isExpanded) emit('toggle', node)
      return
    case 'ArrowRight':
      event.preventDefault()
      if (!node.isExpanded) emit('toggle', node)
      return
    case 'ArrowUp':
      event.preventDefault()
      focusNode(index - 1)
      return
    case 'Enter':
      event.preventDefault()
      activate(node)
      return
    default:
      return
  }
}

function isActiveDocument(node: DocumentFolderNode): boolean {
  return node.kind === 'file' && node.path === props.activePath
}

function setNodeElement(element: unknown, index: number): void {
  if (element instanceof HTMLButtonElement) {
    nodeElements[index] = element
  }
}
</script>

<template>
  <aside class="folder-sidebar">
    <div class="folder-sidebar__header">
      <SidebarTabs :active="tab" @change="emit('changeTab', $event)" />
    </div>

    <div class="folder-sidebar__body">
      <button class="folder-sidebar__add" type="button" @click="emit('add')">Add Folder…</button>

      <p v-if="message" class="folder-sidebar__message" role="status">{{ message }}</p>

      <p v-if="nodes.length === 0" class="folder-sidebar__empty">
        No folders open. Add a folder to browse its Markdown files.
      </p>

      <div v-else class="folder-sidebar__tree">
        <div
          v-for="(node, index) in nodes"
          :key="node.key"
          class="folder-sidebar__row"
          :style="{ '--node-depth': String(node.depth) }"
        >
          <button
            :ref="(element) => setNodeElement(element, index)"
            :aria-current="isActiveDocument(node) ? 'true' : undefined"
            :aria-expanded="node.kind === 'folder' ? node.isExpanded : undefined"
            class="folder-sidebar__node"
            :class="{
              'folder-sidebar__node--active': isActiveDocument(node),
              'folder-sidebar__node--folder': node.kind === 'folder',
            }"
            type="button"
            @click="activate(node)"
            @keydown="handleKeydown($event, index)"
          >
            {{ node.label }}
          </button>

          <button
            v-if="node.depth === 0"
            :aria-label="`Remove ${node.label}`"
            class="folder-sidebar__remove"
            type="button"
            @click="emit('remove', node.folderId)"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  </aside>
</template>

<style scoped>
.folder-sidebar {
  width: 248px;
  flex: 0 0 248px;
  min-width: 0;
  overflow: hidden;
  background: var(--surface);
  border-right: 1px solid var(--border);
}

.folder-sidebar__header {
  height: 42px;
  display: flex;
  align-items: center;
  border-bottom: 1px solid var(--border);
}

.folder-sidebar__header :deep(.sidebar-tabs) {
  flex: 1;
}

.folder-sidebar__body {
  height: calc(100% - 43px);
  display: flex;
  flex-direction: column;
  gap: 10px;
  overflow-y: auto;
  padding: 12px 10px;
}

.folder-sidebar__add {
  height: 30px;
  border: 1px dashed var(--border);
  border-radius: 7px;
  background: transparent;
  color: var(--text);
  cursor: pointer;
  font-size: 12px;
  font-weight: 600;
}

.folder-sidebar__add:hover {
  border-color: var(--text-muted);
}

.folder-sidebar__message,
.folder-sidebar__empty {
  margin: 0;
  color: var(--text-muted);
  font-size: 12px;
  line-height: 1.5;
}

.folder-sidebar__tree {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.folder-sidebar__row {
  display: flex;
  align-items: center;
  gap: 2px;
}

.folder-sidebar__node {
  flex: 1;
  min-width: 0;
  padding: 5px 8px 5px calc(8px + var(--node-depth, 0) * 14px);
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: var(--text);
  cursor: pointer;
  font-size: 12px;
  overflow: hidden;
  text-align: left;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.folder-sidebar__node:hover {
  background: var(--surface-hover, rgb(0 0 0 / 4%));
}

.folder-sidebar__node--folder {
  font-weight: 600;
}

.folder-sidebar__node--active {
  background: var(--surface-raised, rgb(0 0 0 / 7%));
  font-weight: 650;
}

.folder-sidebar__remove {
  flex: 0 0 auto;
  width: 22px;
  height: 22px;
  border: 0;
  border-radius: 5px;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  font-size: 14px;
  line-height: 1;
}

.folder-sidebar__remove:hover {
  background: var(--surface-hover, rgb(0 0 0 / 4%));
  color: var(--text);
}
</style>

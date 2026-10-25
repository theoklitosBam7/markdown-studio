<script setup lang="ts">
import type { MarkdownOutlineHeading, SidebarTab } from '../types'

import SidebarTabs from './SidebarTabs.vue'

interface Props {
  activeHeadingId?: null | string
  folderTabAvailable?: boolean
  headings: MarkdownOutlineHeading[]
  tab?: SidebarTab
}

withDefaults(defineProps<Props>(), {
  activeHeadingId: null,
  folderTabAvailable: false,
  tab: 'outline',
})

const emit = defineEmits<{
  changeTab: [tab: SidebarTab]
  navigate: [offset: number]
}>()

function headingStyle(depth: number): Record<string, string> {
  return { '--heading-depth': String(Math.max(0, depth - 1)) }
}
</script>

<template>
  <aside class="outline-sidebar">
    <div class="outline-sidebar__header">
      <SidebarTabs v-if="folderTabAvailable" :active="tab" @change="emit('changeTab', $event)" />
      <template v-else>Outline</template>
    </div>
    <nav aria-label="Document outline" class="outline-sidebar__navigation">
      <p v-if="headings.length === 0" class="outline-sidebar__empty">No headings</p>
      <button
        v-for="heading in headings"
        :key="heading.id"
        :aria-current="heading.id === activeHeadingId ? 'location' : undefined"
        class="outline-sidebar__heading"
        :class="{ 'outline-sidebar__heading--active': heading.id === activeHeadingId }"
        :style="headingStyle(heading.depth)"
        type="button"
        @click="emit('navigate', heading.start)"
      >
        {{ heading.text }}
      </button>
    </nav>
  </aside>
</template>

<style scoped>
.outline-sidebar {
  width: 248px;
  flex: 0 0 248px;
  min-width: 0;
  overflow: hidden;
  background: var(--surface);
  border-right: 1px solid var(--border);
}

.outline-sidebar__header {
  height: 42px;
  display: flex;
  align-items: center;
  padding: 0 18px;
  gap: 8px;
  border-bottom: 1px solid var(--border);
  color: var(--text);
  font-size: 12px;
  font-weight: 650;
  letter-spacing: -0.01em;
}

.outline-sidebar__header :deep(.sidebar-tabs) {
  flex: 1;
  padding: 6px 0;
}

.outline-sidebar__navigation {
  height: calc(100% - 43px);
  overflow-y: auto;
  padding: 12px 10px;
}

.outline-sidebar__heading {
  width: 100%;
  display: block;
  overflow: hidden;
  padding: 9px 10px 9px calc(10px + var(--heading-depth) * 14px);
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: var(--text-muted);
  font: inherit;
  font-size: 12px;
  line-height: 1.4;
  text-align: left;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: pointer;
}

.outline-sidebar__heading:hover {
  background: var(--panel);
  color: var(--text);
}

.outline-sidebar__heading--active {
  background: var(--accent-light);
  color: var(--accent);
  font-weight: 600;
}

.outline-sidebar__heading:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: -2px;
}

.outline-sidebar__empty {
  margin: 0;
  padding: 12px 8px;
  color: var(--text-muted);
  font-size: 12px;
}

@media (max-width: 700px) {
  .outline-sidebar {
    width: 100%;
    flex-basis: 100%;
    border-right: 0;
  }
}
</style>

<script setup lang="ts">
import type { SidebarTab } from '../types'

interface Props {
  active: SidebarTab
}

defineProps<Props>()

const emit = defineEmits<{
  change: [tab: SidebarTab]
}>()

const tabs: { id: SidebarTab; label: string }[] = [
  { id: 'outline', label: 'Outline' },
  { id: 'folders', label: 'Folders' },
]
</script>

<template>
  <div class="sidebar-tabs" role="tablist">
    <button
      v-for="tab in tabs"
      :key="tab.id"
      :aria-selected="tab.id === active"
      class="sidebar-tabs__tab"
      :class="{ 'sidebar-tabs__tab--active': tab.id === active }"
      role="tab"
      type="button"
      @click="emit('change', tab.id)"
    >
      {{ tab.label }}
    </button>
  </div>
</template>

<style scoped>
.sidebar-tabs {
  display: flex;
  gap: 4px;
  padding: 6px;
}

.sidebar-tabs__tab {
  flex: 1;
  height: 28px;
  border: 0;
  border-radius: 7px;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: -0.01em;
}

.sidebar-tabs__tab:hover {
  background: var(--surface-hover, rgb(0 0 0 / 4%));
  color: var(--text);
}

.sidebar-tabs__tab--active {
  background: var(--surface-raised, rgb(0 0 0 / 7%));
  color: var(--text);
}
</style>

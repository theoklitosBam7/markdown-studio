<script setup lang="ts">
import { PanelLeft, Search } from '@lucide/vue'

interface Props {
  isOutlineOpen: boolean
}

defineProps<Props>()

const emit = defineEmits<{
  find: []
  toggleOutline: []
}>()
</script>

<template>
  <aside class="workspace-rail" aria-label="Workspace tools">
    <div class="workspace-rail__brand" aria-label="Markdown Studio">M</div>

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
  </aside>
</template>

<style scoped>
.workspace-rail {
  z-index: 2;
  display: flex;
  width: 56px;
  flex: 0 0 56px;
  flex-direction: column;
  align-items: center;
  gap: 22px;
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
.workspace-rail__button[aria-pressed='true'] {
  border-color: var(--border);
  background: var(--raised-bg);
  color: var(--text);
}

.workspace-rail__button:focus-visible {
  outline: 2px solid var(--focus-ring);
  outline-offset: 2px;
}
</style>

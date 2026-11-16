<script setup lang="ts">
interface Props {
  chars: number
  diagrams: number
  lines: number
  status?: string
  words: number
}

const props = withDefaults(defineProps<Props>(), {
  status: 'Ready',
})
</script>

<template>
  <div class="status-bar">
    <div class="status-item">{{ props.status }}</div>
    <div class="status-item status-item--stats">
      <span>{{ props.words.toLocaleString() }} words</span>
      <span class="status-item__separator" aria-hidden="true">·</span>
      <span>{{ props.chars.toLocaleString() }} chars</span>
      <span class="status-item__separator" aria-hidden="true">·</span>
      <span>{{ props.lines.toLocaleString() }} lines</span>
      <span class="status-item__separator" aria-hidden="true">·</span>
      <span>{{ props.diagrams }} diagram{{ props.diagrams !== 1 ? 's' : '' }}</span>
    </div>
  </div>
</template>

<style scoped>
.status-bar {
  min-height: 28px;
  background: var(--surface);
  display: flex;
  align-items: center;
  padding: 0 var(--app-gutter);
  gap: 16px;
  flex-shrink: 0;
  overflow-x: auto;
  border-top: 1px solid var(--border);
}

.status-item {
  font-size: var(--font-size-ui-caption);
  color: var(--text-muted);
  font-weight: 400;
  display: flex;
  align-items: center;
  gap: 4px;
}

.status-item--stats {
  margin-left: auto;
  font-family: 'DM Mono', monospace;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.status-item__separator {
  padding: 0 4px;
  color: var(--text-faint);
}

@media (max-width: 700px) {
  .status-bar {
    gap: 10px;
    padding: 0 max(var(--app-gutter), env(safe-area-inset-right)) env(safe-area-inset-bottom)
      max(var(--app-gutter), env(safe-area-inset-left));
  }
}
</style>

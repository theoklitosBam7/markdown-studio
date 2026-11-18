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
      <span class="status-item__stat--words">{{ props.words.toLocaleString() }} words</span>
      <span class="status-item__separator status-item__separator--chars" aria-hidden="true">·</span>
      <span class="status-item__stat--chars">{{ props.chars.toLocaleString() }} chars</span>
      <span class="status-item__separator status-item__separator--lines" aria-hidden="true">·</span>
      <span class="status-item__stat--lines">{{ props.lines.toLocaleString() }} lines</span>
      <span class="status-item__separator status-item__separator--diagrams" aria-hidden="true">
        ·
      </span>
      <span class="status-item__stat--diagrams">
        {{ props.diagrams }} diagram{{ props.diagrams !== 1 ? 's' : '' }}
      </span>
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
  padding-left: var(--app-gutter);
  padding-left: max(var(--app-gutter), env(safe-area-inset-left));
  padding-right: var(--app-gutter);
  padding-right: max(var(--app-gutter), env(safe-area-inset-right));
  padding-bottom: 0;
  padding-bottom: env(safe-area-inset-bottom);
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
    gap: 8px;
  }

  .status-item--stats {
    padding-left: 8px;
    border-left: 1px solid var(--border);
  }

  .status-item__stat--chars,
  .status-item__stat--lines,
  .status-item__separator--chars,
  .status-item__separator--lines {
    display: none;
  }
}
</style>

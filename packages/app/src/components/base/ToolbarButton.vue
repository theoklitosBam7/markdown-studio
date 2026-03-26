<script setup lang="ts">
interface Props {
  active?: boolean
  ariaLabel?: string
  compact?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  active: false,
  ariaLabel: undefined,
  compact: false,
})

const emit = defineEmits<{
  click: []
}>()

function handleClick(): void {
  emit('click')
}
</script>

<template>
  <button
    :class="['toolbar-btn', { active: props.active, compact: props.compact }]"
    :aria-label="props.ariaLabel"
    type="button"
    @click="handleClick"
  >
    <slot />
  </button>
</template>

<style scoped>
.toolbar-btn {
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
  transition: all 0.15s;
  white-space: nowrap;
}

.toolbar-btn.compact {
  padding: 0 9px;
}

.toolbar-btn:hover {
  background: var(--panel);
  color: var(--text);
  border-color: var(--border-dark);
}

.toolbar-btn.active {
  background: var(--accent-light);
  color: var(--accent);
  border-color: var(--accent-mid);
}

.toolbar-btn :deep(svg) {
  width: 13px;
  height: 13px;
  flex-shrink: 0;
}

@media (max-width: 700px) {
  .toolbar-btn {
    height: 36px;
    min-width: 36px;
    font-size: 11px;
  }
}
</style>

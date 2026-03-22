<script setup lang="ts">
interface Props {
  chars: number
  diagrams: number
  status?: string
}

const props = withDefaults(defineProps<Props>(), {
  status: 'Ready',
})
</script>

<template>
  <div class="status-bar">
    <div class="status-item">
      <span class="status-dot"></span>
      {{ props.status }}
    </div>
    <div class="status-item">
      Mermaid: {{ props.diagrams }} diagram{{ props.diagrams !== 1 ? 's' : '' }}
    </div>
    <div class="status-item">{{ props.chars.toLocaleString() }} chars</div>
  </div>
</template>

<style scoped>
.status-bar {
  height: 24px;
  background: var(--accent);
  display: flex;
  align-items: center;
  padding: 0 14px;
  gap: 16px;
  flex-shrink: 0;
}

.status-item {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.75);
  font-weight: 400;
  display: flex;
  align-items: center;
  gap: 4px;
}

.status-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: #5fe8b8;
}
</style>

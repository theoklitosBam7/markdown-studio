<script setup lang="ts">
interface Props {
  chars: number
  diagrams: number
  documentName?: string
  isDirty?: boolean
  status?: string
}

const props = withDefaults(defineProps<Props>(), {
  documentName: 'Untitled.md',
  isDirty: false,
  status: 'Ready',
})
</script>

<template>
  <div class="status-bar">
    <div class="status-item">
      <span class="status-dot"></span>
      {{ props.status }}
    </div>
    <div class="status-item status-item--document">
      {{ props.documentName }}<span v-if="props.isDirty"> • Unsaved</span>
    </div>
    <div class="status-item status-item--diagrams">
      Mermaid: {{ props.diagrams }} diagram{{ props.diagrams !== 1 ? 's' : '' }}
    </div>
    <div class="status-item status-item--chars">{{ props.chars.toLocaleString() }} chars</div>
  </div>
</template>

<style scoped>
.status-bar {
  min-height: var(--status-h);
  background: var(--accent);
  display: flex;
  align-items: center;
  padding: 0 var(--app-gutter);
  gap: 16px;
  flex-shrink: 0;
  overflow-x: auto;
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

@media (max-width: 700px) {
  .status-bar {
    gap: 10px;
  }

  .status-item--document,
  .status-item--diagrams {
    display: none;
  }

  .status-item--chars {
    margin-left: auto;
  }
}
</style>

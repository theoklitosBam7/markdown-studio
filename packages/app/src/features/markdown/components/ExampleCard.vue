<script setup lang="ts">
import type { Example } from '../types'

interface Props {
  example: Example
}

const props = defineProps<Props>()

const emit = defineEmits<{
  select: [example: Example]
}>()

function handleClick(): void {
  emit('select', props.example)
}

function handleKeyDown(event: KeyboardEvent): void {
  if (event.key === 'Enter' || event.key === ' ' || event.key === 'Spacebar') {
    event.preventDefault()
    handleClick()
  }
}
</script>

<template>
  <div
    class="example-card"
    role="button"
    tabindex="0"
    @click="handleClick"
    @keydown="handleKeyDown"
  >
    <h3>{{ props.example.title }}</h3>
    <p>{{ props.example.desc }}</p>
  </div>
</template>

<style scoped>
.example-card {
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 12px 14px;
  cursor: pointer;
  transition: all 0.15s;
}

.example-card:hover {
  border-color: var(--accent-mid);
  background: var(--accent-light);
}

.example-card h3 {
  font-size: 13px;
  font-weight: 500;
  margin: 0 0 3px 0;
  color: var(--text);
}

.example-card p {
  font-size: 12px;
  color: var(--text-muted);
  line-height: 1.4;
  margin: 0;
}

@media (max-width: 700px) {
  .example-card {
    padding: 14px;
  }
}
</style>

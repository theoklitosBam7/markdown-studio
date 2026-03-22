<script setup lang="ts">
import Modal from '@/components/base/Modal.vue'

import type { Example } from '../types'

import { EXAMPLES } from '../composables/examples'
import ExampleCard from './ExampleCard.vue'

interface Props {
  isOpen: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  close: []
  select: [example: Example]
}>()

function handleClose(): void {
  emit('close')
}

function handleSelect(example: Example): void {
  emit('select', example)
  emit('close')
}
</script>

<template>
  <Modal :is-open="props.isOpen" @close="handleClose">
    <template #header="{ titleId }">
      <h2 :id="titleId">Load an example</h2>
    </template>
    <ExampleCard
      v-for="example in EXAMPLES"
      :key="example.title"
      :example="example"
      @select="handleSelect"
    />
  </Modal>
</template>

<script setup lang="ts">
import { computed, shallowRef, useId, useTemplateRef, watch } from 'vue'

import type { ViewMode } from '@/types/editor'

import { useWorkspaceSplitPreference } from '../composables/useWorkspaceLayoutPreferences'
import { useWorkspaceWidth } from '../composables/useWorkspaceWidth'
import { WORKSPACE_GUTTER_WIDTH, WORKSPACE_PANE_MIN_WIDTH } from '../utils/workspaceLayoutSizing'
import WorkspaceResizeDivider from './WorkspaceResizeDivider.vue'
import WorkspaceWidthControl from './WorkspaceWidthControl.vue'

const props = defineProps<{ viewMode: ViewMode }>()

const editorId = useId()
const { commit, preferredValue, storageError } = useWorkspaceSplitPreference()
const container = useTemplateRef<HTMLElement>('container')
const width = useWorkspaceWidth(container)
const paneSpace = computed(() => Math.max(0, width.value - WORKSPACE_GUTTER_WIDTH))
const canResize = computed(
  () => props.viewMode === 'split' && paneSpace.value > WORKSPACE_PANE_MIN_WIDTH * 2,
)
const minimumRatio = computed(() =>
  canResize.value ? WORKSPACE_PANE_MIN_WIDTH / paneSpace.value : 0.5,
)
const maximumRatio = computed(() => 1 - minimumRatio.value)
const draftRatio = shallowRef<null | number>(null)
let dragStartRatio = 0.5
const effectiveRatio = computed(() =>
  Math.min(
    maximumRatio.value,
    Math.max(minimumRatio.value, draftRatio.value ?? preferredValue.value),
  ),
)
const columns = computed(() =>
  props.viewMode === 'split'
    ? `minmax(0, ${effectiveRatio.value}fr) ${WORKSPACE_GUTTER_WIDTH}px minmax(0, ${1 - effectiveRatio.value}fr)`
    : 'minmax(0, 1fr)',
)
const valueText = computed(() => {
  const percentage = Math.round(effectiveRatio.value * 100)
  return `Editor ${percentage} percent, Live Preview ${100 - percentage} percent`
})

function commitRatio(ratio: number): void {
  if (!canResize.value) return
  commit(Math.min(maximumRatio.value, Math.max(minimumRatio.value, ratio)))
}

function finishDrag(): void {
  if (draftRatio.value !== null && draftRatio.value !== dragStartRatio)
    commitRatio(draftRatio.value)
  draftRatio.value = null
}

function moveDrag(displacement: number): void {
  if (!canResize.value) return
  draftRatio.value = Math.min(
    maximumRatio.value,
    Math.max(minimumRatio.value, dragStartRatio + displacement / paneSpace.value),
  )
}

function startDrag(): void {
  dragStartRatio = effectiveRatio.value
}

function stepRatio(direction: -1 | 1, large: boolean): void {
  commitRatio(effectiveRatio.value + direction * (large ? 0.05 : 0.01))
}

watch(
  () => props.viewMode,
  () => {
    draftRatio.value = null
  },
)
</script>

<template>
  <div ref="container" class="workspace-split" :style="{ gridTemplateColumns: columns }">
    <section
      v-show="viewMode !== 'preview'"
      :id="editorId"
      class="workspace-split__editor"
      aria-label="Markdown editor"
    >
      <slot name="editor" />
    </section>
    <div v-if="viewMode === 'split'" class="workspace-split__gutter">
      <WorkspaceWidthControl
        label="Pane widths"
        field-label="Editor"
        input-label="Editor percentage"
        unit="%"
        :value="Math.round(effectiveRatio * 10000) / 100"
        :min="minimumRatio * 100"
        :max="maximumRatio * 100"
        :step="1"
        :disabled="!canResize"
        reset-label="Reset to equal widths"
        :notice="storageError"
        :explanation="
          !canResize
            ? 'Widen the window, or narrow or hide the sidebar, to resize the panes.'
            : undefined
        "
        @apply="commitRatio($event / 100)"
        @reset="commit(0.5)"
      />
      <WorkspaceResizeDivider
        :controls="editorId"
        label="Markdown editor width"
        :value="effectiveRatio * 100"
        :min="minimumRatio * 100"
        :max="maximumRatio * 100"
        :value-text="valueText"
        :disabled="!canResize"
        instructions="Use Left and Right Arrow to resize by one percentage point, or five with Shift. Home and End select the limits."
        @start="startDrag"
        @move="moveDrag"
        @commit="finishDrag"
        @cancel="draftRatio = null"
        @step="stepRatio"
        @minimum="commitRatio(minimumRatio)"
        @maximum="commitRatio(maximumRatio)"
        @reset="commit(0.5)"
      />
    </div>
    <section
      v-show="viewMode !== 'editor'"
      class="workspace-split__preview"
      aria-label="Live Preview"
    >
      <slot name="preview" />
    </section>
  </div>
</template>

<style scoped>
.workspace-split {
  display: grid;
  flex: 1;
  min-width: 0;
  min-height: 0;
}

.workspace-split__editor :deep(.editor-pane) {
  border-right: 0;
}

.workspace-split__gutter {
  position: relative;
  min-height: 0;
}

.workspace-split__editor,
.workspace-split__preview {
  display: flex;
  min-width: 0;
  min-height: 0;
}
</style>

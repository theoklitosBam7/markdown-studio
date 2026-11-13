<script setup lang="ts">
import { computed, shallowRef, useId, useTemplateRef, watch } from 'vue'

import type { ViewMode } from '@/types/editor'

import WorkspaceResizeDivider from './WorkspaceResizeDivider.vue'
import WorkspaceWidthControl from './WorkspaceWidthControl.vue'
import { useWorkspaceSidebarPreference } from '../composables/useWorkspaceLayoutPreferences'
import { useWorkspaceWidth } from '../composables/useWorkspaceWidth'
import { WORKSPACE_GUTTER_WIDTH, WORKSPACE_PANE_MIN_WIDTH } from '../utils/workspaceLayoutSizing'

const props = defineProps<{
  isMobile: boolean
  kind: 'folders' | 'outline'
  viewMode: ViewMode
  visible: boolean
}>()

defineSlots<{
  default(): unknown
  sidebar(): unknown
}>()

const rowElement = useTemplateRef<HTMLElement>('row')
const rowWidth = useWorkspaceWidth(rowElement)
const { commit, preferredValue, storageError } = useWorkspaceSidebarPreference()
const draftWidth = shallowRef<null | number>(null)
const pointerStartWidth = shallowRef<null | number>(null)
const sidebarId = useId()
const label = computed(() => (props.kind === 'outline' ? 'Outline' : 'Document Folders'))
const reservation = computed(() =>
  props.viewMode === 'split'
    ? WORKSPACE_PANE_MIN_WIDTH * 2 + WORKSPACE_GUTTER_WIDTH
    : WORKSPACE_PANE_MIN_WIDTH,
)
const maximumWidth = computed(() =>
  Math.min(480, rowWidth.value - WORKSPACE_GUTTER_WIDTH - reservation.value),
)
const canResize = computed(() => !props.isMobile && rowWidth.value > 0 && maximumWidth.value > 200)
const effectiveMaximum = computed(() => (canResize.value ? maximumWidth.value : 200))
const displayedWidth = computed(() => {
  const selectedWidth = draftWidth.value ?? preferredValue.value
  if (props.isMobile) return 248
  if (rowWidth.value <= 0) return Math.min(480, Math.max(200, selectedWidth))
  if (!canResize.value) return 200
  return Math.min(effectiveMaximum.value, Math.max(200, selectedWidth))
})
const mobileSidebarWidth = computed(() => {
  if (!props.isMobile) return null
  return props.kind === 'outline' && rowWidth.value <= 700 ? '100%' : '248px'
})
const isDesktopSidebar = computed(() => props.visible && !props.isMobile)
const isMobileSidebar = computed(() => props.visible && props.isMobile)
const valueText = computed(() => `${label.value} width ${Math.round(displayedWidth.value)} pixels`)
const isDisabled = computed(() => !props.visible || !canResize.value)

function cancelResize(): void {
  pointerStartWidth.value = null
  draftWidth.value = null
}

function commitResize(): void {
  if (pointerStartWidth.value === null) return
  const startWidth = pointerStartWidth.value
  const adjustedWidth = draftWidth.value
  pointerStartWidth.value = null
  draftWidth.value = null
  if (adjustedWidth !== null && adjustedWidth !== startWidth) commit(adjustedWidth)
}

function moveResize(displacement: number): void {
  if (pointerStartWidth.value === null) return
  draftWidth.value = Math.min(
    effectiveMaximum.value,
    Math.max(200, pointerStartWidth.value + displacement),
  )
}

function resetWidth(): void {
  cancelResize()
  commit(248)
}

function setMaximum(): void {
  cancelResize()
  commit(effectiveMaximum.value)
}

function setMinimum(): void {
  cancelResize()
  commit(200)
}

function setWidth(value: number): void {
  if (!Number.isFinite(value)) return
  cancelResize()
  commit(Math.min(effectiveMaximum.value, Math.max(200, value)))
}

function startResize(): void {
  pointerStartWidth.value = displayedWidth.value
  draftWidth.value = null
}

watch(() => [props.visible, props.isMobile, props.viewMode, props.kind] as const, cancelResize, {
  flush: 'sync',
})
</script>

<template>
  <div
    ref="row"
    class="workspace-sidebar-layout"
    :class="{ 'workspace-sidebar-layout--mobile-narrow': visible && isMobile && rowWidth <= 700 }"
  >
    <Transition name="workspace-sidebar">
      <div
        v-if="isDesktopSidebar"
        class="workspace-sidebar__area"
        :style="{ width: `${displayedWidth + WORKSPACE_GUTTER_WIDTH}px` }"
      >
        <aside
          :id="sidebarId"
          class="workspace-sidebar__region"
          :style="{ width: `${displayedWidth}px` }"
          :aria-label="label"
        >
          <slot v-if="visible" name="sidebar" />
        </aside>
        <div class="workspace-sidebar__gutter-wrap">
          <WorkspaceResizeDivider
            :key="`${kind}-${viewMode}`"
            :controls="sidebarId"
            :label="`${label} width`"
            :value="Math.round(displayedWidth)"
            :min="200"
            :max="Math.round(effectiveMaximum)"
            :value-text="valueText"
            :disabled="isDisabled"
            :instructions="'Use Left and Right Arrow to adjust by 10 pixels, or Shift for 50 pixels. Home and End select the limits.'"
            @start="startResize"
            @move="moveResize"
            @commit="commitResize"
            @cancel="cancelResize"
            @step="(direction, large) => setWidth(displayedWidth + direction * (large ? 50 : 10))"
            @minimum="setMinimum"
            @maximum="setMaximum"
            @reset="resetWidth"
          />
          <WorkspaceWidthControl
            v-if="visible"
            label="Sidebar width"
            field-label="Width"
            input-label="Sidebar width in pixels"
            unit="px"
            :value="Math.round(displayedWidth)"
            :min="200"
            :max="Math.round(effectiveMaximum)"
            :step="10"
            :disabled="isDisabled"
            reset-label="Reset sidebar width"
            :notice="storageError"
            @apply="setWidth"
            @reset="resetWidth"
          />
        </div>
      </div>
    </Transition>
    <div
      v-if="isMobileSidebar"
      :id="sidebarId"
      class="workspace-sidebar__region workspace-sidebar__region--mobile"
      :class="{ 'workspace-sidebar__region--outline': kind === 'outline' && rowWidth <= 700 }"
      :style="{ width: mobileSidebarWidth ?? '248px' }"
      :aria-label="label"
    >
      <slot name="sidebar" />
    </div>
    <div class="workspace-sidebar__content">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.workspace-sidebar-layout {
  display: flex;
  flex: 1;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
}

.workspace-sidebar__area {
  position: relative;
  z-index: 2;
  display: flex;
  flex: 0 0 auto;
  min-width: 0;
  min-height: 0;
  overflow: visible;
}

.workspace-sidebar__region {
  display: flex;
  flex: 0 0 auto;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
}

.workspace-sidebar__gutter-wrap {
  position: relative;
  display: flex;
  flex: 0 0 24px;
  width: 24px;
  min-height: 0;
}

.workspace-sidebar__content {
  isolation: isolate;
  display: flex;
  flex: 1 1 auto;
  min-width: 0;
  min-height: 0;
}

.workspace-sidebar-layout--mobile-narrow {
  flex-direction: column;
}

.workspace-sidebar__region--mobile {
  flex: 0 0 auto;
  max-width: 100%;
}

.workspace-sidebar__region--outline {
  flex-basis: 100%;
}

.workspace-sidebar__area .workspace-sidebar__region :deep(.outline-sidebar),
.workspace-sidebar__area .workspace-sidebar__region :deep(.folder-sidebar) {
  width: 100%;
  height: 100%;
  flex: 1 1 auto;
  border-right: 0;
}

.workspace-sidebar-layout--mobile-narrow .workspace-sidebar__content {
  display: none;
}

.workspace-sidebar-enter-active,
.workspace-sidebar-leave-active {
  overflow: hidden;
  transition:
    width 180ms ease,
    max-width 180ms ease;
}

.workspace-sidebar-enter-from,
.workspace-sidebar-leave-to {
  width: 0 !important;
  max-width: 0;
}
</style>

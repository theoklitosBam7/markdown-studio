<script setup lang="ts">
import { computed } from 'vue'

import type { FindMatch } from '../composables/useFindReplace'

interface MatchSegment {
  active: boolean
  highlighted: boolean
  text: string
}

interface Props {
  activeMatchIndex: number
  content: string
  matches: FindMatch[]
  scrollbarWidth?: number
  scrollTop?: number
}

const props = withDefaults(defineProps<Props>(), {
  scrollbarWidth: 0,
  scrollTop: 0,
})

const segments = computed<MatchSegment[]>(() => {
  if (props.matches.length === 0) {
    return []
  }

  const nextSegments: MatchSegment[] = []
  let cursor = 0

  for (const [index, match] of props.matches.entries()) {
    if (cursor < match.index) {
      nextSegments.push({
        active: false,
        highlighted: false,
        text: props.content.slice(cursor, match.index),
      })
    }

    nextSegments.push({
      active: index === props.activeMatchIndex,
      highlighted: true,
      text: props.content.slice(match.index, match.end),
    })
    cursor = match.end
  }

  if (cursor < props.content.length) {
    nextSegments.push({
      active: false,
      highlighted: false,
      text: props.content.slice(cursor),
    })
  }

  return nextSegments
})
</script>

<template>
  <div class="match-overlay" :style="{ right: `${scrollbarWidth}px` }" aria-hidden="true">
    <div class="match-overlay__content" :style="{ transform: `translateY(${-scrollTop}px)` }">
      <template v-for="(segment, index) in segments" :key="index">
        <mark
          v-if="segment.highlighted"
          :class="['match-overlay__mark', { 'match-overlay__mark--active': segment.active }]"
        >
          {{ segment.text }}
        </mark>
        <span v-else class="match-overlay__text">{{ segment.text }}</span>
      </template>
    </div>
  </div>
</template>

<style scoped>
.match-overlay {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}

.match-overlay__content {
  min-height: 100%;
  padding: 24px;
  font-family: 'DM Mono', monospace;
  font-size: 13.5px;
  line-height: 1.7;
  overflow-wrap: break-word;
  white-space: pre-wrap;
  color: transparent;
  tab-size: 2;
}

.match-overlay__text {
  color: transparent;
}

.match-overlay__mark {
  color: transparent;
  background: var(--find-match-bg);
  border-radius: 4px;
}

.match-overlay__mark--active {
  background: var(--find-match-active-bg);
}

@media (max-width: 700px) {
  .match-overlay__content {
    padding: 16px var(--app-gutter) 24px;
    font-size: 13px;
    line-height: 1.6;
  }
}
</style>

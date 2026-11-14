<script setup lang="ts">
import { computed, useTemplateRef } from 'vue'

import type { FindMatch } from '../types'

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
  scrollLeft?: number
  scrollTop?: number
}

const props = withDefaults(defineProps<Props>(), {
  scrollbarWidth: 0,
  scrollLeft: 0,
  scrollTop: 0,
})

const contentElement = useTemplateRef<HTMLElement>('content')
defineExpose({ contentElement })

const lines = computed(() => {
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

  const sourceLines: MatchSegment[][] = [[]]
  for (const segment of nextSegments) {
    for (const [index, text] of segment.text.split('\n').entries()) {
      if (index > 0) sourceLines.push([])
      sourceLines[sourceLines.length - 1]?.push({ ...segment, text })
    }
  }
  return sourceLines
})
</script>

<template>
  <div class="match-overlay" :style="{ right: `${scrollbarWidth}px` }" aria-hidden="true">
    <div
      ref="content"
      class="match-overlay__content"
      :style="{ transform: `translate(${-scrollLeft}px, ${-scrollTop}px)` }"
    >
      <span v-for="(segments, lineIndex) in lines" :key="lineIndex" class="match-overlay__line">
        <template v-for="(segment, index) in segments" :key="index">
          <mark
            v-if="segment.highlighted"
            :class="['match-overlay__mark', { 'match-overlay__mark--active': segment.active }]"
            >{{ segment.text }}</mark
          >
          <span v-else class="match-overlay__text">{{ segment.text }}</span>
        </template>
      </span>
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
  color: transparent;
}

.match-overlay__line {
  display: block;
  min-height: var(--editor-line-height);
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
</style>

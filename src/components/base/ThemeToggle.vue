<script setup lang="ts">
import { computed, useTemplateRef } from 'vue'

import type { Theme } from '@/features/markdown/types'

interface Props {
  compact?: boolean
  theme: Theme
}

const props = withDefaults(defineProps<Props>(), {
  compact: false,
})

const emit = defineEmits<{
  toggle: [payload: { origin: { x: number; y: number }; theme: Theme }]
}>()

const buttonRef = useTemplateRef<HTMLButtonElement>('button')
const nextTheme = computed<Theme>(() => (props.theme === 'light' ? 'dark' : 'light'))

const isDark = computed(() => props.theme === 'dark')

function toggle(): void {
  const button = buttonRef.value
  const rect = button?.getBoundingClientRect()

  emit('toggle', {
    origin: {
      x: rect ? rect.left + rect.width / 2 : window.innerWidth - 56,
      y: rect ? rect.top + rect.height / 2 : 56,
    },
    theme: nextTheme.value,
  })
}
</script>

<template>
  <button
    ref="button"
    :class="['theme-toggle', { 'is-dark': isDark, compact: props.compact }]"
    type="button"
    :title="`Switch to ${nextTheme} mode`"
    :aria-label="`Switch to ${nextTheme} mode`"
    @click="toggle"
  >
    <span class="theme-toggle__halo"></span>
    <span class="theme-toggle__icon theme-toggle__icon--sun" aria-hidden="true">☀</span>
    <span class="theme-toggle__icon theme-toggle__icon--moon" aria-hidden="true">☾</span>
  </button>
</template>

<style scoped>
.theme-toggle {
  position: relative;
  width: 38px;
  height: 38px;
  border-radius: 999px;
  border: 1px solid var(--border);
  background:
    radial-gradient(
      circle at 30% 30%,
      color-mix(in srgb, var(--accent) 22%, transparent),
      transparent 55%
    ),
    color-mix(in srgb, var(--surface) 84%, var(--panel));
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  transition:
    border-color 0.25s ease,
    box-shadow 0.35s ease,
    transform 0.35s ease,
    background-color 0.25s ease;
}

.theme-toggle.compact {
  width: 36px;
  height: 36px;
}

.theme-toggle:hover {
  transform: translateY(-1px) scale(1.03);
  box-shadow: 0 10px 24px color-mix(in srgb, var(--accent) 18%, transparent);
}

.theme-toggle:active {
  transform: scale(0.96);
}

.theme-toggle__halo {
  position: absolute;
  inset: 3px;
  border-radius: inherit;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.28), transparent 65%);
  opacity: 0.8;
}

.theme-toggle__icon {
  position: absolute;
  font-size: 14px;
  line-height: 1;
  transition:
    opacity 0.35s ease,
    transform 0.5s cubic-bezier(0.22, 1, 0.36, 1),
    filter 0.35s ease;
}

.theme-toggle__icon--sun {
  color: #d48a1f;
  opacity: 0;
  transform: translateY(10px) rotate(-45deg) scale(0.7);
}

.theme-toggle__icon--moon {
  color: var(--text);
  opacity: 1;
  transform: translateY(0) rotate(0deg) scale(1);
}

.theme-toggle.is-dark .theme-toggle__icon--sun {
  opacity: 1;
  transform: translateY(0) rotate(0deg) scale(1);
  filter: drop-shadow(0 0 12px rgba(255, 189, 80, 0.35));
}

.theme-toggle.is-dark .theme-toggle__icon--moon {
  opacity: 0;
  transform: translateY(-10px) rotate(30deg) scale(0.6);
}

@media (max-width: 700px) {
  .theme-toggle {
    width: 36px;
    height: 36px;
  }
}
</style>

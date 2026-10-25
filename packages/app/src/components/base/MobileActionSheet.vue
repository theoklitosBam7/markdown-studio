<script setup lang="ts">
import type { Component } from 'vue'

import { nextTick, onMounted, onUnmounted, ref, shallowRef, useTemplateRef, watch } from 'vue'

interface ActionGroup {
  items: ActionItem[]
  label: string
}

interface ActionItem {
  action: (element?: HTMLElement) => void
  description?: string
  disabled?: boolean
  icon?: 'github' | Component
  label: string
  variant?: 'danger' | 'default' | 'primary'
}

interface Props {
  groups: ActionGroup[]
  id?: string
  isOpen: boolean
  title?: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  close: []
}>()

const isVisible = shallowRef(false)
const isClosing = shallowRef(false)
const backdropRef = useTemplateRef<HTMLElement>('backdrop')
const sheetRef = useTemplateRef<HTMLElement>('sheet')
let closeFallbackTimer: ReturnType<typeof setTimeout> | undefined
let previouslyFocused: HTMLElement | null = null
let touchStartY = 0
let touchEndY = 0
let savedOverflow = ''

function clearCloseFallback(): void {
  if (closeFallbackTimer !== undefined) {
    clearTimeout(closeFallbackTimer)
    closeFallbackTimer = undefined
  }
}

function close(): void {
  isClosing.value = true
  clearCloseFallback()
  // Fallback in case animationend doesn't fire (e.g. prefers-reduced-motion)
  closeFallbackTimer = setTimeout(handleAnimationEnd, 300)

  backdropRef.value?.addEventListener('animationend', handleAnimationEnd, { once: true })
}

function getFocusableElements(): HTMLElement[] {
  const sheet = sheetRef.value
  if (!sheet) return []

  return Array.from(sheet.querySelectorAll<HTMLElement>('button:not([disabled])'))
}

function handleAction(item: ActionItem, element: HTMLElement): void {
  item.action(element)
  close()
}

function handleAnimationEnd(): void {
  clearCloseFallback()

  if (!isClosing.value) {
    return
  }

  isVisible.value = false
  isClosing.value = false
  unlockBodyScroll()
  restoreFocus()
  emit('close')
}

function handleBackdropClick(event: MouseEvent): void {
  if (event.target === event.currentTarget) {
    close()
  }
}

function handleItemClick(item: ActionItem, event: MouseEvent): void {
  if (item.disabled) {
    return
  }

  handleAction(item, event.currentTarget as HTMLElement)
}

function handleKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape' && props.isOpen) {
    close()
  }
}

function handleSheetKeydown(event: KeyboardEvent): void {
  if (event.key !== 'Tab') {
    return
  }

  const focusable = getFocusableElements()
  if (focusable.length === 0) {
    return
  }

  const first = focusable[0]
  const last = focusable[focusable.length - 1]
  const active = document.activeElement

  if (event.shiftKey) {
    if (active === first || active === sheetRef.value) {
      event.preventDefault()
      last?.focus()
    }
    return
  }

  if (active === last) {
    event.preventDefault()
    first?.focus()
  }
}

function handleTouchEnd(): void {
  const swipeDistance = touchEndY - touchStartY
  if (swipeDistance > 80) {
    close()
  }
}

function handleTouchMove(event: TouchEvent): void {
  if (event.touches[0]) {
    touchEndY = event.touches[0].clientY
  }
}

function handleTouchStart(event: TouchEvent): void {
  if (event.touches[0]) {
    touchStartY = event.touches[0].clientY
  }
}

function lockBodyScroll(): void {
  savedOverflow = document.body.style.overflow
  document.body.style.overflow = 'hidden'
}

function restoreFocus(): void {
  previouslyFocused?.focus()
  previouslyFocused = null
}

function unlockBodyScroll(): void {
  document.body.style.overflow = savedOverflow
}

watch(
  () => props.isOpen,
  (newValue) => {
    if (newValue) {
      const activeElement = document.activeElement
      previouslyFocused = activeElement instanceof HTMLElement ? activeElement : null
      isVisible.value = true
      isClosing.value = false
      lockBodyScroll()
      void nextTick(() => sheetRef.value?.focus())
    } else {
      isClosing.value = false
    }
  },
  { immediate: true },
)

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  clearCloseFallback()
  document.removeEventListener('keydown', handleKeydown)
  unlockBodyScroll()
  restoreFocus()
})
</script>

<template>
  <Teleport to="body">
    <Transition name="sheet">
      <div
        v-if="isVisible"
        ref="backdrop"
        class="mobile-action-sheet-backdrop"
        :class="{ closing: isClosing }"
        @click="handleBackdropClick"
      >
        <div
          :id="props.id"
          ref="sheet"
          class="mobile-action-sheet"
          role="dialog"
          aria-modal="true"
          aria-labelledby="mobile-action-sheet-title"
          tabindex="-1"
          @keydown="handleSheetKeydown"
          @touchstart="handleTouchStart"
          @touchmove="handleTouchMove"
          @touchend="handleTouchEnd"
        >
          <div class="mobile-action-sheet__handle" aria-hidden="true">
            <div class="mobile-action-sheet__handle-bar"></div>
          </div>

          <h2 v-if="title" id="mobile-action-sheet-title" class="mobile-action-sheet__title">
            {{ title }}
          </h2>

          <div class="mobile-action-sheet__scroll">
            <div
              v-for="group in props.groups"
              :key="group.label"
              class="mobile-action-sheet__group"
              role="group"
              :aria-labelledby="`sheet-group-${group.label}`"
            >
              <p :id="`sheet-group-${group.label}`" class="mobile-action-sheet__group-label">
                {{ group.label }}
              </p>
              <div class="mobile-action-sheet__actions">
                <button
                  v-for="item in group.items"
                  :key="item.label"
                  class="mobile-action-sheet__action"
                  :class="[
                    `mobile-action-sheet__action--${item.variant || 'default'}`,
                    { 'mobile-action-sheet__action--disabled': item.disabled },
                  ]"
                  :disabled="item.disabled"
                  type="button"
                  @click="handleItemClick(item, $event)"
                >
                  <span v-if="item.icon" class="mobile-action-sheet__icon" aria-hidden="true">
                    <svg
                      v-if="item.icon === 'github'"
                      viewBox="0 0 16 16"
                      class="mobile-action-sheet__github-icon"
                    >
                      <path
                        d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"
                      />
                    </svg>
                    <component
                      :is="item.icon"
                      v-else
                      :size="20"
                      :stroke-width="1.8"
                      aria-hidden="true"
                    />
                  </span>
                  <span class="mobile-action-sheet__content">
                    <span class="mobile-action-sheet__label">{{ item.label }}</span>
                    <span v-if="item.description" class="mobile-action-sheet__description">
                      {{ item.description }}
                    </span>
                  </span>
                </button>
              </div>
            </div>
          </div>

          <div class="mobile-action-sheet__footer">
            <button class="mobile-action-sheet__cancel" type="button" @click="close">Cancel</button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.mobile-action-sheet-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  z-index: 1000;
  opacity: 0;
  animation: fadeIn 0.25s ease forwards;
}

.mobile-action-sheet-backdrop.closing {
  animation: fadeOut 0.25s ease forwards;
}

.mobile-action-sheet {
  display: flex;
  width: 100%;
  max-width: 500px;
  max-height: min(80dvh, 720px);
  flex-direction: column;
  border-radius: 20px 20px 0 0;
  background: var(--surface);
  transform: translateY(100%);
  animation: slideUp 0.35s cubic-bezier(0.22, 1, 0.36, 1) forwards;
}

.mobile-action-sheet:focus {
  outline: none;
}

.mobile-action-sheet-backdrop.closing .mobile-action-sheet {
  animation: slideDown 0.25s ease forwards;
}

.mobile-action-sheet__handle {
  display: flex;
  flex-shrink: 0;
  justify-content: center;
  padding: 8px 0 12px;
}

.mobile-action-sheet__handle-bar {
  width: 36px;
  height: 4px;
  background: var(--border-dark);
  border-radius: 2px;
}

.mobile-action-sheet__title {
  flex-shrink: 0;
  font-family: 'DM Sans', sans-serif;
  font-size: 16px;
  font-weight: 600;
  color: var(--text);
  text-align: center;
  margin: 0 0 12px;
  padding: 0 16px;
}

.mobile-action-sheet__scroll {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
  padding: 0 max(16px, env(safe-area-inset-right)) 0 max(16px, env(safe-area-inset-left));
}

.mobile-action-sheet__group + .mobile-action-sheet__group {
  margin-top: 14px;
}

.mobile-action-sheet__group-label {
  margin: 0 4px 6px;
  color: var(--text-muted);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.mobile-action-sheet__actions {
  display: flex;
  flex-direction: column;
  gap: 1px;
  background: var(--border);
  border-radius: 12px;
  overflow: hidden;
}

.mobile-action-sheet__action {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px 16px;
  background: var(--surface);
  border: none;
  font-family: 'DM Sans', sans-serif;
  font-size: 16px;
  font-weight: 500;
  color: var(--text);
  cursor: pointer;
  min-height: 52px;
  transition: background 0.15s ease;
}

.mobile-action-sheet__action:hover {
  background: var(--panel);
}

.mobile-action-sheet__action:focus-visible {
  outline: 2px solid var(--focus-ring);
  outline-offset: -2px;
}

.mobile-action-sheet__action:disabled {
  cursor: not-allowed;
}

.mobile-action-sheet__action--disabled {
  color: color-mix(in srgb, var(--text) 55%, transparent);
}

.mobile-action-sheet__action--disabled:hover {
  background: var(--surface);
}

.mobile-action-sheet__action--danger {
  color: var(--error, #dc2626);
}

.mobile-action-sheet__action--primary {
  color: var(--accent);
  font-weight: 600;
}

.mobile-action-sheet__icon {
  display: grid;
  width: 24px;
  place-items: center;
  flex-shrink: 0;
}

.mobile-action-sheet__icon :deep(svg) {
  width: 20px;
  height: 20px;
}

.mobile-action-sheet__github-icon {
  fill: currentColor;
}

.mobile-action-sheet__content {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 4px;
}

.mobile-action-sheet__label {
  flex: 1;
  text-align: left;
}

.mobile-action-sheet__description {
  font-size: 13px;
  font-weight: 400;
  line-height: 1.35;
  color: color-mix(in srgb, var(--text) 72%, transparent);
  text-align: left;
}

.mobile-action-sheet__footer {
  flex-shrink: 0;
  padding: 12px max(16px, env(safe-area-inset-right)) max(16px, env(safe-area-inset-bottom))
    max(16px, env(safe-area-inset-left));
}

.mobile-action-sheet__cancel {
  display: block;
  width: 100%;
  padding: 14px 16px;
  background: var(--panel);
  border: none;
  border-radius: 12px;
  font-family: 'DM Sans', sans-serif;
  font-size: 16px;
  font-weight: 600;
  color: var(--accent);
  cursor: pointer;
  min-height: 52px;
  transition: background 0.15s ease;
}

.mobile-action-sheet__cancel:hover {
  background: var(--surface);
}

.mobile-action-sheet__cancel:focus-visible {
  outline: 2px solid var(--focus-ring);
  outline-offset: 2px;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes fadeOut {
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
}

@keyframes slideUp {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}

@keyframes slideDown {
  from {
    transform: translateY(0);
  }
  to {
    transform: translateY(100%);
  }
}

@media (prefers-reduced-motion: reduce) {
  .mobile-action-sheet-backdrop,
  .mobile-action-sheet {
    animation-duration: 0.01ms;
  }
}

/* Short viewports (landscape phones) need the width and height for the action list. */
@media (max-height: 500px) {
  .mobile-action-sheet {
    max-width: 100%;
    max-height: calc(100dvh - 12px);
    border-radius: 16px 16px 0 0;
  }
}
</style>

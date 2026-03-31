<script setup lang="ts">
import { onMounted, onUnmounted, ref, shallowRef, watch } from 'vue'

interface ActionItem {
  action: () => void
  description?: string
  disabled?: boolean
  icon?: string
  label: string
  variant?: 'danger' | 'default' | 'primary'
}

interface Props {
  actions: ActionItem[]
  isOpen: boolean
  title?: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  close: []
}>()

const isVisible = shallowRef(false)
const isClosing = shallowRef(false)
const backdropRef = ref<HTMLElement | null>(null)
let touchStartY = 0
let touchEndY = 0
let savedOverflow = ''

function close(): void {
  isClosing.value = true
  // Fallback in case animationend doesn't fire (e.g. prefers-reduced-motion)
  const fallbackTimer = setTimeout(handleAnimationEnd, 300)
  const backdrop = backdropRef.value
  if (backdrop) {
    backdrop.addEventListener(
      'animationend',
      () => {
        clearTimeout(fallbackTimer)
        handleAnimationEnd()
      },
      { once: true },
    )
  }
}

function handleAction(action: () => void): void {
  action()
  close()
}

function handleAnimationEnd(): void {
  if (isClosing.value) {
    isVisible.value = false
    isClosing.value = false
    unlockBodyScroll()
    emit('close')
  }
}

function handleBackdropClick(event: MouseEvent): void {
  if (event.target === event.currentTarget) {
    close()
  }
}

function handleItemClick(item: ActionItem): void {
  if (item.disabled) {
    return
  }

  handleAction(item.action)
}

function handleKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape' && props.isOpen) {
    close()
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

function unlockBodyScroll(): void {
  document.body.style.overflow = savedOverflow
}

watch(
  () => props.isOpen,
  (newValue) => {
    if (newValue) {
      isVisible.value = true
      isClosing.value = false
      lockBodyScroll()
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
  document.removeEventListener('keydown', handleKeydown)
  unlockBodyScroll()
})
</script>

<template>
  <Teleport to="body">
    <Transition name="sheet">
      <div
        v-if="isVisible"
        ref="backdropRef"
        class="mobile-action-sheet-backdrop"
        :class="{ closing: isClosing }"
        @click="handleBackdropClick"
      >
        <div
          class="mobile-action-sheet"
          role="dialog"
          aria-modal="true"
          aria-labelledby="sheet-title"
          @touchstart="handleTouchStart"
          @touchmove="handleTouchMove"
          @touchend="handleTouchEnd"
        >
          <div class="mobile-action-sheet__handle" aria-hidden="true">
            <div class="mobile-action-sheet__handle-bar"></div>
          </div>

          <h2 v-if="title" id="sheet-title" class="mobile-action-sheet__title">
            {{ title }}
          </h2>

          <div class="mobile-action-sheet__actions" role="menu">
            <button
              v-for="(item, index) in actions"
              :key="index"
              class="mobile-action-sheet__action"
              :class="[
                `mobile-action-sheet__action--${item.variant || 'default'}`,
                { 'mobile-action-sheet__action--disabled': item.disabled },
              ]"
              :disabled="item.disabled"
              role="menuitem"
              type="button"
              @click="handleItemClick(item)"
            >
              <span v-if="item.icon" class="mobile-action-sheet__icon" aria-hidden="true">
                {{ item.icon }}
              </span>
              <span class="mobile-action-sheet__content">
                <span class="mobile-action-sheet__label">{{ item.label }}</span>
                <span v-if="item.description" class="mobile-action-sheet__description">
                  {{ item.description }}
                </span>
              </span>
            </button>
          </div>

          <button class="mobile-action-sheet__cancel" type="button" @click="close">Cancel</button>
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
  width: 100%;
  max-width: 500px;
  background: var(--surface);
  border-radius: 20px 20px 0 0;
  padding: 8px 0 24px;
  transform: translateY(100%);
  animation: slideUp 0.35s cubic-bezier(0.22, 1, 0.36, 1) forwards;
  max-height: 80vh;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.mobile-action-sheet-backdrop.closing .mobile-action-sheet {
  animation: slideDown 0.25s ease forwards;
}

.mobile-action-sheet__handle {
  display: flex;
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
  font-family: 'DM Sans', sans-serif;
  font-size: 16px;
  font-weight: 600;
  color: var(--text);
  text-align: center;
  margin: 0 0 16px;
  padding: 0 16px;
}

.mobile-action-sheet__actions {
  display: flex;
  flex-direction: column;
  gap: 1px;
  background: var(--border);
  margin: 0 16px;
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
  font-size: 20px;
  width: 24px;
  text-align: center;
  flex-shrink: 0;
  padding-top: 1px;
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

.mobile-action-sheet__cancel {
  display: block;
  width: calc(100% - 32px);
  margin: 12px 16px 0;
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
</style>

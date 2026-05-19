<script setup lang="ts">
import { onUnmounted, shallowRef } from 'vue'

import { coerce } from '@/utils/semver'

interface Props {
  currentVersion?: string
  homebrewUpgradeCommand?: string
  isHomebrewInstall?: boolean
  latestVersion?: string
  status: 'up-to-date' | 'update-available'
}

const props = defineProps<Props>()

const emit = defineEmits<{
  dismiss: []
  download: []
}>()

const normalizeVersion = (v?: string) => (v ? coerce(v) : undefined)

const isCopied = shallowRef(false)
const COPY_FEEDBACK_MS = 2000
let copyFeedbackTimeoutId: ReturnType<typeof setTimeout> | undefined

function clearCopyFeedbackTimer(): void {
  if (copyFeedbackTimeoutId !== undefined) {
    clearTimeout(copyFeedbackTimeoutId)
    copyFeedbackTimeoutId = undefined
  }
}

async function copyBrewCommand(): Promise<void> {
  try {
    await navigator.clipboard.writeText(props.homebrewUpgradeCommand ?? '')
    isCopied.value = true
    clearCopyFeedbackTimer()
    copyFeedbackTimeoutId = setTimeout(() => {
      isCopied.value = false
    }, COPY_FEEDBACK_MS)
  } catch {
    // Clipboard may be unavailable in some contexts
  }
}

onUnmounted(() => {
  clearCopyFeedbackTimer()
})
</script>

<template>
  <div class="update-banner" role="status">
    <div class="update-banner__content">
      <!-- Update available icon -->
      <svg
        v-if="status === 'update-available'"
        class="update-banner__icon"
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        stroke-width="1.5"
        aria-hidden="true"
      >
        <circle cx="8" cy="8" r="6.5" />
        <path d="M8 5v6M5.5 8.5L8 11l2.5-2.5" />
      </svg>

      <!-- Up to date icon -->
      <svg
        v-else
        class="update-banner__icon"
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        stroke-width="1.5"
        aria-hidden="true"
      >
        <circle cx="8" cy="8" r="6.5" />
        <path d="M5.5 8l2 2 3.5-3.5" />
      </svg>

      <span class="update-banner__text">
        {{ status === 'update-available' ? 'Update available' : "You're up to date" }}
      </span>

      <span
        v-if="status === 'update-available' && currentVersion && latestVersion"
        class="update-banner__versions"
      >
        v{{ normalizeVersion(currentVersion) }} &rarr; v{{ normalizeVersion(latestVersion) }}
      </span>

      <!-- Homebrew install: show copyable upgrade command -->
      <template v-if="status === 'update-available' && isHomebrewInstall">
        <code class="update-banner__command">{{ homebrewUpgradeCommand }}</code>
        <button
          class="update-banner__copy-btn"
          :class="{ 'update-banner__copy-btn--copied': isCopied }"
          type="button"
          @click="copyBrewCommand"
        >
          {{ isCopied ? 'Copied!' : 'Copy' }}
        </button>
      </template>

      <!-- Direct download install: show download button -->
      <button
        v-if="status === 'update-available' && !isHomebrewInstall"
        class="update-banner__download-btn"
        type="button"
        @click="emit('download')"
      >
        Download
      </button>
    </div>

    <button
      v-if="status === 'update-available'"
      class="update-banner__close-btn"
      type="button"
      aria-label="Dismiss update notification"
      @click="emit('dismiss')"
    >
      <svg
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        stroke-width="1.5"
        aria-hidden="true"
      >
        <path d="M4 4l8 8M12 4l-8 8" />
      </svg>
    </button>
  </div>
</template>

<style scoped>
.update-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px var(--app-gutter);
  background: var(--accent-light);
  border-bottom: 1px solid var(--accent-mid);
  flex-shrink: 0;
}

.update-banner__content {
  display: flex;
  align-items: center;
  gap: 8px;
}

.update-banner__icon {
  width: 15px;
  height: 15px;
  color: var(--accent);
  flex-shrink: 0;
}

.update-banner__text {
  font-size: 12px;
  font-weight: 500;
  color: var(--accent);
}

.update-banner__versions {
  font-size: 11px;
  color: var(--text-muted);
}

.update-banner__command {
  font-family: 'SF Mono', 'Fira Code', 'Cascadia Code', monospace;
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 4px;
  background: var(--accent-bg);
  color: var(--accent);
  white-space: nowrap;
}

.update-banner__copy-btn {
  height: 26px;
  padding: 0 12px;
  border-radius: 5px;
  border: 1px solid var(--accent);
  background: var(--accent);
  color: #fff;
  font-size: 11px;
  font-weight: 500;
  cursor: pointer;
  transition: opacity 0.15s;
}

.update-banner__copy-btn:hover {
  opacity: 0.85;
}

.update-banner__copy-btn:focus-visible {
  outline: 2px solid #fff;
  outline-offset: 2px;
}

.update-banner__copy-btn--copied {
  background: var(--accent-bg);
  color: var(--accent);
  border-color: var(--accent);
}

.update-banner__download-btn {
  height: 26px;
  padding: 0 12px;
  border-radius: 5px;
  border: 1px solid var(--accent);
  background: var(--accent);
  color: #fff;
  font-size: 11px;
  font-weight: 500;
  cursor: pointer;
  transition: opacity 0.15s;
}

.update-banner__download-btn:hover {
  opacity: 0.85;
}

.update-banner__download-btn:focus-visible {
  outline: 2px solid #fff;
  outline-offset: 2px;
}

.update-banner__close-btn {
  width: 28px;
  height: 28px;
  padding: 0;
  border: none;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.update-banner__close-btn:hover {
  color: var(--text);
  background: var(--panel);
}

.update-banner__close-btn:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

.update-banner__close-btn svg {
  width: 12px;
  height: 12px;
}
</style>

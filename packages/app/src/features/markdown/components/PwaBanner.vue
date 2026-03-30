<script setup lang="ts">
interface Props {
  status: 'offline-ready' | 'update-available'
}

defineProps<Props>()

const emit = defineEmits<{
  dismiss: []
  refresh: []
}>()
</script>

<template>
  <div class="pwa-banner" role="status">
    <div class="pwa-banner__content">
      <svg
        class="pwa-banner__icon"
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        stroke-width="1.5"
        aria-hidden="true"
      >
        <path v-if="status === 'update-available'" d="M8 2.5v6M5.5 6 8 8.5 10.5 6M3 11.5h10" />
        <path v-else d="M3.5 8 6.5 11l6-6.5" />
      </svg>

      <span class="pwa-banner__text">
        {{
          status === 'update-available'
            ? 'A new web version is ready.'
            : 'Markdown Studio is ready to work offline.'
        }}
      </span>

      <button
        v-if="status === 'update-available'"
        class="pwa-banner__action"
        type="button"
        @click="emit('refresh')"
      >
        Refresh
      </button>
    </div>

    <button
      class="pwa-banner__close"
      type="button"
      :aria-label="
        status === 'update-available'
          ? 'Dismiss web app update notification'
          : 'Dismiss offline ready notification'
      "
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
.pwa-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px var(--app-gutter);
  background: var(--accent-light);
  border-bottom: 1px solid var(--accent-mid);
  flex-shrink: 0;
}

.pwa-banner__content {
  display: flex;
  align-items: center;
  gap: 8px;
}

.pwa-banner__icon {
  width: 15px;
  height: 15px;
  color: var(--accent);
  flex-shrink: 0;
}

.pwa-banner__text {
  font-size: 12px;
  font-weight: 500;
  color: var(--accent);
}

.pwa-banner__action {
  height: 26px;
  padding: 0 12px;
  border-radius: 5px;
  border: 1px solid var(--accent);
  background: var(--accent);
  color: #fff;
  font-size: 11px;
  font-weight: 500;
  cursor: pointer;
}

.pwa-banner__action:hover {
  opacity: 0.85;
}

.pwa-banner__action:focus-visible,
.pwa-banner__close:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

.pwa-banner__close {
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

.pwa-banner__close:hover {
  color: var(--text);
  background: var(--panel);
}

.pwa-banner__close svg {
  width: 12px;
  height: 12px;
}
</style>

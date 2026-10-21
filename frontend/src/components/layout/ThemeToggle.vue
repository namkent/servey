<template>
  <button
    class="theme-toggle"
    @click="themeStore.toggle()"
    :title="themeStore.isDark ? 'Chuyển sang sáng' : 'Chuyển sang tối'"
    :aria-label="themeStore.isDark ? 'Light mode' : 'Dark mode'"
  >
    <Transition name="icon-swap" mode="out-in">
      <SunIcon v-if="themeStore.isDark" :size="16" key="sun" />
      <MoonIcon v-else :size="16" key="moon" />
    </Transition>
  </button>
</template>

<script setup>
import { SunIcon, MoonIcon } from 'lucide-vue-next'
import { useThemeStore } from '@/stores/theme.js'

const themeStore = useThemeStore()
</script>

<style scoped>
.theme-toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  border: none;
  background: transparent;
  border-radius: var(--radius-md);
  cursor: pointer;
  color: var(--color-text-muted);
  font-size: 0.875rem;
  font-weight: 500;
  font-family: inherit;
  transition: background-color 150ms ease-out, color 150ms ease-out;
  flex-shrink: 0;
}

@media (hover: hover) {
  .theme-toggle:hover {
    background: var(--color-surface-2);
    color: var(--color-text);
  }
}

.theme-toggle:not(:disabled):active {
  scale: 0.96;
  transition: scale 150ms ease-out;
}

.theme-toggle__label {
  white-space: nowrap;
}

/* Icon cross-fade (Jakub Krehel icon-transitions.md) */
.icon-swap-enter-active {
  transition: opacity 150ms ease-out, transform 150ms ease-out, filter 150ms ease-out;
}
.icon-swap-leave-active {
  transition: opacity 100ms ease-out, transform 100ms ease-out;
}
.icon-swap-enter-from {
  opacity: 0;
  transform: scale(0.5);
  filter: blur(2px);
}
.icon-swap-leave-to {
  opacity: 0;
  transform: scale(0.5);
}

@media (prefers-reduced-motion: reduce) {
  .icon-swap-enter-active, .icon-swap-leave-active { transition: opacity 150ms; }
  .icon-swap-enter-from, .icon-swap-leave-to { transform: none; filter: none; }
}
</style>

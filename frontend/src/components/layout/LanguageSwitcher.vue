<template>
  <button
    class="lang-switch-btn"
    @click="toggleLanguage"
    :title="t('topbar.language') + ': ' + (currentLocale === 'vi' ? 'Tiếng Việt' : 'English')"
    aria-label="Toggle language"
  >
    <span class="lang-code">{{ currentLocale === 'vi' ? 'VI' : 'EN' }}</span>
  </button>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { setAppLocale } from '@/i18n/index.js'

const { locale, t } = useI18n()
const currentLocale = computed(() => locale.value)

function toggleLanguage() {
  const next = locale.value === 'vi' ? 'en' : 'vi'
  setAppLocale(next)
}
</script>

<style scoped>
.lang-switch-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  background: transparent;
  border: none;
  border-radius: var(--radius-md);
  color: var(--color-text-muted);
  font-size: 0.75rem;
  font-weight: 700;
  cursor: pointer;
  letter-spacing: 0.04em;
  transition: background-color 150ms ease-out, color 150ms ease-out;
  flex-shrink: 0;
}

@media (hover: hover) {
  .lang-switch-btn:hover {
    background: var(--color-surface-2);
    color: var(--color-text);
  }
}

.lang-switch-btn:active {
  transform: scale(0.96);
}

.lang-code {
  font-family: inherit;
  line-height: 1;
}
</style>

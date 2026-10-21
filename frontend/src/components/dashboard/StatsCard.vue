<template>
  <div class="stats-card" :class="`stats-card--${color}`">
    <div class="stats-card__icon">
      <component :is="icon" :size="20" />
    </div>
    <div class="stats-card__content">
      <div v-if="loading" class="sk-value" />
      <p v-else class="stats-card__value tabular-nums">{{ typeof value === 'number' ? value.toLocaleString('vi-VN') : value }}</p>
      <p class="stats-card__label">{{ label }}</p>
    </div>
  </div>
</template>

<script setup>
defineProps({
  value: [Number, String],
  label: String,
  icon: [Object, Function],
  color: { type: String, default: 'blue' },
  loading: { type: Boolean, default: false },
})
</script>

<style scoped>
.stats-card {
  display: flex;
  align-items: center;
  gap: 14px;
  background: var(--color-surface);
  border: 1px solid transparent;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-border);
  padding: 18px 20px;
}

.stats-card__icon {
  width: 44px; height: 44px;
  border-radius: var(--radius-md);
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}

.stats-card--blue .stats-card__icon   { background: oklch(0.55 0.18 264 / 0.12); color: var(--color-primary); }
.stats-card--green .stats-card__icon  { background: var(--color-success-bg);       color: var(--color-success); }
.stats-card--purple .stats-card__icon { background: oklch(0.55 0.18 300 / 0.12);  color: oklch(0.55 0.18 300); }
.stats-card--orange .stats-card__icon { background: var(--color-warning-bg);       color: var(--color-warning); }

.stats-card__value {
  font-size: 1.625rem;
  font-weight: 750;
  letter-spacing: -0.03em;
  color: var(--color-text);
  line-height: 1;
}

.stats-card__label {
  font-size: 0.8125rem;
  color: var(--color-text-muted);
  margin-top: 3px;
  white-space: nowrap;
}

.sk-value {
  height: 28px; width: 60px;
  background: var(--color-surface-2);
  border-radius: var(--radius-sm);
  animation: shimmer 1.5s ease-in-out infinite;
  margin-bottom: 4px;
}

@keyframes shimmer {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}
</style>

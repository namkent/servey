<template>
  <span class="status-badge" :class="badgeClass">
    <span class="badge-dot" />
    {{ label }}
  </span>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps({
  status: {
    type: String,
    default: 'pending',
    // 'pending' | 'in_progress' | 'completed' | 'expired' | 'active' | 'inactive'
  },
})

const { t, te } = useI18n()

const CONFIG = {
  pending:     { label: 'Chưa làm',   class: 'badge--pending' },
  in_progress: { label: 'Đang làm',   class: 'badge--progress' },
  completed:   { label: 'Hoàn thành', class: 'badge--completed' },
  expired:     { label: 'Hết hạn',    class: 'badge--expired' },
  active:      { label: 'Đang mở',    class: 'badge--active' },
  inactive:    { label: 'Đã đóng',    class: 'badge--inactive' },
}

const label = computed(() => {
  const key = `statusBadge.${props.status}`
  return te(key) ? t(key) : (CONFIG[props.status]?.label || props.status)
})
const badgeClass = computed(() => CONFIG[props.status]?.class || 'badge--pending')
</script>

<style scoped>
.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 8px;
  border-radius: 99px;
  font-size: 0.6875rem;
  font-weight: 600;
  white-space: nowrap;
  flex-shrink: 0;
}

.badge-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: currentColor;
}

.badge--pending   { background: var(--color-surface-2);   color: var(--color-text-muted); }
.badge--progress  { background: var(--color-warning-bg);  color: var(--color-warning); }
.badge--completed { background: var(--color-success-bg);  color: var(--color-success); }
.badge--expired   { background: var(--color-danger-bg);   color: var(--color-danger); }
.badge--active    { background: var(--color-success-bg);  color: var(--color-success); }
.badge--inactive  { background: var(--color-surface-2);   color: var(--color-text-muted); }
</style>

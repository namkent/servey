<template>
  <RouterLink :to="`/survey/s/${survey.id}`" class="survey-card">
    <!-- Status indicator -->
    <div class="survey-card__status-bar" :class="statusClass" />

    <div class="survey-card__body">
      <div class="survey-card__header">
        <h4 class="survey-card__title">{{ survey.title }}</h4>
        <StatusBadge :status="completionStatus" />
      </div>

      <p v-if="survey.description" class="survey-card__desc">{{ truncate(survey.description, 100) }}</p>

      <div class="survey-card__meta">
        <span class="meta-item">
          <UsersIcon :size="13" />
          {{ survey.response_count ?? 0 }} phản hồi
        </span>
        <span v-if="survey.expires_at" class="meta-item" :class="{ 'meta-item--warn': isExpiringSoon }">
          <CalendarIcon :size="13" />
          {{ isExpiringSoon ? 'Hết hạn sớm' : formatDate(survey.expires_at) }}
        </span>
      </div>
    </div>

    <div class="survey-card__footer">
      <span class="survey-card__action">
        {{ completionStatus === 'completed' ? 'Xem lại' : completionStatus === 'in_progress' ? 'Tiếp tục' : 'Bắt đầu' }}
        <ArrowRightIcon :size="14" />
      </span>
    </div>
  </RouterLink>
</template>

<script setup>
import { computed } from 'vue'
import { UsersIcon, CalendarIcon, ArrowRightIcon } from 'lucide-vue-next'
import { truncate, formatDate } from '@/lib/utils.js'
import StatusBadge from '@/components/ui/StatusBadge.vue'

const props = defineProps({
  survey: { type: Object, required: true },
})

const completionStatus = computed(() => {
  if (props.survey.is_complete) return 'completed'
  if (props.survey.has_draft) return 'in_progress'
  return 'pending'
})

const statusClass = computed(() => ({
  'status-bar--completed': completionStatus.value === 'completed',
  'status-bar--progress': completionStatus.value === 'in_progress',
  'status-bar--pending': completionStatus.value === 'pending',
}))

const isExpiringSoon = computed(() => {
  if (!props.survey.expires_at) return false
  const diff = new Date(props.survey.expires_at) - new Date()
  return diff > 0 && diff < 3 * 24 * 60 * 60 * 1000
})
</script>

<style scoped>
.survey-card {
  display: flex;
  flex-direction: column;
  background: var(--color-surface);
  border: 1px solid transparent;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-border);
  overflow: hidden;
  text-decoration: none;
  color: inherit;
  transition: box-shadow 150ms ease-out, transform 150ms ease-out;
  position: relative;
}

@media (hover: hover) {
  .survey-card:hover {
    box-shadow: var(--shadow-border-hover);
    transform: translateY(-1px);
  }
}

.survey-card:not(:disabled):active {
  scale: 0.98;
  transition: scale 150ms ease-out;
}

/* ─── Status bar (left border indicator) ─────────────────── */
.survey-card__status-bar {
  position: absolute;
  left: 0; top: 0; bottom: 0;
  width: 3px;
}

.status-bar--completed { background: var(--color-success); }
.status-bar--progress  { background: var(--color-warning); }
.status-bar--pending   { background: var(--color-border-hover); }

/* ─── Body ────────────────────────────────────────────────── */
.survey-card__body {
  flex: 1;
  padding: 16px 16px 12px 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.survey-card__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
}

.survey-card__title {
  font-size: 0.9375rem;
  font-weight: 600;
  line-height: 1.4;
  color: var(--color-text);
  text-wrap: pretty;
}

.survey-card__desc {
  font-size: 0.8125rem;
  color: var(--color-text-muted);
  line-height: 1.5;
}

/* ─── Meta ────────────────────────────────────────────────── */
.survey-card__meta {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  margin-top: 4px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.75rem;
  color: var(--color-text-subtle);
  font-variant-numeric: tabular-nums;
}

.meta-item--warn { color: var(--color-warning); }

/* ─── Footer ──────────────────────────────────────────────── */
.survey-card__footer {
  padding: 10px 16px 12px 20px;
  border-top: 1px solid var(--color-border);
}

.survey-card__action {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--color-primary);
}
</style>

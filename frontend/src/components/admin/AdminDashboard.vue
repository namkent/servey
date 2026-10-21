<template>
  <div class="admin-dashboard">
    <!-- Stats row -->
    <div class="stats-grid animate-in" style="animation-delay: 0ms">
      <StatsCard
        v-for="(stat, i) in stats"
        :key="stat.label"
        :value="stat.value"
        :label="stat.label"
        :icon="stat.icon"
        :color="stat.color"
        :loading="statsLoading"
        :style="{ animationDelay: `${i * 60}ms` }"
        class="animate-in"
      />
    </div>

    <!-- Charts row -->
    <div class="charts-grid animate-in" style="animation-delay: 200ms">
      <!-- Recent activity -->
      <div class="chart-card">
        <h3 class="chart-title">{{ t('adminDashboard.recentActivity') }}</h3>
        <div v-if="statsLoading" class="activity-skeleton">
          <div v-for="i in 5" :key="i" class="sk-activity-item">
            <div class="sk-block sk-avatar" />
            <div class="sk-info">
              <div class="sk-block sk-name" />
              <div class="sk-block sk-meta" />
            </div>
          </div>
        </div>
        <div v-else-if="globalStats?.recentActivity?.length" class="activity-list">
          <div
            v-for="item in globalStats.recentActivity"
            :key="`${item.survey_id}-${item.submitted_at}`"
            class="activity-item"
          >
            <div class="activity-avatar">
              <img v-if="item.user_avatar" :src="item.user_avatar" :alt="item.user_name" />
              <span v-else>{{ getInitials(item.user_name) }}</span>
            </div>
            <div class="activity-info">
              <p class="activity-user">{{ item.user_name }}</p>
              <p class="activity-meta">
                <span class="activity-meta__text">
                  {{ t('adminDashboard.completedAction', { title: '' }) }} <strong class="activity-survey-title" :title="item.survey_title">{{ item.survey_title }}</strong>
                </span>
                <span class="activity-meta__time"> · {{ timeAgo(item.submitted_at) }}</span>
              </p>
            </div>
          </div>
        </div>
        <div v-else class="empty-activity">
          <p>{{ t('adminDashboard.noActivity') }}</p>
        </div>
      </div>

      <!-- Quick actions -->
      <div class="chart-card">
        <h3 class="chart-title">{{ t('adminDashboard.quickActions') }}</h3>
        <div class="quick-actions">
          <RouterLink to="/survey/admin/surveys/new" class="quick-action-btn quick-action-btn--primary">
            <PlusIcon :size="18" />
            {{ t('adminDashboard.createSurvey') }}
          </RouterLink>
          <RouterLink to="/survey/admin/surveys" class="quick-action-btn">
            <ListIcon :size="18" />
            {{ t('adminDashboard.viewAllSurveys') }}
          </RouterLink>
        </div>

        <!-- Top surveys -->
        <div v-if="!statsLoading && topSurveys.length" class="top-surveys">
          <p class="top-surveys__label">{{ t('adminDashboard.featuredSurveys') }}</p>
          <div class="top-survey-item" v-for="s in topSurveys" :key="s.id">
            <RouterLink :to="`/survey/admin/surveys/${s.id}/results`" class="top-survey-link" :title="s.title">
              <span class="top-survey-title">{{ s.title }}</span>
              <span class="top-survey-count tabular-nums">{{ s.response_count }}</span>
            </RouterLink>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { PlusIcon, ListIcon, ClipboardListIcon, UsersIcon, CheckSquareIcon, BarChart3Icon } from 'lucide-vue-next'
import api from '@/lib/axios.js'
import { getInitials, timeAgo } from '@/lib/utils.js'
import StatsCard from '@/components/dashboard/StatsCard.vue'

const { t } = useI18n()
const globalStats = ref(null)
const allSurveys = ref([])
const statsLoading = ref(true)

const stats = computed(() => {
  if (!globalStats.value) return [
    { label: t('adminDashboard.totalSurveys'), value: '—', icon: ClipboardListIcon, color: 'blue' },
    { label: t('adminDashboard.activeSurveys'), value: '—', icon: BarChart3Icon, color: 'green' },
    { label: t('adminDashboard.completedResponses'), value: '—', icon: CheckSquareIcon, color: 'purple' },
    { label: t('adminDashboard.totalUsers'), value: '—', icon: UsersIcon, color: 'orange' },
  ]
  return [
    { label: t('adminDashboard.totalSurveys'), value: globalStats.value.totalSurveys, icon: ClipboardListIcon, color: 'blue' },
    { label: t('adminDashboard.activeSurveys'), value: globalStats.value.activeSurveys, icon: BarChart3Icon, color: 'green' },
    { label: t('adminDashboard.completedResponses'), value: globalStats.value.totalResponses, icon: CheckSquareIcon, color: 'purple' },
    { label: t('adminDashboard.totalUsers'), value: globalStats.value.totalUsers, icon: UsersIcon, color: 'orange' },
  ]
})

const topSurveys = computed(() =>
  [...allSurveys.value].sort((a, b) => (b.response_count || 0) - (a.response_count || 0)).slice(0, 5)
)

onMounted(async () => {
  try {
    const [statsRes, surveysRes] = await Promise.all([
      api.get('/admin/stats'),
      api.get('/surveys/all'),
    ])
    globalStats.value = statsRes.data
    allSurveys.value = surveysRes.data.surveys
  } finally {
    statsLoading.value = false
  }
})
</script>

<style scoped>
.admin-dashboard {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* ─── Stats Grid ──────────────────────────────────────────── */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
}

/* ─── Charts Grid ─────────────────────────────────────────── */
.charts-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

@media (max-width: 900px) {
  .charts-grid { grid-template-columns: 1fr; }
}

.chart-card {
  background: var(--color-surface);
  border: 1px solid transparent;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-border);
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.chart-title {
  font-size: 0.9375rem;
  font-weight: 650;
  color: var(--color-text);
}

/* ─── Activity ────────────────────────────────────────────── */
.activity-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.activity-item {
  display: flex;
  align-items: center;
  gap: 10px;
}

.activity-avatar {
  width: 32px; height: 32px;
  border-radius: 50%;
  background: var(--color-primary-muted);
  color: var(--color-primary);
  display: flex; align-items: center; justify-content: center;
  font-size: 0.6875rem; font-weight: 700;
  overflow: hidden; flex-shrink: 0;
}

.activity-avatar img {
  width: 100%; height: 100%; object-fit: cover;
}

.activity-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.activity-user {
  font-size: 0.8125rem; font-weight: 600; color: var(--color-text);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}

.activity-meta {
  font-size: 0.75rem; color: var(--color-text-muted);
  display: flex;
  align-items: center;
  min-width: 0;
  white-space: nowrap;
}

.activity-meta__text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
}

.activity-survey-title {
  font-weight: 600;
  color: var(--color-text);
}

.activity-meta__time {
  flex-shrink: 0;
  white-space: nowrap;
}

.empty-activity {
  color: var(--color-text-subtle); font-size: 0.875rem; padding: 20px 0;
}

/* ─── Quick Actions ───────────────────────────────────────── */
.quick-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.quick-action-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  border-radius: var(--radius-md);
  font-size: 0.875rem;
  font-weight: 500;
  text-decoration: none;
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  color: var(--color-text);
  transition: background-color 150ms ease-out, box-shadow 150ms ease-out;
}

.quick-action-btn--primary {
  background: var(--color-primary);
  color: white;
  border-color: transparent;
}

@media (hover: hover) {
  .quick-action-btn--primary:hover { background: var(--color-primary-600); }
  .quick-action-btn:not(.quick-action-btn--primary):hover {
    background: var(--color-surface-2);
    box-shadow: var(--shadow-border);
  }
}

/* ─── Top Surveys ─────────────────────────────────────────── */
.top-surveys { margin-top: 4px; }
.top-surveys__label {
  font-size: 0.75rem; font-weight: 600;
  text-transform: uppercase; letter-spacing: 0.05em;
  color: var(--color-text-subtle); margin-bottom: 8px;
}

.top-survey-item {
  width: 100%;
}

.top-survey-link {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 8px 0;
  text-decoration: none;
  color: var(--color-text);
  border-bottom: 1px solid var(--color-border);
  font-size: 0.8125rem;
  transition: color 150ms ease-out;
  width: 100%;
  min-width: 0;
}

@media (hover: hover) {
  .top-survey-link:hover { color: var(--color-primary); }
}

.top-survey-title {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
}

.top-survey-count {
  font-size: 0.75rem; color: var(--color-text-muted);
  font-variant-numeric: tabular-nums;
  flex-shrink: 0;
}

/* ─── Skeleton ────────────────────────────────────────────── */
.activity-skeleton { display: flex; flex-direction: column; gap: 12px; }
.sk-activity-item { display: flex; gap: 10px; align-items: center; }
.sk-info { flex: 1; display: flex; flex-direction: column; gap: 6px; }
.sk-block {
  background: var(--color-surface-2);
  border-radius: var(--radius-sm);
  animation: shimmer 1.5s ease-in-out infinite;
}
.sk-avatar { width: 32px; height: 32px; border-radius: 50%; flex-shrink: 0; }
.sk-name { height: 13px; width: 120px; }
.sk-meta { height: 11px; width: 200px; }

@keyframes shimmer {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}
</style>

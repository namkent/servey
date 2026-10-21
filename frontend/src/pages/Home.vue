<template>
  <div class="home-page">
    <!-- User Dashboard -->
    <template v-if="!authStore.canManage">
      <!-- Greeting -->
      <section class="greeting animate-in" style="animation-delay: 0ms">
        <div class="greeting__text">
          <h2>{{ greeting }}, {{ firstName }} 👋</h2>
          <p>{{ t('dashboard.pendingMsg', { count: pendingSurveys }) }}</p>
        </div>
        <div class="greeting__avatar">
          <img v-if="authStore.user?.avatar" :src="authStore.user.avatar" :alt="authStore.user?.name" class="greeting-avatar" />
          <div v-else class="greeting-avatar-fallback">{{ getInitials(authStore.user?.name) }}</div>
        </div>
      </section>

      <!-- Survey list -->
      <section class="animate-in" style="animation-delay: 100ms">
        <div class="section-header">
          <h3 class="section-title">{{ t('dashboard.activeSurveysList') }}</h3>
          <span class="survey-count tabular-nums">{{ surveyStore.surveys.length }}</span>
        </div>

        <div v-if="surveyStore.loading" class="survey-grid">
          <SurveyCardSkeleton v-for="i in 4" :key="i" />
        </div>

        <div v-else-if="surveyStore.surveys.length === 0" class="empty-state">
          <ClipboardListIcon :size="40" class="empty-icon" />
          <p>{{ t('dashboard.noActiveSurveys') }}</p>
        </div>

        <div v-else class="survey-grid">
          <SurveyCard
            v-for="(survey, i) in surveyStore.surveys"
            :key="survey.id"
            :survey="survey"
            :style="{ animationDelay: `${100 + i * 60}ms` }"
            class="animate-in"
          />
        </div>
      </section>
    </template>

    <!-- Admin / Manager Dashboard -->
    <template v-else>
      <AdminDashboard />
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { ClipboardListIcon } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth.js'
import { useSurveyStore } from '@/stores/surveys.js'
import { getInitials } from '@/lib/utils.js'
import SurveyCard from '@/components/survey/SurveyCard.vue'
import SurveyCardSkeleton from '@/components/survey/SurveyCardSkeleton.vue'
import AdminDashboard from '@/components/admin/AdminDashboard.vue'

const { t } = useI18n()
const authStore = useAuthStore()
const surveyStore = useSurveyStore()

const greeting = computed(() => {
  const hour = new Date().getHours()
  if (hour < 12) return t('dashboard.goodMorning')
  if (hour < 18) return t('dashboard.goodAfternoon')
  return t('dashboard.goodEvening')
})

const firstName = computed(() => {
  const name = authStore.user?.name || ''
  return name.split(' ').pop()
})

const pendingSurveys = computed(() =>
  surveyStore.surveys.filter(s => !s.is_complete).length
)

onMounted(() => {
  surveyStore.fetchSurveys()
})
</script>

<style scoped>
.home-page {
  display: flex;
  flex-direction: column;
  gap: 28px;
}

/* ─── Greeting ───────────────────────────────────────────── */
.greeting {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: linear-gradient(135deg,
    oklch(0.55 0.18 264 / 0.12) 0%,
    oklch(0.65 0.18 300 / 0.08) 100%
  );
  border: 1px solid oklch(0.55 0.18 264 / 0.15);
  border-radius: var(--radius-xl);
  padding: 24px 28px;
  gap: 16px;
}

.greeting__text h2 {
  font-size: 1.375rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--color-text);
}

.greeting__text p {
  color: var(--color-text-muted);
  margin-top: 4px;
  font-size: 0.9375rem;
}

.greeting-avatar {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  object-fit: cover;
  outline: 2px solid var(--color-border);
  outline-offset: 2px;
  flex-shrink: 0;
}

.greeting-avatar-fallback {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: var(--color-primary-muted);
  color: var(--color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  font-weight: 700;
  flex-shrink: 0;
}

/* ─── Section ─────────────────────────────────────────────── */
.section-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
}

.section-title {
  font-size: 1rem;
  font-weight: 650;
  color: var(--color-text);
}

.survey-count {
  padding: 2px 8px;
  background: var(--color-surface-2);
  border-radius: 99px;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-text-muted);
}

/* ─── Grid ────────────────────────────────────────────────── */
.survey-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

/* ─── Empty ───────────────────────────────────────────────── */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 60px 20px;
  color: var(--color-text-subtle);
  font-size: 0.9375rem;
}

.empty-icon {
  opacity: 0.4;
}
</style>

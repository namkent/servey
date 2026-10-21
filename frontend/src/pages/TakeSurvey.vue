<template>
  <div class="take-survey-page">
    <!-- Loading -->
    <div v-if="loading" class="loading-state">
      <div class="spinner" />
      <p>Đang tải khảo sát…</p>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="error-state animate-in">
      <AlertCircleIcon :size="40" />
      <h2>Không thể tải khảo sát</h2>
      <p>{{ error }}</p>
      <RouterLink to="/survey" class="back-link">← Quay về trang chủ</RouterLink>
    </div>

    <!-- Completed banner -->
    <div v-else-if="isCompleted && !showReadOnly" class="completed-state animate-in">
      <div class="completed-icon">
        <CheckCircleIcon :size="48" />
      </div>
      <h2>Bạn đã hoàn thành khảo sát này!</h2>
      <p>Cảm ơn bạn đã tham gia "<strong>{{ survey?.title }}</strong>".</p>
      <p class="completed-date">Nộp lúc: {{ formatDateTime(myResponse?.response?.submitted_at) }}</p>
      <div class="completed-actions">
        <button class="btn btn--outline" @click="viewReadOnly">
          <EyeIcon :size="16" /> Xem lại câu trả lời đã gửi
        </button>
        <RouterLink to="/survey" class="back-link">← Quay về trang chủ</RouterLink>
      </div>
    </div>

    <!-- Survey (or Read-only review) -->
    <template v-else-if="survey">
      <div class="survey-header animate-in" style="animation-delay: 0ms">
        <div class="survey-nav-row">
          <RouterLink to="/survey" class="survey-back-btn">
            <ArrowLeftIcon :size="16" />
            {{ t('common.back') }}
          </RouterLink>
          <span v-if="showReadOnly" class="readonly-badge">
            <LockIcon :size="14" /> Complete Survey
          </span>
        </div>
        <div class="survey-info">
          <h2 class="survey-title">{{ survey.title }}</h2>
          <p v-if="survey.description" class="survey-description">{{ survey.description }}</p>
        </div>
      </div>

      <div class="survey-wrapper animate-in" style="animation-delay: 80ms">
        <SurveyComponent
          v-if="surveyModel"
          :model="surveyModel"
        />
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { AlertCircleIcon, CheckCircleIcon, ArrowLeftIcon, EyeIcon, LockIcon } from 'lucide-vue-next'
import { Model } from 'survey-core'
import { SurveyComponent } from 'survey-vue3-ui'
import { useSurveyStore } from '@/stores/surveys.js'
import { formatDateTime, debounce } from '@/lib/utils.js'

const { t } = useI18n()
const route = useRoute()
const surveyStore = useSurveyStore()

const survey = ref(null)
const myResponse = ref(null)
const surveyModel = ref(null)
const loading = ref(true)
const error = ref(null)
const showReadOnly = ref(false)

const isCompleted = computed(() => myResponse.value?.response?.is_complete === true)

async function init() {
  loading.value = true
  error.value = null
  showReadOnly.value = false

  try {
    const [surveyData, responseData] = await Promise.all([
      surveyStore.fetchSurvey(route.params.id),
      surveyStore.fetchMyResponse(route.params.id),
    ])

    if (!surveyData) {
      error.value = 'Không tìm thấy khảo sát này.'
      return
    }

    survey.value = surveyData
    myResponse.value = responseData

    if (!isCompleted.value) {
      buildSurveyModel(surveyData, responseData)
    }
  } catch (err) {
    error.value = err.message || 'Đã có lỗi xảy ra.'
  } finally {
    loading.value = false
  }
}

function viewReadOnly() {
  showReadOnly.value = true
  const model = new Model(survey.value.schema)
  model.showTitle = false
  model.locale = 'vi'
  if (myResponse.value?.response?.response) {
    model.data = myResponse.value.response.response
  }
  model.mode = 'display' // Read-only SurveyJS mode
  surveyModel.value = model
}

function buildSurveyModel(surveyData, responseData) {
  const model = new Model(surveyData.schema)
  model.showTitle = false
  model.locale = 'vi'

  // Restore draft if exists
  if (responseData?.response?.response && Object.keys(responseData.response.response).length > 0) {
    model.data = responseData.response.response
  }

  // Auto-save on value change (debounced 2s)
  const autoSave = debounce(async (data) => {
    try {
      await surveyStore.saveResponse(route.params.id, data, false)
    } catch (e) {
      if (e.response?.status === 409) {
        // Already completed on server - refresh
        init()
      }
    }
  }, 2000)

  model.onValueChanged.add((sender) => {
    autoSave(sender.data)
  })

  // On submit
  model.onComplete.add(async (sender) => {
    try {
      await surveyStore.saveResponse(route.params.id, sender.data, true)
      myResponse.value = { response: { is_complete: true, submitted_at: new Date().toISOString() } }
    } catch (err) {
      if (err.response?.status === 409) {
        myResponse.value = { response: { is_complete: true } }
      }
    }
  })

  surveyModel.value = model
}

onMounted(init)
</script>

<style scoped>
.take-survey-page {
  max-width: 860px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* ─── States ─────────────────────────────────────────────── */
.loading-state, .error-state, .completed-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 80px 20px;
  text-align: center;
}

.spinner {
  width: 40px; height: 40px;
  border: 3px solid var(--color-border);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 600ms linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

.error-state { color: var(--color-danger); }

/* ─── Completed ────────────────────────────────────────────── */
.completed-state {
  color: var(--color-text);
}

.completed-icon {
  width: 80px; height: 80px;
  background: var(--color-success-bg);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-success);
}

.completed-date {
  font-size: 0.875rem;
  color: var(--color-text-muted);
}

.completed-actions {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  margin-top: 12px;
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--color-primary);
  font-weight: 500;
  font-size: 0.9375rem;
  text-decoration: none;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: var(--radius-md);
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  border: 1px solid transparent;
  transition: all 150ms ease-out;
}

.btn:active { scale: 0.96; }

.btn--outline {
  background: var(--color-surface);
  border-color: var(--color-border);
  color: var(--color-text);
}

.btn--outline:hover {
  background: var(--color-surface-2);
}

/* ─── Header ──────────────────────────────────────────────── */
.survey-header {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.survey-nav-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.readonly-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: oklch(from var(--color-primary) l c h / 0.1);
  color: var(--color-primary);
  font-size: 0.75rem;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: var(--radius-full);
}

.survey-back-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--color-text-muted);
  text-decoration: none;
  font-size: 0.875rem;
  font-weight: 500;
  transition: color 150ms ease-out;
}

@media (hover: hover) {
  .survey-back-btn:hover { color: var(--color-text); }
}

.survey-title {
  font-size: 1.5rem;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.survey-description {
  color: var(--color-text-muted);
  font-size: 0.9375rem;
}

/* ─── Survey wrapper ──────────────────────────────────────── */
.survey-wrapper {
  background: #ffffff;
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-card);
  overflow: hidden;
}

/* Hide duplicate survey header inside SurveyJS */
:deep(.sd-header),
:deep(.sd-survey-header),
:deep(.sd-container-modern > .sd-title),
:deep(.sd-container-modern > .sd-description),
:deep(.sd-header__title),
:deep(.sd-header__description) {
  display: none !important;
}
</style>

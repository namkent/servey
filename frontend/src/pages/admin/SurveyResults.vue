<template>
  <div class="results-page">
    <!-- Header -->
    <div class="page-header animate-in">
      <div class="header-left">
        <RouterLink to="/survey/admin/surveys" class="back-btn">
          <ArrowLeftIcon :size="16" /> {{ t('resultsPage.backToList') }}
        </RouterLink>
        <div class="title-row">
          <h2 class="page-title">{{ survey?.title || t('resultsPage.loading') }}</h2>
          <StatusBadge v-if="survey" :status="survey.is_active ? 'active' : 'inactive'" />
        </div>
        <p class="page-sub" v-if="survey">
          {{ t('resultsPage.slug') }}: <code class="slug-badge">{{ survey.id }}</code> &bull; {{ t('resultsPage.createdAt') }}: <span class="tabular-nums">{{ formatDateTime24(survey.created_at) }}</span>
        </p>
      </div>

      <div class="header-actions">
        <button class="btn btn--outline" @click="exportExcel" :disabled="!responses.length" :title="t('common.exportExcel', 'Xuất Excel')">
          <DownloadIcon :size="16" /> {{ t('common.exportExcel', 'Xuất Excel') }}
        </button>
        <button class="btn btn--outline" @click="exportJSON" :disabled="!responses.length" :title="t('common.exportJSON')">
          <FileTextIcon :size="16" /> {{ t('common.exportJSON') }}
        </button>
        <button class="btn btn--primary" @click="loadData" :disabled="loading" :title="t('common.refresh')">
          <RefreshCwIcon :size="16" :class="{ 'spin': loading }" /> {{ t('common.refresh') }}
        </button>
      </div>
    </div>

    <!-- Stats Cards -->
    <div class="stats-grid animate-in" style="animation-delay: 50ms">
      <div class="stat-card stat-card--blue">
        <div class="stat-card__icon"><UsersIcon :size="20" /></div>
        <div class="stat-card__content">
          <span class="stat-label">{{ t('resultsPage.totalParticipants') }}</span>
          <span class="stat-value tabular-nums">{{ stats.total }}</span>
        </div>
      </div>
      <div class="stat-card stat-card--green">
        <div class="stat-card__icon"><CheckCircle2Icon :size="20" /></div>
        <div class="stat-card__content">
          <span class="stat-label">{{ t('resultsPage.completedCount') }}</span>
          <span class="stat-value tabular-nums">{{ stats.completed }}</span>
        </div>
      </div>
      <div class="stat-card stat-card--amber">
        <div class="stat-card__icon"><ClockIcon :size="20" /></div>
        <div class="stat-card__content">
          <span class="stat-label">{{ t('resultsPage.inProgressCount') }}</span>
          <span class="stat-value tabular-nums">{{ stats.inProgress }}</span>
        </div>
      </div>
      <div class="stat-card stat-card--purple">
        <div class="stat-card__icon"><PercentIcon :size="20" /></div>
        <div class="stat-card__content">
          <span class="stat-label">{{ t('resultsPage.rate') }}</span>
          <span class="stat-value tabular-nums">{{ completionRate }}%</span>
        </div>
      </div>
    </div>

    <!-- Tabs Navigation -->
    <div class="tabs-nav animate-in" style="animation-delay: 100ms">
      <button
        class="tab-btn"
        :class="{ 'tab-btn--active': activeTab === 'list' }"
        @click="activeTab = 'list'"
      >
        <ListIcon :size="16" /> {{ t('resultsPage.participantList') }} ({{ responses.length }})
      </button>
      <button
        class="tab-btn"
        :class="{ 'tab-btn--active': activeTab === 'summary' }"
        @click="activeTab = 'summary'"
      >
        <BarChart3Icon :size="16" /> {{ t('resultsPage.tabSummary') }} ({{ questionList.length }})
      </button>
    </div>

    <!-- Tab 1: Responses List -->
    <div v-if="activeTab === 'list'" class="tab-content animate-in" style="animation-delay: 150ms">
      <!-- Search and filter -->
      <div class="table-toolbar">
        <div class="search-box">
          <SearchIcon :size="16" class="search-icon" />
          <input
            v-model="searchQuery"
            type="text"
            :placeholder="t('resultsPage.searchPlaceholder')"
            class="search-input"
          />
        </div>
        <CustomSelect
          v-model="statusFilter"
          :options="statusFilterOptions"
          style="min-width: 170px;"
        />
      </div>

      <!-- Empty state -->
      <div v-if="!loading && filteredResponses.length === 0" class="empty-state">
        <InboxIcon :size="48" class="empty-icon" />
        <p class="empty-title">{{ t('resultsPage.noQuestions') }}</p>
      </div>

      <!-- Responses Table -->
      <div v-else class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>{{ t('resultsPage.colParticipant') }}</th>
              <th>{{ t('resultsPage.colStatus') }}</th>
              <th>{{ t('resultsPage.colSubmittedAt') }}</th>
              <th>{{ t('resultsPage.answerCount') }}</th>
              <th class="text-right">{{ t('resultsPage.colDetail') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in filteredResponses" :key="item.id">
              <td>
                <div class="user-cell">
                  <div class="user-avatar">
                    <img v-if="item.user_avatar" :src="item.user_avatar" :alt="item.user_name" />
                    <span v-else>{{ (item.user_name || 'U').charAt(0).toUpperCase() }}</span>
                  </div>
                  <div>
                    <div class="user-name">{{ item.user_name || t('resultsPage.anonymousUser') }}</div>
                    <div class="user-email">{{ item.user_email || item.user_id }}</div>
                  </div>
                </div>
              </td>
              <td>
                <span class="table-badge" :class="item.is_complete ? 'table-badge--success' : 'table-badge--warning'">
                  <CheckCircle2Icon v-if="item.is_complete" :size="13" />
                  <ClockIcon v-else :size="13" />
                  <span>{{ item.is_complete ? t('resultsPage.statusCompleted') : t('resultsPage.statusDraft') }}</span>
                </span>
              </td>
              <td class="tabular-nums">
                {{ formatDateTime24(item.submitted_at || item.updated_at || item.created_at) }}
              </td>
              <td class="tabular-nums">
                {{ t('resultsPage.questionsCount', { count: Object.keys(item.response || {}).length }) }}
              </td>
              <td class="text-right">
                <button class="table-btn-action" @click="viewDetail(item)">
                  <EyeIcon :size="13" />
                  <span>{{ t('resultsPage.viewDetail') }}</span>
                </button>
              </td>
            </tr>

          </tbody>
        </table>
      </div>
    </div>

    <!-- Tab 2: Question Summary Breakdown -->
    <div v-else-if="activeTab === 'summary'" class="tab-content animate-in" style="animation-delay: 150ms">
      <div v-if="questionList.length === 0" class="empty-state">
        <HelpCircleIcon :size="48" class="empty-icon" />
        <p class="empty-title">{{ t('resultsPage.noQuestions') }}</p>
      </div>

      <div v-else class="questions-grid">
        <div v-for="(q, idx) in questionList" :key="q.name" class="question-card">
          <div class="question-header">
            <span class="question-number">#{{ idx + 1 }}</span>
            <div>
              <h4 class="question-title">{{ q.title || q.name }}</h4>
              <span class="question-type">{{ q.type }} &bull; {{ t('resultsPage.fieldName') }}: <code>{{ q.name }}</code></span>
            </div>
          </div>

          <div class="question-answers">
            <div class="answer-count-header">
              <span>{{ t('resultsPage.responsesCount', { count: getAnswerCount(q.name) }) }}</span>
            </div>

            <!-- Choice / Radiogroup / Checkbox breakdown with Pie Chart -->
            <div v-if="q.choices && q.choices.length" class="choice-breakdown-container">
              <!-- Left: Interactive Pie / Donut Chart -->
              <div class="choice-chart-col">
                <PieChart
                  :items="getChoiceBreakdown(q)"
                  :size="160"
                  :unit-label="t('resultsPage.responsesUnit')"
                />
              </div>

              <!-- Right: Detailed legend with color badges and bars -->
              <div class="choice-list-col">
                <div
                  v-for="(choice, cIdx) in getChoiceBreakdown(q)"
                  :key="choice.value"
                  class="choice-row"
                >
                  <div class="choice-info">
                    <div class="choice-badge-wrap">
                      <span class="choice-color-dot" :style="{ backgroundColor: choice.color }" />
                      <span class="choice-text">{{ choice.text }}</span>
                    </div>
                    <span class="choice-stat tabular-nums">
                      <strong>{{ choice.count }}</strong> ({{ choice.percent }}%)
                    </span>
                  </div>
                  <div class="choice-bar-bg">
                    <div
                      class="choice-bar-fill"
                      :style="{ width: choice.percent + '%', backgroundColor: choice.color }"
                    />
                  </div>
                </div>
              </div>
            </div>

            <!-- Text / Comments samples -->
            <div v-else class="text-answers-list">
              <div v-for="(ans, aIdx) in getTextAnswers(q.name)" :key="aIdx" class="text-answer-item">
                <p class="text-answer-content">{{ ans }}</p>
              </div>
              <div v-if="getTextAnswers(q.name).length === 0" class="no-text-answers">
                {{ t('resultsPage.noTextAnswers') }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Detail Modal (Rendered with SurveyJS Native Display Mode) -->
    <Transition name="fade">
      <div v-if="selectedResponse" class="modal-backdrop" @click.self="selectedResponse = null">
        <div class="modal-card modal-card--lg">
          <div class="modal-header">
            <div>
              <h3 class="modal-title">{{ t('resultsPage.modalTitle') }}</h3>
              <p class="modal-sub">
                {{ t('resultsPage.colParticipant') }}: <strong>{{ selectedResponse.user_name || t('resultsPage.anonymousUser') }}</strong> ({{ selectedResponse.user_email || selectedResponse.user_id }})
              </p>
            </div>
            <button class="modal-close" @click="selectedResponse = null">
              <XIcon :size="18" />
            </button>
          </div>

          <div class="modal-body modal-body--survey">
            <div class="response-meta-box">
              <div class="meta-item">
                <span class="meta-k">{{ t('resultsPage.colStatus') }}:</span>
                <span class="meta-badge" :class="selectedResponse.is_complete ? 'meta-badge--success' : 'meta-badge--warning'">
                  <CheckCircle2Icon v-if="selectedResponse.is_complete" :size="13" />
                  <ClockIcon v-else :size="13" />
                  <span>{{ selectedResponse.is_complete ? t('resultsPage.statusCompleted') : t('resultsPage.statusDraft') }}</span>
                </span>
              </div>
              <div class="meta-item">
                <span class="meta-k">{{ t('resultsPage.colSubmittedAt') }}:</span>
                <span class="meta-badge meta-badge--neutral tabular-nums">
                  {{ selectedResponse.submitted_at ? formatDateTime24(selectedResponse.submitted_at) : (selectedResponse.updated_at ? formatDateTime24(selectedResponse.updated_at) : '—') }}
                </span>
              </div>
              <div class="meta-item">
                <span class="meta-k">{{ t('resultsPage.answerCount') }}:</span>
                <span class="meta-badge meta-badge--neutral">
                  {{ t('resultsPage.questionsCount', { count: Object.keys(selectedResponse.response || {}).length }) }}
                </span>
              </div>
            </div>

            <!-- SurveyJS Combined Schema + Data Render -->
            <div class="surveyjs-display-wrapper">
              <SurveyComponent v-if="surveyViewModel" :model="surveyViewModel" />
              <div v-else class="survey-render-loading">
                {{ t('resultsPage.preparingSurvey') }}
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn btn--outline" @click="selectedResponse = null">{{ t('common.close') }}</button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useSurveyStore } from '@/stores/surveys.js'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import CustomSelect from '@/components/ui/CustomSelect.vue'
import PieChart from '@/components/ui/PieChart.vue'
import { formatDateTime24 } from '@/lib/utils.js'
import { Model } from 'survey-core'
import { SurveyComponent } from 'survey-vue3-ui'
import * as XLSX from 'xlsx'
import {
  ArrowLeftIcon, DownloadIcon, FileTextIcon, RefreshCwIcon,
  UsersIcon, CheckCircle2Icon, ClockIcon, PercentIcon,
  ListIcon, BarChart3Icon, SearchIcon, InboxIcon, EyeIcon,
  HelpCircleIcon, XIcon
} from 'lucide-vue-next'

const { t, locale } = useI18n()
const route = useRoute()
const surveyStore = useSurveyStore()

const loading = ref(false)
const survey = ref(null)
const responses = ref([])
const stats = ref({ total: 0, completed: 0, inProgress: 0 })
const activeTab = ref('list')
const searchQuery = ref('')
const statusFilter = ref('all')
const selectedResponse = ref(null)
const surveyViewModel = ref(null)

const statusFilterOptions = computed(() => [
  { label: t('resultsPage.filterAllStatus'), value: 'all' },
  { label: t('resultsPage.statusCompleted'), value: 'completed' },
  { label: t('resultsPage.statusDraft'), value: 'in_progress' },
])

const completionRate = computed(() => {
  if (!stats.value.total) return 0
  return Math.round((stats.value.completed / stats.value.total) * 100)
})

// Flatten question list from SurveyJS schema
const questionList = computed(() => {
  if (!survey.value?.schema) return []
  const schema = survey.value.schema
  const list = []

  function extractQuestions(elements) {
    if (!elements || !Array.isArray(elements)) return
    for (const el of elements) {
      if (el.type === 'panel') {
        extractQuestions(el.elements)
      } else {
        list.push({
          name: el.name,
          title: el.title || el.name,
          type: el.type,
          choices: el.choices || [],
        })
      }
    }
  }

  if (schema.pages && Array.isArray(schema.pages)) {
    for (const page of schema.pages) {
      extractQuestions(page.elements)
    }
  } else if (schema.elements && Array.isArray(schema.elements)) {
    extractQuestions(schema.elements)
  }

  return list
})

const filteredResponses = computed(() => {
  return responses.value.filter(r => {
    // Status filter
    if (statusFilter.value === 'completed' && !r.is_complete) return false
    if (statusFilter.value === 'in_progress' && r.is_complete) return false

    // Search query
    if (searchQuery.value.trim()) {
      const q = searchQuery.value.toLowerCase().trim()
      const matchName = r.user_name?.toLowerCase().includes(q)
      const matchEmail = r.user_email?.toLowerCase().includes(q)
      if (!matchName && !matchEmail) return false
    }

    return true
  })
})

async function loadData() {
  loading.value = true
  const id = route.params.id
  try {
    const [surveyData, resultsData] = await Promise.all([
      surveyStore.fetchSurvey(id),
      surveyStore.fetchResults(id),
    ])
    survey.value = surveyData
    if (resultsData) {
      responses.value = resultsData.responses || []
      stats.value = resultsData.stats || { total: 0, completed: 0, inProgress: 0 }
    }
  } catch (err) {
    console.error('Failed to load results:', err)
  } finally {
    loading.value = false
  }
}

function formatDate(dateStr) {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  return d.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function viewDetail(responseItem) {
  selectedResponse.value = responseItem
  if (survey.value?.schema) {
    const model = new Model(survey.value.schema)
    model.data = responseItem.response || {}
    model.mode = 'display'
    model.locale = locale.value || 'vi'
    model.showNavigationButtons = false
    model.showProgressBar = 'off'
    model.showTitle = false
    surveyViewModel.value = model
  } else {
    surveyViewModel.value = null
  }
}

const CHART_COLORS = [
  '#3b82f6', // blue
  '#10b981', // emerald
  '#f59e0b', // amber
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#f97316', // orange
  '#84cc16', // lime
  '#6366f1', // indigo
  '#14b8a6', // teal
  '#d946ef', // fuchsia
  '#64748b'  // slate
]

function getChoiceColor(idx) {
  return CHART_COLORS[idx % CHART_COLORS.length]
}

function getAnswerCount(qName) {
  return responses.value.filter(r => r.response && r.response[qName] !== undefined).length
}

function getChoiceBreakdown(q) {
  const totalAnswers = getAnswerCount(q.name)
  const choices = (q.choices || []).map((c, idx) => {
    const val = typeof c === 'object' ? c.value : c
    const text = typeof c === 'object' ? (c.text || c.value) : c
    return { value: val, text: String(text), color: getChoiceColor(idx) }
  })

  return choices.map(choice => {
    let count = 0
    for (const r of responses.value) {
      const ans = r.response?.[q.name]
      if (Array.isArray(ans)) {
        if (ans.includes(choice.value)) count++
      } else if (ans === choice.value) {
        count++
      }
    }
    const percent = totalAnswers > 0 ? Math.round((count / totalAnswers) * 100) : 0
    return { ...choice, count, percent }
  })
}

function getTextAnswers(qName) {
  const answers = []
  for (const r of responses.value) {
    const ans = r.response?.[qName]
    if (ans !== undefined && ans !== null && String(ans).trim()) {
      answers.push(String(ans))
    }
  }
  return answers.slice(0, 20) // Show up to 20 samples
}

function exportJSON() {
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(responses.value, null, 2))
  const downloadAnchor = document.createElement('a')
  downloadAnchor.setAttribute('href', dataStr)
  downloadAnchor.setAttribute('download', `${survey.value?.id || 'survey'}-results.json`)
  document.body.appendChild(downloadAnchor)
  downloadAnchor.click()
  downloadAnchor.remove()
}

function exportExcel() {
  if (!responses.value.length) return

  const questions = questionList.value

  // Sheet 1: Responses data
  const dataRows = responses.value.map((r, idx) => {
    const row = {
      'STT': idx + 1,
      'Mã phản hồi': r.id,
      'Người tham gia': r.user_name || 'Người dùng ẩn danh',
      'Email': r.user_email || r.user_id,
      'Trạng thái': r.is_complete ? 'Đã hoàn thành' : 'Đang làm dở',
      'Thời gian nộp': formatDateTime24(r.submitted_at || r.updated_at || r.created_at),
    }

    questions.forEach(q => {
      const qTitle = typeof q.title === 'string' ? q.title : (q.name || 'Câu hỏi')
      const val = r.response?.[q.name]
      if (val === undefined || val === null) {
        row[qTitle] = ''
      } else if (Array.isArray(val)) {
        row[qTitle] = val.join(', ')
      } else if (typeof val === 'object') {
        row[qTitle] = JSON.stringify(val)
      } else {
        row[qTitle] = String(val)
      }
    })

    return row
  })

  // Sheet 2: Summary Stats
  const summaryRows = [
    { 'Thông tin': 'Tên khảo sát', 'Giá trị': survey.value?.title || '' },
    { 'Thông tin': 'Mã định danh (Slug)', 'Giá trị': survey.value?.id || '' },
    { 'Thông tin': 'Phòng ban', 'Giá trị': survey.value?.department || 'Chung' },
    { 'Thông tin': 'Tổng lượt tham gia', 'Giá trị': stats.value.total },
    { 'Thông tin': 'Số lượt hoàn thành', 'Giá trị': stats.value.completed },
    { 'Thông tin': 'Đang thực hiện (nháp)', 'Giá trị': stats.value.inProgress },
    { 'Thông tin': 'Tỷ lệ hoàn thành', 'Giá trị': `${completionRate.value}%` },
    { 'Thông tin': 'Thời điểm xuất file', 'Giá trị': formatDateTime24(new Date().toISOString()) }
  ]

  const wb = XLSX.utils.book_new()
  const wsData = XLSX.utils.json_to_sheet(dataRows)
  const wsSummary = XLSX.utils.json_to_sheet(summaryRows)

  XLSX.utils.book_append_sheet(wb, wsData, 'Danh sách phản hồi')
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Thống kê tổng quan')

  const fileName = `${survey.value?.id || 'survey'}-ket-qua.xlsx`
  XLSX.writeFile(wb, fileName)
}


onMounted(() => {
  loadData()
})
</script>

<style scoped>
.results-page {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* ─── Header ────────────────────────────────────────────── */
.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.back-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.8125rem;
  color: var(--color-text-muted);
  text-decoration: none;
  margin-bottom: 8px;
  transition: color 150ms ease-out;
}

.back-btn:hover {
  color: var(--color-primary);
}

.title-row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.page-title {
  font-size: 1.5rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--color-text);
}

.page-sub {
  font-size: 0.875rem;
  color: var(--color-text-muted);
  margin-top: 4px;
}

.slug-badge {
  font-family: monospace;
  background: var(--color-surface-2);
  padding: 2px 6px;
  border-radius: var(--radius-sm);
  font-size: 0.8125rem;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

/* ─── Stats Grid ─────────────────────────────────────────── */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px;
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-border);
}

.stat-card__icon {
  width: 44px;
  height: 44px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stat-card--blue .stat-card__icon { background: oklch(from var(--color-primary) l c h / 0.15); color: var(--color-primary); }
.stat-card--green .stat-card__icon { background: oklch(0.85 0.15 142 / 0.2); color: oklch(0.45 0.18 142); }
.stat-card--amber .stat-card__icon { background: oklch(0.85 0.15 75 / 0.2); color: oklch(0.55 0.18 75); }
.stat-card--purple .stat-card__icon { background: oklch(0.85 0.15 300 / 0.2); color: oklch(0.50 0.18 300); }

.stat-label {
  display: block;
  font-size: 0.8125rem;
  color: var(--color-text-muted);
}

.stat-value {
  display: block;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-text);
  line-height: 1.2;
}

/* ─── Tabs ───────────────────────────────────────────────── */
.tabs-nav {
  display: flex;
  gap: 8px;
  border-bottom: 1px solid var(--color-border);
  padding-bottom: 4px;
}

.tab-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: var(--radius-md);
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text-muted);
  background: transparent;
  border: none;
  cursor: pointer;
  transition: all 150ms ease-out;
}

.tab-btn:hover {
  color: var(--color-text);
  background: var(--color-surface-2);
}

.tab-btn--active {
  color: var(--color-primary);
  background: oklch(from var(--color-primary) l c h / 0.1);
  font-weight: 600;
}

/* ─── Table & Toolbar ────────────────────────────────────── */
.table-toolbar {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  flex-wrap: wrap;
  position: relative;
  z-index: 25;
}

.search-box {
  position: relative;
  flex: 1;
  min-width: 240px;
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--color-text-muted);
}

.search-input {
  width: 100%;
  height: 32px;
  padding: 0 12px 0 36px;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  color: var(--color-text);
  font-size: 0.8125rem;
  outline: none;
}

.filter-select {
  padding: 8px 12px;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  color: var(--color-text);
  font-size: 0.875rem;
}

.table-container {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow-x: auto;
  box-shadow: var(--shadow-border);
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
  text-align: left;
}

.data-table th {
  padding: 12px 16px;
  font-weight: 600;
  color: var(--color-text-muted);
  border-bottom: 1px solid var(--color-border);
  background: var(--color-surface-2);
}

.data-table td {
  padding: 14px 16px;
  border-bottom: 1px solid var(--color-border);
  color: var(--color-text);
}

.data-table tr:last-child td {
  border-bottom: none;
}

.user-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}

.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--color-primary);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.75rem;
  overflow: hidden;
  flex-shrink: 0;
}

.user-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.user-name {
  font-weight: 600;
  color: var(--color-text);
}

.user-email {
  font-size: 0.75rem;
  color: var(--color-text-muted);
}

/* ─── UNIFIED BADGE & BUTTON STYLE (matching UserManagement) ─── */
.table-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  height: 26px;
  padding: 0 10px;
  border-radius: var(--radius-sm);
  font-size: 0.75rem;
  font-weight: 500;
  line-height: 1;
  white-space: nowrap;
  border: 1px solid var(--color-border);
  background: var(--color-surface-2);
  color: var(--color-text-muted);
  box-sizing: border-box;
}

.table-badge--success {
  background: rgba(16, 185, 129, 0.1);
  border-color: rgba(16, 185, 129, 0.3);
  color: #10b981;
}

.table-badge--warning {
  background: rgba(245, 158, 11, 0.1);
  border-color: rgba(245, 158, 11, 0.3);
  color: #f59e0b;
}

.table-btn-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  height: 32px;
  padding: 0 12px;
  border-radius: var(--radius-sm);
  font-size: 0.75rem;
  font-weight: 500;
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  color: var(--color-text);
  cursor: pointer;
  transition: all 150ms ease-out;
}

.table-btn-action:hover {
  background: var(--color-surface-2);
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.text-right {
  text-align: right;
}

/* ─── Questions Breakdown ────────────────────────────────── */
.questions-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
}

.question-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 20px;
  box-shadow: var(--shadow-border);
}

.question-header {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.question-number {
  font-weight: 700;
  color: var(--color-primary);
  font-size: 1.125rem;
}

.question-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-text);
  margin-bottom: 4px;
}

.question-type {
  font-size: 0.75rem;
  color: var(--color-text-muted);
}

.answer-count-header {
  font-size: 0.8125rem;
  color: var(--color-text-muted);
  margin-bottom: 12px;
}

.choice-breakdown-container {
  display: flex;
  align-items: center;
  gap: 36px;
  padding: 8px 0;
}

@media (max-width: 768px) {
  .choice-breakdown-container {
    flex-direction: column;
    align-items: stretch;
    gap: 20px;
  }
}

.choice-chart-col {
  flex-shrink: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 8px 12px;
}

.choice-list-col {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.choice-row {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.choice-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  font-size: 0.8125rem;
}

.choice-badge-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.choice-color-dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  flex-shrink: 0;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.08);
}

.choice-text {
  font-weight: 500;
  color: var(--color-text);
  word-break: break-word;
}

.choice-stat {
  color: var(--color-text-muted);
  font-size: 0.8125rem;
  white-space: nowrap;
}

.choice-bar-bg {
  height: 6px;
  background: var(--color-surface-2);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.choice-bar-fill {
  height: 100%;
  border-radius: var(--radius-full);
  transition: width 350ms cubic-bezier(0.4, 0, 0.2, 1);
}

.text-answers-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.text-answer-item {
  background: var(--color-surface-2);
  padding: 10px 14px;
  border-radius: var(--radius-md);
  font-size: 0.875rem;
  color: var(--color-text);
}

.no-text-answers {
  font-size: 0.8125rem;
  color: var(--color-text-muted);
  font-style: italic;
}

/* ─── Modal ──────────────────────────────────────────────── */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(4px);
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.modal-card {
  width: 100%;
  max-width: 650px;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-elevated);
  overflow: hidden;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--color-border);
  flex-shrink: 0;
}

.modal-title {
  font-size: 1.0625rem;
  font-weight: 700;
  color: var(--color-text);
}

.modal-sub {
  font-size: 0.8125rem;
  color: var(--color-text-muted);
  margin-top: 2px;
}

.modal-close {
  background: transparent;
  border: none;
  color: var(--color-text-muted);
  cursor: pointer;
  padding: 6px;
  border-radius: var(--radius-sm);
}

.modal-close:hover {
  background: var(--color-surface-2);
  color: var(--color-text);
}

.modal-card--lg {
  max-width: 900px;
  height: 85vh;
  max-height: 85vh;
}

.modal-body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 20px;
}

.modal-body--survey {
  padding: 18px 20px;
}

.surveyjs-display-wrapper {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 12px;
  overflow: visible !important;
  height: auto !important;
  min-height: 200px;
}

:deep(.surveyjs-display-wrapper .sd-root-modern),
:deep(.surveyjs-display-wrapper .sd-root-modern--full-container),
:deep(.surveyjs-display-wrapper .sd-container-modern),
:deep(.surveyjs-display-wrapper .sd-body),
:deep(.surveyjs-display-wrapper .sd-page) {
  height: auto !important;
  max-height: none !important;
  overflow: visible !important;
}

.survey-render-loading {
  padding: 32px;
  text-align: center;
  color: var(--color-text-muted);
}

.response-meta-box {
  display: flex;
  align-items: center;
  flex-wrap: nowrap;
  gap: 16px;
  padding: 8px 14px;
  background: var(--color-surface-2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  flex-shrink: 0;
  overflow-x: auto;
}

.meta-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 28px;
  white-space: nowrap;
  flex-shrink: 0;
}

.meta-k {
  font-size: 0.8125rem;
  color: var(--color-text-muted);
  font-weight: 500;
  line-height: 1;
}

.meta-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  height: 28px;
  padding: 0 10px;
  border-radius: var(--radius-sm);
  font-size: 0.8125rem;
  font-weight: 600;
  line-height: 1;
  border: 1px solid var(--color-border);
  box-sizing: border-box;
}

.meta-badge--neutral {
  background: var(--color-surface);
  color: var(--color-text);
  border-color: var(--color-border);
}

.meta-badge--success {
  background: rgba(16, 185, 129, 0.12);
  border-color: rgba(16, 185, 129, 0.3);
  color: #10b981;
}

.meta-badge--warning {
  background: rgba(245, 158, 11, 0.12);
  border-color: rgba(245, 158, 11, 0.3);
  color: #f59e0b;
}

[data-theme='dark'] .meta-badge--neutral {
  background: var(--color-surface);
  color: var(--color-text);
  border-color: var(--color-border);
}

[data-theme='dark'] .meta-badge--success {
  background: rgba(16, 185, 129, 0.18);
  border-color: rgba(16, 185, 129, 0.35);
  color: #34d399;
}

[data-theme='dark'] .meta-badge--warning {
  background: rgba(245, 158, 11, 0.18);
  border-color: rgba(245, 158, 11, 0.35);
  color: #fbbf24;
}

.answers-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.answer-item {
  border-bottom: 1px solid var(--color-border);
  padding-bottom: 12px;
}

.answer-item:last-child {
  border-bottom: none;
}

.answer-q-header {
  display: flex;
  gap: 6px;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-text);
  margin-bottom: 6px;
}

.answer-q-idx {
  color: var(--color-primary);
}

.answer-val {
  padding-left: 12px;
  font-size: 0.875rem;
}

.answer-text {
  color: var(--color-text);
}

.answer-tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.answer-tag {
  background: var(--color-surface-2);
  border: 1px solid var(--color-border);
  padding: 2px 8px;
  border-radius: var(--radius-sm);
  font-size: 0.8125rem;
}

.answer-empty {
  color: var(--color-text-muted);
  font-style: italic;
}

.modal-footer {
  padding: 14px 24px;
  border-top: 1px solid var(--color-border);
  display: flex;
  justify-content: flex-end;
  background: var(--color-surface-2);
}

/* ─── Buttons ────────────────────────────────────────────── */
.btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  border-radius: var(--radius-md);
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  border: 1px solid transparent;
  transition: all 150ms ease-out;
}

.btn:active {
  scale: 0.96;
}

.btn--primary {
  background: var(--color-primary);
  color: white;
}

.btn--primary:hover {
  background: var(--color-primary-600);
}

.btn--outline {
  background: var(--color-surface);
  border-color: var(--color-border);
  color: var(--color-text);
}

.btn--outline:hover {
  background: var(--color-surface-2);
  border-color: var(--color-border-hover);
}

.btn--sm {
  padding: 4px 10px;
  font-size: 0.8125rem;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  background: var(--color-surface);
  border: 1px dashed var(--color-border);
  border-radius: var(--radius-lg);
  text-align: center;
}

.empty-icon {
  color: var(--color-text-muted);
  margin-bottom: 12px;
  opacity: 0.5;
}

.empty-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-text);
  margin-bottom: 4px;
}

.empty-sub {
  font-size: 0.8125rem;
  color: var(--color-text-muted);
}

.spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>

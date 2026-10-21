<template>
  <div class="survey-list-page">
    <div class="page-header animate-in">
      <div>
        <h2 class="page-title">{{ t('surveys.title') }}</h2>
        <p class="page-sub">{{ t('common.total') }}: <strong class="tabular-nums">{{ total }}</strong> {{ t('common.items') }}</p>
      </div>
      <RouterLink to="/survey/admin/surveys/new" class="create-btn" id="btn-create-survey">
        <PlusIcon :size="16" />
        {{ t('surveys.createBtn') }}
      </RouterLink>
    </div>

    <!-- Filter bar -->
    <div class="filter-bar animate-in" style="animation-delay: 60ms">
      <input
        v-model="search"
        type="search"
        :placeholder="t('surveys.searchPlaceholder')"
        class="search-input"
        id="input-search-surveys"
      />
      <div class="filter-selects">
        <CustomSelect
          v-model="filter"
          :options="statusOptions"
          style="min-width: 160px;"
        />
        <CustomSelect
          v-model="deptFilter"
          :options="deptSelectOptions"
          style="min-width: 175px;"
        />
      </div>
    </div>

    <!-- Table -->
    <div class="table-card animate-in" style="animation-delay: 120ms">
      <div v-if="loading" class="table-loading">
        <div class="spinner" />
        <p>{{ t('common.loading') }}</p>
      </div>
      <table v-else class="survey-table">
        <thead>
          <tr>
            <th class="col-title">{{ t('surveys.colTitle') }}</th>
            <th class="col-dept">{{ t('surveys.colDept') }}</th>
            <th class="col-slug">Slug / URL</th>
            <th class="col-number">{{ t('surveys.colResponses') }}</th>
            <th class="col-status">{{ t('surveys.colStatus') }}</th>
            <th class="col-date">{{ t('surveys.colCreatedAt') }}</th>
            <th class="col-actions">{{ t('surveys.colActions') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="filteredSurveys.length === 0">
            <td colspan="7" class="empty-row">{{ t('common.noData') }}</td>
          </tr>
          <tr v-for="survey in filteredSurveys" :key="survey.id" class="survey-row">
            <td>
              <div class="survey-name">
                <span class="survey-title-text">{{ survey.title }}</span>
                <span v-if="survey.creator_name" class="creator-name">bởi {{ survey.creator_name }}</span>
              </div>
            </td>
            <td>
              <span class="table-dept-badge">{{ survey.department || 'Chung' }}</span>
            </td>
            <td>
              <code class="slug-code">/survey/s/{{ survey.id }}</code>
            </td>
            <td class="col-number tabular-nums">{{ survey.response_count ?? 0 }}</td>
            <td>
              <StatusBadge :status="survey.is_active ? 'active' : 'inactive'" />
            </td>
            <td class="col-date tabular-nums">{{ formatDateTime24(survey.created_at) }}</td>
            <td class="col-actions">
              <div class="action-btns">
                <button
                  class="action-btn action-btn--copy"
                  @click="copyShareLink(survey)"
                  :title="copiedId === survey.id ? t('surveys.copied') : t('surveys.copyLink')"
                >
                  <CheckIcon v-if="copiedId === survey.id" :size="15" style="color: #22c55e;" />
                  <LinkIcon v-else :size="15" />
                </button>
                <RouterLink :to="`/survey/admin/surveys/${survey.id}/results`" class="action-btn" :title="t('surveys.results')">
                  <BarChart3Icon :size="15" />
                </RouterLink>
                <RouterLink :to="`/survey/admin/surveys/${survey.id}/edit`" class="action-btn" :title="t('surveys.edit')">
                  <EditIcon :size="15" />
                </RouterLink>
                <button
                  class="action-btn action-btn--toggle"
                  @click="toggleActive(survey)"
                  :title="survey.is_active ? 'Đóng khảo sát' : 'Mở khảo sát'"
                >
                  <component :is="survey.is_active ? EyeOffIcon : EyeIcon" :size="15" />
                </button>
                <button
                  class="action-btn action-btn--danger"
                  @click="confirmDelete(survey)"
                  :title="t('surveys.delete')"
                >
                  <Trash2Icon :size="15" />
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Delete confirm dialog -->
    <Transition name="fade">
      <div v-if="deleteTarget" class="dialog-overlay" @click.self="deleteTarget = null">
        <div class="dialog-card">
          <h3>{{ t('surveys.confirmDelete') }}</h3>
          <p>
            "<strong>{{ deleteTarget.title }}</strong>"<br />
            {{ t('surveys.deleteWarning') }}
          </p>
          <div class="dialog-actions">
            <button class="dialog-btn" @click="deleteTarget = null">{{ t('common.cancel') }}</button>
            <button class="dialog-btn dialog-btn--danger" @click="doDelete">{{ t('common.delete') }}</button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { PlusIcon, BarChart3Icon, EditIcon, EyeIcon, EyeOffIcon, Trash2Icon, LinkIcon, CheckIcon } from 'lucide-vue-next'
import { useSurveyStore } from '@/stores/surveys.js'
import { formatDateTime24 } from '@/lib/utils.js'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import CustomSelect from '@/components/ui/CustomSelect.vue'

const { t } = useI18n()
const surveyStore = useSurveyStore()
const surveys = ref([])
const total = ref(0)
const loading = ref(true)
const search = ref('')
const filter = ref('all')
const deptFilter = ref('all')
const deleteTarget = ref(null)

const statusOptions = computed(() => [
  { label: t('common.all') + ' trạng thái', value: 'all' },
  { label: t('dashboard.filterActive'), value: 'active' },
  { label: t('dashboard.filterExpired'), value: 'inactive' },
])

const departmentOptions = computed(() => {
  const depts = new Set(['Chung', 'IT', 'HR', 'Sản xuất', 'Kế toán', 'Kinh doanh', 'Marketing', 'QA/QC', 'Hành chính'])
  for (const s of surveys.value) {
    if (s.department) depts.add(s.department)
  }
  return Array.from(depts)
})

const deptSelectOptions = computed(() => [
  { label: t('departments.all'), value: 'all' },
  ...departmentOptions.value.map(d => ({ label: d, value: d }))
])

const filteredSurveys = computed(() => {
  let list = surveys.value
  if (filter.value === 'active') list = list.filter(s => s.is_active)
  if (filter.value === 'inactive') list = list.filter(s => !s.is_active)
  if (deptFilter.value !== 'all') list = list.filter(s => (s.department || 'Chung') === deptFilter.value)
  if (search.value.trim()) {
    const q = search.value.toLowerCase()
    list = list.filter(s => s.title.toLowerCase().includes(q) || s.id.includes(q) || (s.department && s.department.toLowerCase().includes(q)))
  }
  return list
})

async function load() {
  loading.value = true
  try {
    const data = await surveyStore.fetchAllSurveys()
    surveys.value = data.surveys
    total.value = data.total
  } finally {
    loading.value = false
  }
}

async function toggleActive(survey) {
  await surveyStore.updateSurvey(survey.id, { isActive: !survey.is_active })
  survey.is_active = survey.is_active ? 0 : 1
}

function confirmDelete(survey) {
  deleteTarget.value = survey
}

async function doDelete() {
  if (!deleteTarget.value) return
  await surveyStore.deleteSurvey(deleteTarget.value.id)
  surveys.value = surveys.value.filter(s => s.id !== deleteTarget.value.id)
  deleteTarget.value = null
}

const copiedId = ref(null)
let copyTimer = null

async function copyShareLink(survey) {
  const url = `${window.location.origin}/survey/s/${survey.id}`
  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(url)
    } else {
      const textarea = document.createElement('textarea')
      textarea.value = url
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
    }
    copiedId.value = survey.id
    clearTimeout(copyTimer)
    copyTimer = setTimeout(() => {
      copiedId.value = null
    }, 2000)
  } catch (err) {
    console.error('Failed to copy link:', err)
  }
}

onMounted(load)
</script>


<style scoped>
.survey-list-page { display: flex; flex-direction: column; gap: 20px; }

.page-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
}

.page-title { font-size: 1.375rem; font-weight: 700; letter-spacing: -0.02em; }
.page-sub { font-size: 0.875rem; color: var(--color-text-muted); margin-top: 2px; }

.create-btn {
  display: inline-flex; align-items: center; gap: 6px;
  height: 32px;
  padding: 0 12px;
  background: var(--color-primary); color: white;
  border-radius: var(--radius-md);
  font-size: 0.8125rem; font-weight: 600;
  text-decoration: none;
  transition: background-color 150ms ease-out;
  white-space: nowrap;
}
@media (hover: hover) { .create-btn:hover { background: var(--color-primary-600); } }
.create-btn:not(:disabled):active { scale: 0.96; transition: scale 150ms ease-out; }

/* ─── Filter Bar ────────────────────────────────────────── */
.filter-bar { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; position: relative; z-index: 25; }
.filter-selects { display: flex; gap: 10px; align-items: center; }

.search-input {
  flex: 1;
  min-width: 220px;
  height: 32px;
  padding: 0 12px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  color: var(--color-text);
  font-size: 0.8125rem;
  font-family: inherit;
  outline: none;
  transition: border-color 150ms ease-out, box-shadow 150ms ease-out;
}
.search-input:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-muted);
}

.table-dept-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 26px;
  padding: 0 10px;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 500;
  line-height: 1;
  white-space: nowrap;
  border: 1px solid var(--color-border);
  background: var(--color-surface-2);
  color: var(--color-text);
  box-sizing: border-box;
}

/* ─── Table ─────────────────────────────────────────────── */
.table-card {
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-border);
  overflow: hidden;
}

.table-loading {
  display: flex; flex-direction: column; align-items: center; gap: 12px;
  padding: 60px;
  color: var(--color-text-muted); font-size: 0.875rem;
}

.survey-table {
  width: 100%; border-collapse: collapse;
  font-size: 0.875rem;
}

.survey-table th {
  text-align: left; padding: 12px 16px;
  font-size: 0.75rem; font-weight: 600;
  text-transform: uppercase; letter-spacing: 0.05em;
  color: var(--color-text-muted);
  border-bottom: 1px solid var(--color-border);
}

.survey-table td {
  padding: 14px 16px;
  color: var(--color-text);
  border-bottom: 1px solid var(--color-border);
  vertical-align: middle;
}

.survey-row:last-child td { border-bottom: none; }

@media (hover: hover) {
  .survey-row:hover td { background: var(--color-surface-2); }
}

.col-title {
  text-align: center;
  white-space: nowrap;
}

.col-dept {
  text-align: center;
  white-space: nowrap;
}

.col-slug {
  text-align: center;
  white-space: nowrap;
}

.col-number { text-align: center; }

.col-date { color: var(--color-text-muted); white-space: nowrap; }

.col-status { text-align: center; white-space: nowrap; }

.col-actions { text-align: center; white-space: nowrap; }

.survey-name { display: flex; flex-direction: column; gap: 2px; }
.survey-title-text { font-weight: 500; }
.creator-name { font-size: 0.75rem; color: var(--color-text-muted); }

.slug-code {
  font-family: 'SFMono-Regular', Consolas, monospace;
  font-size: 0.75rem;
  color: var(--color-text-muted);
  background: var(--color-surface-2);
  padding: 2px 6px;
  border-radius: var(--radius-sm);
}

.empty-row { text-align: center; color: var(--color-text-subtle); padding: 40px; }

/* ─── Action buttons ──────────────────────────────────── */
.action-btns { display: flex; gap: 4px; align-items: center; }

.action-btn {
  width: 32px; height: 32px;
  border: none; background: transparent; cursor: pointer;
  border-radius: var(--radius-sm);
  display: inline-flex; align-items: center; justify-content: center;
  color: var(--color-text-muted);
  transition: background-color 150ms ease-out, color 150ms ease-out;
  text-decoration: none;
  flex-shrink: 0;
}

@media (hover: hover) {
  .action-btn:hover { background: var(--color-surface-2); color: var(--color-text); }
  .action-btn--danger:hover { background: var(--color-danger-bg); color: var(--color-danger); }
}

/* ─── Delete Dialog ────────────────────────────────────── */
.dialog-overlay {
  position: fixed; inset: 0;
  background: oklch(0 0 0 / 0.4);
  display: flex; align-items: center; justify-content: center;
  z-index: 100; padding: 24px;
}

.dialog-card {
  background: var(--color-surface);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-elevated);
  padding: 28px;
  max-width: 400px; width: 100%;
  display: flex; flex-direction: column; gap: 16px;
}

.dialog-card h3 { font-size: 1.125rem; font-weight: 700; }
.dialog-card p { font-size: 0.9375rem; color: var(--color-text-muted); line-height: 1.5; }

.dialog-actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 4px; }

.dialog-btn {
  padding: 8px 16px;
  border-radius: var(--radius-md);
  font-size: 0.875rem; font-weight: 600; font-family: inherit;
  cursor: pointer; border: 1px solid var(--color-border);
  background: var(--color-surface); color: var(--color-text);
  transition: background-color 150ms ease-out;
}

.dialog-btn--danger {
  background: var(--color-danger); color: white; border-color: transparent;
}

.dialog-btn:not(:disabled):active { scale: 0.96; transition: scale 150ms ease-out; }

.badge--dept {
  display: inline-block;
  background: var(--color-surface-2);
  color: var(--color-primary);
  border: 1px solid var(--color-border);
  font-weight: 600;
  padding: 3px 8px;
  border-radius: var(--radius-sm);
  font-size: 0.75rem;
}

.fade-enter-active, .fade-leave-active { transition: opacity 150ms ease-out; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.spinner {
  width: 32px; height: 32px;
  border: 3px solid var(--color-border);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 600ms linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
</style>

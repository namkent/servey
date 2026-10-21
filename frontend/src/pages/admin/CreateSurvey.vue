<template>
  <div class="survey-editor-page">
    <!-- Top Bar -->
    <div class="editor-topbar animate-in">
      <div class="topbar-left">
        <RouterLink to="/survey/admin/surveys" class="back-link">
          <ArrowLeftIcon :size="16" /> {{ t('common.back') }}
        </RouterLink>
        <h2 class="editor-title">{{ t('surveys.createTitle') }}</h2>
      </div>

      <div class="topbar-actions">
        <Transition name="fade">
          <div v-if="saveError" class="topbar-error" role="alert">
            <AlertCircleIcon :size="15" /> {{ saveError }}
          </div>
        </Transition>
        <RouterLink to="/survey/admin/surveys" class="btn btn--outline">{{ t('common.cancel') }}</RouterLink>
        <button class="btn btn--primary" @click="saveSurvey" :disabled="saving" id="btn-save-survey">
          <span v-if="saving" class="btn-spinner" />
          <SaveIcon v-else :size="16" />
          {{ saving ? t('common.saving') : t('common.saveAndPublish') }}
        </button>
      </div>
    </div>

    <!-- Main Two-Column Layout -->
    <div class="editor-layout animate-in" style="animation-delay: 60ms">
      <!-- Left Panel: Survey Meta Info -->
      <aside class="editor-sidebar card">
        <div class="sidebar-header">
          <h3 class="sidebar-title">{{ t('surveys.infoTitle') }}</h3>
          <p class="sidebar-sub">{{ t('surveys.infoSub') }}</p>
        </div>

        <div class="sidebar-body">
          <!-- Title -->
          <div class="form-group">
            <label class="form-label" for="input-title">
              {{ t('surveys.nameLabel') }} <span class="required">*</span>
            </label>
            <input
              id="input-title"
              v-model="form.title"
              type="text"
              class="form-input"
              :placeholder="t('surveys.namePlaceholder')"
              @input="generateSlug"
            />
          </div>

          <!-- Slug -->
          <div class="form-group">
            <label class="form-label" for="input-slug">
              {{ t('surveys.slugLabel') }}
              <span class="label-hint">{{ t('surveys.slugHint') }}</span>
            </label>
            <div class="slug-input-wrapper">
              <span class="slug-prefix">/survey/s/</span>
              <input
                id="input-slug"
                v-model="form.slug"
                type="text"
                class="form-input slug-input"
                placeholder="khao-sat-hai-long"
              />
            </div>
          </div>

          <!-- Department -->
          <div class="form-group">
            <label class="form-label">
              {{ t('surveys.deptLabel') }} <span class="required">*</span>
            </label>
            <CustomSelect
              v-model="form.department"
              :options="deptSelectOptions"
              :placeholder="t('surveys.chooseDept')"
              style="width: 100%;"
            />
            <span v-if="authStore.isManager" class="label-hint">
              {{ t('surveys.deptHint') }}: {{ allowedDeptsText }}
            </span>
          </div>

          <!-- Description -->
          <div class="form-group">
            <label class="form-label" for="input-description">{{ t('surveys.descLabel') }}</label>
            <textarea
              id="input-description"
              v-model="form.description"
              class="form-input form-textarea"
              :placeholder="t('surveys.descPlaceholder')"
              rows="3"
            />
          </div>

          <!-- Expiry Date -->
          <div class="form-group">
            <label class="form-label" for="input-expires">{{ t('surveys.expiryLabel') }}</label>
            <input
              id="input-expires"
              v-model="form.expiresAt"
              type="datetime-local"
              class="form-input"
            />
          </div>

          <!-- Public Checkbox -->
          <div class="form-group">
            <label class="checkbox-label">
              <input v-model="form.isPublic" type="checkbox" class="checkbox" />
              <div>
                <span class="checkbox-title">{{ t('surveys.publicCheckbox') }}</span>
                <p class="checkbox-desc">{{ t('surveys.publicDesc') }}</p>
              </div>
            </label>
          </div>
        </div>

        <!-- Sidebar Footer Action -->
        <div class="sidebar-footer">
          <button class="btn btn--primary btn--full" @click="saveSurvey" :disabled="saving">
            <span v-if="saving" class="btn-spinner" />
            <SaveIcon v-else :size="16" />
            {{ saving ? t('common.saving') : t('common.saveAndPublish') }}
          </button>
        </div>
      </aside>

      <!-- Right Panel: SurveyJS Designer -->
      <main class="editor-main">
        <div class="creator-wrapper">
          <SurveyCreatorComponent :model="creator" />
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ArrowLeftIcon, AlertCircleIcon, SaveIcon } from 'lucide-vue-next'
import { SurveyCreatorModel } from 'survey-creator-core'
import { SurveyCreatorComponent } from 'survey-creator-vue'
import 'survey-creator-core/survey-creator-core.min.css'
import { useSurveyStore } from '@/stores/surveys.js'
import { useAuthStore } from '@/stores/auth.js'
import { getCreatorOptions } from '@/lib/surveyTheme.js'
import api from '@/lib/axios.js'
import { onMounted } from 'vue'

const { t } = useI18n()
const router = useRouter()
const surveyStore = useSurveyStore()
const authStore = useAuthStore()

const surveyShortId = ref(Math.random().toString(36).substring(2, 7))

const dynamicDepartments = ref([
  'Chung', 'IT', 'HR', 'Sản xuất', 'Kế toán',
  'Kinh doanh', 'Marketing', 'QA/QC', 'Hành chính', 'Ban giám đốc'
])

onMounted(async () => {
  try {
    const { data } = await api.get('/admin/departments')
    if (data.departments) {
      dynamicDepartments.value = data.departments
    }
  } catch (e) {
    console.error('Failed to load departments:', e)
  }
})

const availableDepartments = computed(() => {
  if (authStore.isAdmin) return dynamicDepartments.value
  if (authStore.isManager) {
    const userDepts = authStore.userDepartments
    return userDepts.length > 0 ? userDepts : ['Chung']
  }
  return ['Chung']
})

const deptSelectOptions = computed(() => {
  return availableDepartments.value.map(d => ({ label: d, value: d }))
})

const allowedDeptsText = computed(() => {
  return authStore.userDepartments.join(', ') || 'Chưa gán phòng ban'
})

const form = ref({
  title: '',
  slug: '',
  department: availableDepartments.value[0] || 'Chung',
  description: '',
  expiresAt: '',
  isPublic: true,
})

const saving = ref(false)
const saveError = ref('')
const creator = new SurveyCreatorModel(getCreatorOptions())

function generateSlug() {
  if (!form.value.title) { form.value.slug = ''; return }
  const base = form.value.title.toLowerCase()
    .replace(/[àáảãạăắặằẳẵâấầẩẫậèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵđ]/g, c => {
      const map = 'aaaaaaaaaaaaaaaaaeeeeeeeeeeeiiiiiooooooooooooooooouuuuuuuuuuuyyyyyd'
      const vi = 'àáảãạăắặằẳẵâấầẩẫậèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵđ'
      return map[vi.indexOf(c)] || c
    })
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 60)
  form.value.slug = base ? `${base}-${surveyShortId.value}` : surveyShortId.value
}

async function saveSurvey() {
  saveError.value = ''
  if (!form.value.title.trim()) {
    saveError.value = t('surveys.validationTitle')
    return
  }

  const schema = creator.JSON
  if (!schema || Object.keys(schema).length === 0) {
    saveError.value = t('surveys.validationQuestions')
    return
  }

  saving.value = true
  try {
    schema.title = form.value.title
    schema.description = form.value.description

    const survey = await surveyStore.createSurvey({
      title: form.value.title,
      slug: form.value.slug || null,
      department: form.value.department || 'Chung',
      description: form.value.description || null,
      schema,
      isPublic: form.value.isPublic,
      expiresAt: form.value.expiresAt || null,
    })

    router.push(`/survey/admin/surveys/${survey.id}/results`)
  } catch (err) {
    saveError.value = err.response?.data?.error || err.message || 'Lưu thất bại.'
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.survey-editor-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* ─── Topbar ─────────────────────────────────────────────── */
.editor-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.topbar-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.8125rem;
  color: var(--color-text-muted);
  text-decoration: none;
  font-weight: 500;
  transition: color 150ms ease-out;
}

.back-link:hover {
  color: var(--color-primary);
}

.editor-title {
  font-size: 1.375rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--color-text);
}

.topbar-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.topbar-error {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: var(--color-danger-bg);
  color: var(--color-danger);
  border-radius: var(--radius-md);
  font-size: 0.8125rem;
  font-weight: 500;
}

/* ─── Side-by-Side Layout ────────────────────────────────── */
.editor-layout {
  display: flex;
  gap: 16px;
  align-items: flex-start;
}

@media (max-width: 1024px) {
  .editor-layout {
    flex-direction: column;
  }
}

/* ─── Left Sidebar ───────────────────────────────────────── */
.editor-sidebar {
  width: 360px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-border);
  max-height: calc(100vh - 120px);
  overflow-y: auto;
}

@media (max-width: 1024px) {
  .editor-sidebar {
    width: 100%;
    max-height: none;
  }
}

.sidebar-header {
  padding: 16px 20px;
  border-bottom: 1px solid var(--color-border);
}

.sidebar-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-text);
}

.sidebar-sub {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  margin-top: 2px;
}

.sidebar-body {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  flex: 1;
}

.sidebar-footer {
  padding: 16px 20px;
  border-top: 1px solid var(--color-border);
  background: var(--color-surface-2);
}

/* ─── Form Inputs ────────────────────────────────────────── */
.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-label {
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--color-text);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.required {
  color: var(--color-danger);
}

.label-hint {
  font-size: 0.6875rem;
  font-weight: 400;
  color: var(--color-text-muted);
}

.form-input {
  width: 100%;
  padding: 8px 12px;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  background: var(--color-bg);
  color: var(--color-text);
  font-size: 0.84375rem;
  font-family: inherit;
  transition: border-color 150ms ease-out, box-shadow 150ms ease-out;
}

.form-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px oklch(from var(--color-primary) l c h / 0.15);
}

.form-textarea {
  resize: vertical;
  min-height: 70px;
}

.slug-input-wrapper {
  display: flex;
  align-items: center;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-bg);
  overflow: hidden;
}

.slug-prefix {
  padding: 8px 0 8px 10px;
  font-size: 0.75rem;
  color: var(--color-text-muted);
  font-family: monospace;
  user-select: none;
}

.slug-input {
  border: none !important;
  box-shadow: none !important;
  font-family: monospace;
  font-size: 0.75rem !important;
  padding-left: 2px;
}

.checkbox-label {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  cursor: pointer;
  padding: 4px 0;
}

.checkbox {
  width: 16px;
  height: 16px;
  margin-top: 2px;
  accent-color: var(--color-primary);
  cursor: pointer;
}

.checkbox-title {
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--color-text);
  display: block;
}

.checkbox-desc {
  font-size: 0.6875rem;
  color: var(--color-text-muted);
  margin-top: 1px;
}

/* ─── Right Designer Panel ───────────────────────────────── */
.editor-main {
  flex: 1;
  min-width: 0;
}

.creator-wrapper {
  height: calc(100vh - 120px);
  min-height: 600px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-border);
}

/* ─── Buttons ────────────────────────────────────────────── */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: var(--radius-md);
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  border: 1px solid transparent;
  transition: all 150ms ease-out;
  text-decoration: none;
}

.btn:active { scale: 0.96; }

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
}

.btn--full {
  width: 100%;
}

.btn-spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.4);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 600ms linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

.fade-enter-active, .fade-leave-active { transition: opacity 150ms ease-out; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>

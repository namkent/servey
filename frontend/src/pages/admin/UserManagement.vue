<template>
  <div class="user-management-page">
    <!-- Header -->
    <div class="page-header animate-in">
      <div>
        <h2 class="page-title">{{ t('userMgmt.title') }}</h2>
        <p class="page-sub">
          {{ t('userMgmt.subtitle') }}
        </p>
      </div>
      <div class="header-actions-group">
        <button
          class="table-btn-action table-btn-action--dept-mgr"
          @click="deptModalOpen = true"
          :title="t('deptMgmt.modalTitle')"
        >
          <Building2Icon :size="14" />
          <span>{{ t('deptMgmt.btnManage') }}</span>
        </button>

        <span class="stat-pill">
          {{ t('userMgmt.totalCount', { count: total }) }}
        </span>
      </div>
    </div>

    <!-- Filters -->
    <div class="filter-bar animate-in" style="animation-delay: 50ms">
      <div class="search-wrap">
        <SearchIcon :size="16" class="search-icon" />
        <input
          v-model="search"
          type="search"
          :placeholder="t('userMgmt.searchPlaceholder')"
          class="search-input"
        />
      </div>

      <div class="filter-group">
        <CustomSelect
          v-model="roleFilter"
          :options="roleOptions"
          :placeholder="t('userMgmt.filterRole')"
          style="min-width: 160px;"
        />

        <CustomSelect
          v-model="deptFilter"
          :options="deptOptions"
          :placeholder="t('userMgmt.filterDept')"
          style="min-width: 175px;"
        />
      </div>
    </div>

    <!-- Table Card -->
    <div class="table-card animate-in" style="animation-delay: 100ms">
      <div v-if="loading" class="table-loading">
        <div class="spinner" />
        <p>{{ t('common.loading') }}</p>
      </div>

      <template v-else>
        <div class="table-wrapper">
          <table class="user-table">
            <thead>
              <tr>
                <th class="col-user">{{ t('userMgmt.colUser') }}</th>
                <th class="col-role">{{ t('userMgmt.colRole') }}</th>
                <th class="col-dept">{{ t('userMgmt.colDept') }}</th>
                <th class="col-provider">{{ t('userMgmt.colProvider') }}</th>
                <th class="col-date">{{ t('userMgmt.colCreatedAt') }}</th>
                <th class="col-actions">{{ t('userMgmt.colActions') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="filteredUsers.length === 0">
                <td colspan="6" class="empty-row">{{ t('common.noData') }}</td>
              </tr>
              <tr v-for="u in paginatedUsers" :key="u.id" class="user-row">
                <!-- User Info -->
                <td>
                  <div class="user-cell">
                    <div class="user-avatar">
                      <img v-if="u.avatar" :src="u.avatar" :alt="u.name" />
                      <span v-else>{{ getInitials(u.name) }}</span>
                    </div>
                    <div class="user-meta-text">
                      <div class="user-name">
                        {{ u.name }}
                        <span v-if="u.id === authStore.user?.id" class="self-tag">(Bạn)</span>
                      </div>
                      <div class="user-email">{{ u.email }}</div>
                    </div>
                  </div>
                </td>

                <!-- Role Badge (Unified style) -->
                <td>
                  <span class="table-badge" :class="`table-badge--role-${u.role}`">
                    <CrownIcon v-if="u.role === 'admin'" :size="13" />
                    <Building2Icon v-else-if="u.role === 'manager'" :size="13" />
                    <UserIcon v-else :size="13" />
                    <span>{{ getRoleLabel(u.role) }}</span>
                  </span>
                </td>

                <!-- Departments (Unified style) -->
                <td>
                  <div v-if="u.role === 'admin'" class="dept-wrap">
                    <span class="table-badge table-badge--dept-all">
                      <ShieldIcon :size="13" />
                      {{ t('departments.allBadge') }}
                    </span>
                  </div>
                  <div v-else-if="u.role === 'manager'" class="dept-tags">
                    <span
                      v-for="dept in getUserDepartments(u)"
                      :key="dept"
                      class="table-badge table-badge--dept"
                    >
                      {{ dept }}
                    </span>
                    <span v-if="getUserDepartments(u).length === 0" class="table-badge table-badge--dept-empty">
                      {{ t('departments.unassigned') }}
                    </span>
                  </div>
                  <span v-else class="text-muted text-sm">—</span>
                </td>

                <!-- Provider (Unified style) -->
                <td>
                  <span class="table-badge table-badge--provider">
                    {{ u.provider ? u.provider.toUpperCase() : 'OIDC' }}
                  </span>
                </td>

                <!-- Created Date YYYY-MM-DD HH:MM -->
                <td class="col-date tabular-nums">
                  {{ formatDateTime24(u.created_at) }}
                </td>

                <!-- Actions -->
                <td class="col-actions">
                  <button
                    class="table-btn-action"
                    @click="openEditModal(u)"
                    :title="t('userMgmt.btnAssign')"
                  >
                    <ShieldIcon :size="13" />
                    <span>{{ t('userMgmt.btnAssign') }}</span>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination Bar (max 10 users / page) -->
        <div class="pagination-bar" v-if="filteredUsers.length > 0">
          <div class="pagination-info">
            {{ t('userMgmt.showing', {
              from: (currentPage - 1) * pageSize + 1,
              to: Math.min(currentPage * pageSize, filteredUsers.length),
              total: filteredUsers.length
            }) }}
          </div>

          <div class="pagination-controls" v-if="totalPages > 1">
            <button
              class="pagination-btn"
              :disabled="currentPage === 1"
              @click="currentPage--"
              :title="t('common.prev')"
            >
              <ChevronLeftIcon :size="14" />
              <span>{{ t('common.prev') }}</span>
            </button>

            <div class="page-numbers">
              <button
                v-for="p in totalPages"
                :key="p"
                class="page-num-btn"
                :class="{ 'page-num-btn--active': p === currentPage }"
                @click="currentPage = p"
              >
                {{ p }}
              </button>
            </div>

            <button
              class="pagination-btn"
              :disabled="currentPage === totalPages"
              @click="currentPage++"
              :title="t('common.next')"
            >
              <span>{{ t('common.next') }}</span>
              <ChevronRightIcon :size="14" />
            </button>
          </div>
        </div>
      </template>
    </div>

    <!-- Edit Role & Department Modal -->
    <Transition name="fade">
      <div v-if="editingUser" class="modal-backdrop" @click.self="editingUser = null">
        <div class="modal-card">
          <div class="modal-header">
            <div>
              <h3 class="modal-title">{{ t('userMgmt.modalTitle') }}</h3>
              <p class="modal-sub">{{ t('userMgmt.modalSubtitle') }}</p>
            </div>
            <button class="modal-close" @click="editingUser = null">
              <XIcon :size="18" />
            </button>
          </div>

          <div class="modal-body">
            <!-- User summary -->
            <div class="modal-user-summary">
              <div class="user-avatar user-avatar--lg">
                <img v-if="editingUser.avatar" :src="editingUser.avatar" :alt="editingUser.name" />
                <span v-else>{{ getInitials(editingUser.name) }}</span>
              </div>
              <div>
                <h4 class="summary-name">{{ editingUser.name }}</h4>
                <p class="summary-email">{{ editingUser.email }}</p>
              </div>
            </div>

            <!-- Role Selection -->
            <div class="form-group">
              <label class="form-label">{{ t('userMgmt.selectRoleLabel') }}</label>
              <div class="role-options">
                <label
                  class="role-option-card"
                  :class="{ 'role-option-card--active': editForm.role === 'admin' }"
                >
                  <input type="radio" v-model="editForm.role" value="admin" class="sr-only" />
                  <div class="role-option-header">
                    <CrownIcon :size="18" class="role-icon role-icon--admin" />
                    <span class="role-option-title">{{ t('roles.admin') }}</span>
                  </div>
                  <p class="role-option-desc">Toàn quyền hệ thống, xem và quản lý tất cả phòng ban và người dùng</p>
                </label>

                <label
                  class="role-option-card"
                  :class="{ 'role-option-card--active': editForm.role === 'manager' }"
                >
                  <input type="radio" v-model="editForm.role" value="manager" class="sr-only" />
                  <div class="role-option-header">
                    <Building2Icon :size="18" class="role-icon role-icon--manager" />
                    <span class="role-option-title">{{ t('roles.manager') }}</span>
                  </div>
                  <p class="role-option-desc">Được phép đăng bài, sửa bài và xem kết quả thuộc (các) phòng ban phụ trách</p>
                </label>

                <label
                  class="role-option-card"
                  :class="{ 'role-option-card--active': editForm.role === 'user' }"
                >
                  <input type="radio" v-model="editForm.role" value="user" class="sr-only" />
                  <div class="role-option-header">
                    <UserIcon :size="18" class="role-icon role-icon--user" />
                    <span class="role-option-title">{{ t('roles.user') }}</span>
                  </div>
                  <p class="role-option-desc">Chỉ có quyền tham gia làm khảo sát trực tuyến</p>
                </label>
              </div>
            </div>

            <!-- Department Assignment (Only when Manager) -->
            <div v-if="editForm.role === 'manager'" class="form-group dept-assignment-group animate-in">
              <div class="dept-label-row">
                <label class="form-label">
                  {{ t('userMgmt.selectDeptLabel') }} <span class="required">*</span>
                </label>
                <button type="button" class="btn-link-action" @click="deptModalOpen = true">
                  <PlusIcon :size="13" /> {{ t('deptMgmt.linkManage') }}
                </button>
              </div>

              <div class="dept-checkbox-grid">
                <label
                  v-for="dept in availableDepartments"
                  :key="dept"
                  class="dept-checkbox-item"
                  :class="{ 'dept-checkbox-item--checked': editForm.departments.includes(dept) }"
                >
                  <input
                    type="checkbox"
                    :value="dept"
                    v-model="editForm.departments"
                    class="checkbox"
                  />
                  <span>{{ dept }}</span>
                </label>
              </div>
            </div>

            <div v-if="saveError" class="modal-error">
              <AlertCircleIcon :size="15" />
              {{ saveError }}
            </div>
          </div>

          <!-- Modal footer with explicit polished styles -->
          <div class="modal-footer">
            <button type="button" class="btn btn--outline" @click="editingUser = null" :disabled="saving">
              {{ t('common.cancel') }}
            </button>
            <button type="button" class="btn btn--primary" @click="saveUserRole" :disabled="saving">
              <span v-if="saving" class="spinner-sm" />
              <SaveIcon v-else :size="15" />
              {{ saving ? t('common.saving') : t('userMgmt.saveRole') }}
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Department Management Modal (Sửa / Xoá / Thêm phòng ban) -->
    <Transition name="fade">
      <div v-if="deptModalOpen" class="modal-backdrop" @click.self="deptModalOpen = false">
        <div class="modal-card modal-card--dept">
          <div class="modal-header">
            <div>
              <h3 class="modal-title">{{ t('deptMgmt.modalTitle') }}</h3>
              <p class="modal-sub">{{ t('deptMgmt.modalSubtitle') }}</p>
            </div>
            <button class="modal-close" @click="deptModalOpen = false">
              <XIcon :size="18" />
            </button>
          </div>

          <div class="modal-body">
            <!-- Add new department form -->
            <form @submit.prevent="createDepartment" class="dept-add-form">
              <input
                v-model="newDeptName"
                type="text"
                :placeholder="t('deptMgmt.inputPlaceholder')"
                class="form-input dept-add-input"
                :disabled="deptLoading"
              />
              <button
                type="submit"
                class="btn btn--primary"
                :disabled="!newDeptName.trim() || deptLoading"
              >
                <PlusIcon :size="15" />
                <span>{{ t('deptMgmt.addBtn') }}</span>
              </button>
            </form>

            <div v-if="deptError" class="modal-error">
              <AlertCircleIcon :size="15" />
              {{ deptError }}
            </div>

            <!-- Department list -->
            <div class="dept-list-table">
              <div
                v-for="dept in availableDepartments"
                :key="dept"
                class="dept-row-item"
              >
                <!-- View Mode -->
                <template v-if="editingDeptName !== dept">
                  <div class="dept-name-block">
                    <span class="dept-name-text">{{ dept }}</span>
                    <span v-if="dept === 'Chung'" class="dept-default-pill">{{ t('deptMgmt.defaultPill') }}</span>
                  </div>

                  <div class="dept-actions" v-if="dept !== 'Chung'">
                    <button
                      class="icon-action-btn"
                      @click="startEditDept(dept)"
                      :title="t('deptMgmt.editTitle')"
                    >
                      <EditIcon :size="14" />
                    </button>
                    <button
                      class="icon-action-btn icon-action-btn--danger"
                      @click="deleteDepartment(dept)"
                      :title="t('deptMgmt.deleteTitle')"
                    >
                      <Trash2Icon :size="14" />
                    </button>
                  </div>
                  <div v-else class="dept-actions text-muted text-xs">
                    {{ t('deptMgmt.cannotDelete') }}
                  </div>
                </template>

                <!-- Edit Mode -->
                <template v-else>
                  <div class="dept-edit-block">
                    <input
                      v-model="deptEditNewVal"
                      type="text"
                      class="form-input dept-edit-input"
                      @keyup.enter="saveEditDept(dept)"
                      @keyup.esc="cancelEditDept"
                      autofocus
                    />
                    <div class="dept-edit-btns">
                      <button
                        type="button"
                        class="btn btn--sm btn--primary"
                        @click="saveEditDept(dept)"
                        :disabled="!deptEditNewVal.trim() || deptLoading"
                      >
                        <CheckIcon :size="13" /> {{ t('common.save') }}
                      </button>
                      <button
                        type="button"
                        class="btn btn--sm btn--outline"
                        @click="cancelEditDept"
                        :disabled="deptLoading"
                      >
                        {{ t('common.cancel') }}
                      </button>
                    </div>
                  </div>
                </template>
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn btn--outline" @click="deptModalOpen = false">
              {{ t('common.close') }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import api from '@/lib/axios.js'
import { useAuthStore } from '@/stores/auth.js'
import { getInitials, formatDateTime24 } from '@/lib/utils.js'
import CustomSelect from '@/components/ui/CustomSelect.vue'
import {
  SearchIcon, CrownIcon, Building2Icon, UserIcon,
  ShieldIcon, XIcon, SaveIcon, AlertCircleIcon,
  ChevronLeftIcon, ChevronRightIcon, PlusIcon, EditIcon,
  Trash2Icon, CheckIcon
} from 'lucide-vue-next'

const { t } = useI18n()
const authStore = useAuthStore()

const loading = ref(true)
const users = ref([])
const total = ref(0)
const search = ref('')
const roleFilter = ref('all')
const deptFilter = ref('all')

const currentPage = ref(1)
const pageSize = 10

const availableDepartments = ref([])

// Department Management Modal State
const deptModalOpen = ref(false)
const newDeptName = ref('')
const deptLoading = ref(false)
const deptError = ref('')
const editingDeptName = ref(null)
const deptEditNewVal = ref('')

const roleOptions = computed(() => [
  { label: t('userMgmt.filterRole'), value: 'all' },
  { label: t('roles.admin'), value: 'admin' },
  { label: t('roles.manager'), value: 'manager' },
  { label: t('roles.user'), value: 'user' },
])

const deptOptions = computed(() => [
  { label: t('userMgmt.filterDept'), value: 'all' },
  ...availableDepartments.value.map(d => ({ label: d, value: d }))
])

// Edit user modal state
const editingUser = ref(null)
const editForm = ref({
  role: 'user',
  departments: [],
})
const saving = ref(false)
const saveError = ref('')

function getUserDepartments(u) {
  if (u.departmentsList && Array.isArray(u.departmentsList)) return u.departmentsList
  if (u.departments) {
    try {
      const parsed = JSON.parse(u.departments)
      if (Array.isArray(parsed)) return parsed
    } catch {
      return u.departments.split(',').map(d => d.trim()).filter(Boolean)
    }
  }
  if (u.department) return [u.department]
  return []
}

function getRoleLabel(role) {
  if (role === 'admin') return t('roles.admin')
  if (role === 'manager') return t('roles.manager')
  return t('roles.user')
}

const filteredUsers = computed(() => {
  return users.value.filter(u => {
    // Role filter
    if (roleFilter.value !== 'all' && u.role !== roleFilter.value) return false

    // Department filter
    if (deptFilter.value !== 'all') {
      if (u.role === 'admin') return true // admin has all depts
      const userDepts = getUserDepartments(u)
      if (!userDepts.includes(deptFilter.value)) return false
    }

    // Search query
    if (search.value.trim()) {
      const q = search.value.toLowerCase().trim()
      const matchName = u.name?.toLowerCase().includes(q)
      const matchEmail = u.email?.toLowerCase().includes(q)
      if (!matchName && !matchEmail) return false
    }

    return true
  })
})

// Reset to page 1 on filter changes
watch([search, roleFilter, deptFilter], () => {
  currentPage.value = 1
})

const totalPages = computed(() => {
  return Math.ceil(filteredUsers.value.length / pageSize) || 1
})

const paginatedUsers = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return filteredUsers.value.slice(start, start + pageSize)
})

async function fetchUsers() {
  loading.value = true
  try {
    const { data } = await api.get('/admin/users')
    users.value = data.users || []
    total.value = data.total || 0
    if (data.availableDepartments) {
      availableDepartments.value = data.availableDepartments
    }
  } catch (err) {
    console.error('Failed to load users:', err)
  } finally {
    loading.value = false
  }
}

async function fetchDepartments() {
  try {
    const { data } = await api.get('/admin/departments')
    if (data.departments) {
      availableDepartments.value = data.departments
    }
  } catch (err) {
    console.error('Failed to load departments:', err)
  }
}

function openEditModal(userItem) {
  editingUser.value = userItem
  saveError.value = ''
  editForm.value = {
    role: userItem.role || 'user',
    departments: [...getUserDepartments(userItem)],
  }
}

async function saveUserRole() {
  saveError.value = ''

  if (editForm.value.role === 'manager' && editForm.value.departments.length === 0) {
    saveError.value = 'Vui lòng chọn ít nhất một phòng ban phụ trách cho Quản lý.'
    return
  }

  saving.value = true
  try {
    await api.put(`/admin/users/${editingUser.value.id}/role`, {
      role: editForm.value.role,
      departments: editForm.value.role === 'manager' ? editForm.value.departments : [],
      department: editForm.value.role === 'manager' && editForm.value.departments.length > 0 ? editForm.value.departments[0] : '',
    })

    // Update in local array
    const idx = users.value.findIndex(u => u.id === editingUser.value.id)
    if (idx !== -1) {
      users.value[idx].role = editForm.value.role
      users.value[idx].departmentsList = editForm.value.role === 'manager' ? [...editForm.value.departments] : []
      users.value[idx].departments = JSON.stringify(editForm.value.departments)
      users.value[idx].department = editForm.value.departments[0] || ''
    }

    editingUser.value = null
  } catch (err) {
    saveError.value = err.response?.data?.error || err.message || 'Lưu thất bại.'
  } finally {
    saving.value = false
  }
}

/* ─── Department Management Actions ─────────────────────── */
async function createDepartment() {
  const name = newDeptName.value.trim()
  if (!name) return
  deptError.value = ''
  deptLoading.value = true
  try {
    const { data } = await api.post('/admin/departments', { name })
    if (data.departments) {
      availableDepartments.value = data.departments
    } else {
      await fetchDepartments()
    }
    newDeptName.value = ''
  } catch (err) {
    deptError.value = err.response?.data?.error || err.message || t('deptMgmt.addFailed')
  } finally {
    deptLoading.value = false
  }
}

function startEditDept(dept) {
  editingDeptName.value = dept
  deptEditNewVal.value = dept
}

function cancelEditDept() {
  editingDeptName.value = null
  deptEditNewVal.value = ''
}

async function saveEditDept(oldName) {
  const newName = deptEditNewVal.value.trim()
  if (!newName || newName === oldName) {
    cancelEditDept()
    return
  }
  deptError.value = ''
  deptLoading.value = true
  try {
    const { data } = await api.put(`/admin/departments/${encodeURIComponent(oldName)}`, { newName })
    if (data.departments) {
      availableDepartments.value = data.departments
    } else {
      await fetchDepartments()
    }
    await fetchUsers()
    cancelEditDept()
  } catch (err) {
    deptError.value = err.response?.data?.error || err.message || t('deptMgmt.updateFailed')
  } finally {
    deptLoading.value = false
  }
}

async function deleteDepartment(dept) {
  if (!confirm(t('deptMgmt.confirmDelete', { name: dept }))) {
    return
  }
  deptError.value = ''
  deptLoading.value = true
  try {
    const { data } = await api.delete(`/admin/departments/${encodeURIComponent(dept)}`)
    if (data.departments) {
      availableDepartments.value = data.departments
    } else {
      await fetchDepartments()
    }
    await fetchUsers()
  } catch (err) {
    deptError.value = err.response?.data?.error || err.message || t('deptMgmt.deleteFailed')
  } finally {
    deptLoading.value = false
  }
}

onMounted(() => {
  fetchUsers()
  fetchDepartments()
})
</script>

<style scoped>
.user-management-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
}

.page-title {
  font-size: 1.25rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--color-text);
}

.page-sub {
  font-size: 0.8125rem;
  color: var(--color-text-muted);
  margin-top: 2px;
}

.header-actions-group {
  display: flex;
  align-items: center;
  gap: 10px;
}

.stat-pill {
  padding: 5px 12px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--color-text);
}

.table-btn-action--dept-mgr {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  height: 32px;
  padding: 0 12px;
  border-radius: var(--radius-sm);
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--color-text);
}

/* ─── Filter Bar ─────────────────────────────────────────── */
.filter-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  position: relative;
  z-index: 25;
}

.search-wrap {
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
  pointer-events: none;
}

.search-input {
  width: 100%;
  height: 32px;
  padding: 0 12px 0 36px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: 0.8125rem;
  color: var(--color-text);
  font-family: inherit;
  transition: all 150ms ease-out;
}

.search-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px oklch(from var(--color-primary) l c h / 0.15);
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 10px;
}

/* ─── Table ──────────────────────────────────────────────── */
.table-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-card);
  display: flex;
  flex-direction: column;
}

.table-wrapper {
  overflow-x: auto;
}

.user-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.8125rem;
  text-align: left;
}

.user-table th {
  padding: 10px 14px;
  background: var(--color-surface-2);
  color: var(--color-text-muted);
  font-weight: 600;
  font-size: 0.6875rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 1px solid var(--color-border);
  white-space: nowrap;
}

.user-table td {
  padding: 8px 14px;
  border-bottom: 1px solid var(--color-border);
  vertical-align: middle;
}

.user-row:last-child td {
  border-bottom: none;
}

.user-row:hover {
  background: oklch(from var(--color-surface-2) l c h / 0.5);
}

.empty-row {
  text-align: center;
  padding: 40px !important;
  color: var(--color-text-muted);
}

.table-loading {
  padding: 48px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  color: var(--color-text-muted);
  font-size: 0.8125rem;
}

/* User cell */
.user-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}

.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--color-primary-100);
  color: var(--color-primary);
  font-weight: 700;
  font-size: 0.8125rem;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  flex-shrink: 0;
  border: 1px solid var(--color-border);
}

.user-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.user-avatar--lg {
  width: 44px;
  height: 44px;
  font-size: 1rem;
}

.user-meta-text {
  min-width: 0;
}

.user-name {
  font-weight: 600;
  color: var(--color-text);
  font-size: 0.8125rem;
  white-space: nowrap;
}

.self-tag {
  font-size: 0.6875rem;
  color: var(--color-primary);
  font-weight: 600;
  margin-left: 4px;
}

.user-email {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  white-space: nowrap;
}

/* ─── UNIFIED BADGE STYLE ─────────────────────────────────── */
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

/* Role badge variations */
.table-badge--role-admin {
  background: rgba(168, 85, 247, 0.1);
  border-color: rgba(168, 85, 247, 0.3);
  color: #c084fc;
}

.table-badge--role-manager {
  background: rgba(59, 130, 246, 0.1);
  border-color: rgba(59, 130, 246, 0.3);
  color: #60a5fa;
}

.table-badge--role-user {
  background: var(--color-surface-2);
  border-color: var(--color-border);
  color: var(--color-text-muted);
}

/* Department badge variations */
.dept-wrap {
  display: inline-flex;
}

.dept-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.table-badge--dept-all {
  background: rgba(59, 130, 246, 0.08);
  border-color: var(--color-border);
  color: var(--color-text);
}

.table-badge--dept {
  background: var(--color-surface-2);
  border-color: var(--color-border);
  color: var(--color-text);
}

.table-badge--dept-empty {
  border: 1px dashed var(--color-border);
  background: transparent;
  color: var(--color-text-subtle);
  font-style: italic;
}

/* Provider badge */
.table-badge--provider {
  background: var(--color-surface-2);
  border-color: var(--color-border);
  color: var(--color-text-muted);
  letter-spacing: 0.04em;
  font-weight: 600;
}

/* Action button matching table badge geometry */
.table-btn-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  height: 32px;
  padding: 0 10px;
  border-radius: var(--radius-sm);
  font-size: 0.75rem;
  font-weight: 500;
  line-height: 1;
  white-space: nowrap;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  color: var(--color-text);
  cursor: pointer;
  transition: all 120ms ease-out;
  box-sizing: border-box;
}

@media (hover: hover) {
  .table-btn-action:hover {
    background: var(--color-surface-2);
    border-color: var(--color-text-subtle);
    color: var(--color-primary);
  }
}

.table-btn-action:active {
  transform: scale(0.97);
}

.col-user {
  text-align: center;
  white-space: nowrap;
}

.col-role {
  text-align: center;
  white-space: nowrap;
}

.col-dept {
  text-align: center;
  white-space: nowrap;
}

.col-provider {
  text-align: center;
  white-space: nowrap;
} 

.col-date {
  color: var(--color-text-muted);
  text-align: center;
  white-space: nowrap;
}

.col-actions {
  text-align: center;
  white-space: nowrap;
}

/* ─── Pagination Bar ─────────────────────────────────────── */
.pagination-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  border-top: 1px solid var(--color-border);
  background: var(--color-surface);
  font-size: 0.75rem;
  color: var(--color-text-muted);
  gap: 12px;
  flex-wrap: wrap;
}

.pagination-controls {
  display: flex;
  align-items: center;
  gap: 6px;
}

.pagination-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 32px;
  padding: 0 10px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  color: var(--color-text);
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 120ms ease-out;
}

@media (hover: hover) {
  .pagination-btn:hover:not(:disabled) {
    background: var(--color-surface-2);
    border-color: var(--color-text-subtle);
  }
}

.pagination-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.page-numbers {
  display: flex;
  align-items: center;
  gap: 4px;
}

.page-num-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  color: var(--color-text);
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 120ms ease-out;
}

@media (hover: hover) {
  .page-num-btn:hover:not(.page-num-btn--active) {
    background: var(--color-surface-2);
  }
}

.page-num-btn--active {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: #fff;
  font-weight: 600;
}

/* ─── Modal ──────────────────────────────────────────────── */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.65);
  backdrop-filter: blur(4px);
  z-index: 60;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}

.modal-card {
  width: 100%;
  max-width: 520px;
  max-height: 85vh;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-elevated);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-card--dept {
  max-width: 560px;
}

.modal-header {
  display: flex;
  align-items: flex-start;
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
  padding: 4px;
  border-radius: var(--radius-sm);
}

.modal-close:hover {
  background: var(--color-surface-2);
  color: var(--color-text);
}

.modal-body {
  padding: 18px 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}

.modal-user-summary {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  background: var(--color-surface-2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
}

.summary-name {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-text);
}

.summary-email {
  font-size: 0.75rem;
  color: var(--color-text-muted);
}

.role-options {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 6px;
}

.role-option-card {
  display: flex;
  flex-direction: column;
  padding: 10px 12px;
  background: var(--color-surface);
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 120ms ease-out;
}

@media (hover: hover) {
  .role-option-card:hover {
    background: var(--color-surface-2);
  }
}

.role-option-card--active {
  border-color: var(--color-primary);
  background: var(--color-primary-muted);
}

.role-option-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.role-option-title {
  font-weight: 600;
  font-size: 0.8125rem;
  color: var(--color-text);
}

.role-option-desc {
  font-size: 0.6875rem;
  color: var(--color-text-muted);
  margin-top: 3px;
  padding-left: 26px;
}

.role-icon {
  flex-shrink: 0;
}

.role-icon--admin {
  color: #a855f7;
}

.role-icon--manager {
  color: #3b82f6;
}

.role-icon--user {
  color: var(--color-text-muted);
}

.dept-label-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.btn-link-action {
  background: transparent;
  border: none;
  color: var(--color-primary);
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 4px;
  border-radius: var(--radius-sm);
}

.btn-link-action:hover {
  text-decoration: underline;
}

.dept-checkbox-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 6px;
  margin-top: 8px;
}

.dept-checkbox-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: 0.8125rem;
  transition: all 120ms ease-out;
}

.dept-checkbox-item--checked {
  border-color: var(--color-primary);
  background: var(--color-primary-muted);
  color: var(--color-primary);
  font-weight: 500;
}

.modal-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  padding: 12px 20px;
  border-top: 1px solid var(--color-border);
  background: var(--color-surface-2);
  flex-shrink: 0;
}

.modal-error {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: oklch(from var(--color-danger) l c h / 0.1);
  border: 1px solid var(--color-danger);
  border-radius: var(--radius-sm);
  color: var(--color-danger);
  font-size: 0.75rem;
}

/* ─── Department Management Modal Styles ──────────────────── */
.dept-add-form {
  display: flex;
  gap: 8px;
}

.dept-add-input {
  flex: 1;
  height: 32px;
  padding: 0 12px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-size: 0.8125rem;
  color: var(--color-text);
  font-family: inherit;
  outline: none;
}

.dept-add-input:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px oklch(from var(--color-primary) l c h / 0.15);
}

.dept-list-table {
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: 280px;
  overflow-y: auto;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: 6px;
  background: var(--color-surface);
}

.dept-row-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 10px;
  background: var(--color-surface-2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  gap: 8px;
}

.dept-name-block {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.dept-name-text {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--color-text);
  white-space: nowrap;
}

.dept-default-pill {
  font-size: 0.6875rem;
  font-weight: 500;
  padding: 1px 6px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  color: var(--color-text-muted);
}

.dept-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

.icon-action-btn {
  width: 26px;
  height: 26px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  color: var(--color-text-muted);
  cursor: pointer;
  transition: all 120ms ease-out;
}

@media (hover: hover) {
  .icon-action-btn:hover {
    background: var(--color-surface-2);
    color: var(--color-text);
  }
  .icon-action-btn--danger:hover {
    background: oklch(from var(--color-danger) l c h / 0.12);
    color: var(--color-danger);
    border-color: var(--color-danger);
  }
}

.dept-edit-block {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
}

.dept-edit-input {
  flex: 1;
  height: 30px;
  padding: 0 8px;
  font-size: 0.8125rem;
  background: var(--color-surface);
  border: 1px solid var(--color-primary);
  border-radius: var(--radius-sm);
  color: var(--color-text);
  outline: none;
}

.dept-edit-btns {
  display: flex;
  align-items: center;
  gap: 4px;
}
</style>

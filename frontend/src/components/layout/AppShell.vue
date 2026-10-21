<template>
  <div class="app-shell">
    <!-- Sidebar (Fixed 100vh, doesn't scroll when page scrolls) -->
    <aside class="sidebar" :class="{ 'sidebar--collapsed': sidebarCollapsed }">
      <div class="sidebar__header">
        <div class="sidebar__logo">
          <div class="logo-icon">
            <img src="/logo.svg" alt="MES Survey Logo" class="logo-img" />
          </div>
          <span class="logo-text">MES Survey</span>
        </div>
        <button
          class="sidebar__collapse-btn"
          @click="sidebarCollapsed = !sidebarCollapsed"
          :title="sidebarCollapsed ? t('nav.expand') : t('nav.collapse')"
        >
          <ChevronLeftIcon
            :size="16"
            :style="{
              transform: sidebarCollapsed ? 'rotate(180deg)' : 'none',
              transition: 'transform 200ms ease-out'
            }"
          />
        </button>
      </div>

      <nav class="sidebar__nav">
        <div class="nav-section">
          <RouterLink to="/survey" class="nav-item" :class="{ active: route.name === 'home' || route.name === 'admin-dashboard' }">
            <LayoutDashboardIcon :size="18" />
            <span class="nav-label">{{ t('nav.dashboard') }}</span>
          </RouterLink>
        </div>

        <div v-if="authStore.canManage" class="nav-section">
          <p class="nav-section-label">
            {{ authStore.isAdmin ? t('nav.adminSection') : t('nav.managerSection') }}
          </p>
          <RouterLink to="/survey/admin/surveys" class="nav-item" :class="{ active: route.path.includes('/admin/surveys') }">
            <FileTextIcon :size="18" />
            <span class="nav-label">{{ t('nav.manageSurveys') }}</span>
          </RouterLink>
          <RouterLink v-if="authStore.isAdmin" to="/survey/admin/users" class="nav-item" :class="{ active: route.name === 'admin-users' }">
            <UsersIcon :size="18" />
            <span class="nav-label">{{ t('nav.userManagement') }}</span>
          </RouterLink>
        </div>
      </nav>

      <!-- Sidebar Footer: Displays UserName & UserId -->
      <div class="sidebar__footer">
        <div class="sidebar-user-card" v-if="authStore.user">
          <div class="sidebar-user-avatar">
            <img
              v-if="authStore.user.avatar"
              :src="authStore.user.avatar"
              :alt="authStore.user.name"
              class="avatar-img"
            />
            <div v-else class="avatar-fallback">{{ getInitials(authStore.user.name) }}</div>
          </div>
          <div class="sidebar-user-meta" v-if="!sidebarCollapsed">
            <p class="sidebar-user-name" :title="authStore.user.name">{{ authStore.user.name }}</p>
            <p class="sidebar-user-id" :title="authStore.user.id">{{ authStore.user.id }}</p>
          </div>
        </div>
      </div>
    </aside>

    <!-- Main content (scrolls independently) -->
    <div class="main-wrapper">
      <!-- Topbar -->
      <header class="topbar">
        <div class="topbar__left">
          <button class="mobile-menu-btn" @click="sidebarCollapsed = !sidebarCollapsed">
            <MenuIcon :size="20" />
          </button>
          <h1 class="topbar__title">{{ pageTitle }}</h1>
        </div>

        <div class="topbar__right">
          <!-- Theme Toggle moved to top right -->
          <ThemeToggle />

          <!-- Language Switcher button next to avatar -->
          <LanguageSwitcher />

          <!-- User menu -->
          <div class="user-menu" ref="userMenuRef">
            <button class="user-avatar-btn" @click="userMenuOpen = !userMenuOpen" :title="authStore.user?.name">
              <img
                v-if="authStore.user?.avatar"
                :src="authStore.user.avatar"
                :alt="authStore.user.name"
                class="avatar-img"
              />
              <div v-else class="avatar-fallback">{{ getInitials(authStore.user?.name) }}</div>
            </button>

            <Transition name="dropdown">
              <div v-if="userMenuOpen" class="user-dropdown">
                <div class="user-dropdown__header">
                  <p class="user-name">{{ authStore.user?.name }}</p>
                  <p class="user-email">{{ authStore.user?.email }}</p>
                  <span class="user-role-badge" :class="`badge--${authStore.user?.role}`">
                    {{ roleLabel }}
                  </span>
                </div>
                <div class="user-dropdown__divider" />
                <button class="user-dropdown__item danger" @click="handleLogout">
                  <LogOutIcon :size="15" />
                  {{ t('topbar.logout') }}
                </button>
              </div>
            </Transition>
          </div>
        </div>
      </header>

      <!-- Page content -->
      <main class="page-content">
        <RouterView v-slot="{ Component }">
          <Transition name="page" mode="out-in">
            <component :is="Component" :key="route.path" />
          </Transition>
        </RouterView>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import {
  LayoutDashboardIcon, ClipboardListIcon, BarChart3Icon,
  FileTextIcon, UsersIcon, ChevronLeftIcon, ChevronDownIcon,
  LogOutIcon, MenuIcon,
} from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth.js'
import { getInitials } from '@/lib/utils.js'
import ThemeToggle from './ThemeToggle.vue'
import LanguageSwitcher from './LanguageSwitcher.vue'

const { t, te } = useI18n()
const authStore = useAuthStore()
const route = useRoute()
const router = useRouter()
const sidebarCollapsed = ref(false)
const userMenuOpen = ref(false)
const userMenuRef = ref(null)

const pageTitle = computed(() => {
  const key = `topbar.titles.${route.name}`
  return te(key) ? t(key) : 'MES Survey'
})

const roleLabel = computed(() => {
  const role = authStore.user?.role
  if (role === 'admin') return t('roles.admin')
  if (role === 'manager') {
    const dept = authStore.user?.department || (authStore.userDepartments.length > 0 ? authStore.userDepartments.join(', ') : 'IT')
    return `${t('roles.manager')} (${dept})`
  }
  return t('roles.user')
})

async function handleLogout() {
  await authStore.logout()
  router.push({ name: 'login' })
}

// Close dropdown on outside click
function handleClickOutside(e) {
  if (userMenuRef.value && !userMenuRef.value.contains(e.target)) {
    userMenuOpen.value = false
  }
}

onMounted(() => document.addEventListener('click', handleClickOutside))
onUnmounted(() => document.removeEventListener('click', handleClickOutside))
</script>

<style scoped>
/* ─── Layout: Fixed 100vh prevents sidebar from scrolling with page ─── */
.app-shell {
  display: flex;
  height: 100vh;
  overflow: hidden;
  background: var(--color-bg);
}

/* ─── Sidebar ─────────────────────────────────────────────────── */
.sidebar {
  width: var(--sidebar-width);
  height: 100vh;
  max-height: 100vh;
  background: var(--color-surface);
  border-right: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  transition: width 200ms ease-out;
  overflow-y: auto;
  overflow-x: hidden;
  z-index: 40;
}

.sidebar--collapsed {
  width: 60px;
}

.sidebar--collapsed .sidebar__logo {
  display: none !important;
}

.sidebar--collapsed .sidebar__header {
  padding: 0 !important;
  justify-content: center !important;
}

.sidebar--collapsed .logo-text,
.sidebar--collapsed .nav-label,
.sidebar--collapsed .nav-section-label,
.sidebar--collapsed .sidebar-user-meta {
  display: none !important;
}

/* ─── Sidebar Header ──────────────────────────────────────────── */
.sidebar__header {
  height: var(--topbar-height);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 12px 0 16px;
  border-bottom: 1px solid var(--color-border);
  flex-shrink: 0;
}

.sidebar__logo {
  display: flex;
  align-items: center;
  gap: 10px;
  overflow: hidden;
}

.logo-icon {
  width: 32px;
  height: 32px;
  background: var(--color-surface-2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  overflow: hidden;
  padding: 3px;
}

.logo-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.logo-text {
  font-size: 0.9375rem;
  font-weight: 650;
  color: var(--color-text);
  white-space: nowrap;
  transition: opacity 200ms ease-out, width 200ms ease-out;
}

.sidebar__collapse-btn {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-sm);
  border: 1px solid transparent;
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-muted);
  flex-shrink: 0;
  transition: background-color 150ms ease-out, color 150ms ease-out;
}

.sidebar--collapsed .sidebar__collapse-btn {
  margin: 0 auto;
}

@media (hover: hover) {
  .sidebar__collapse-btn:hover {
    background: var(--color-surface-2);
    color: var(--color-text);
  }
}

/* ─── Sidebar Nav ─────────────────────────────────────────────── */
.sidebar__nav {
  flex: 1;
  padding: 12px 8px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow-y: auto;
  overflow-x: hidden;
}

.nav-section {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.sidebar--collapsed .sidebar__nav {
  padding: 12px 0;
  align-items: center;
}

.sidebar--collapsed .nav-section {
  width: 100%;
  align-items: center;
  display: flex;
  flex-direction: column;
}

.sidebar--collapsed .nav-item {
  width: 32px;
  height: 32px;
  padding: 0;
  margin: 0 auto 6px auto;
  justify-content: center;
  border-radius: var(--radius-sm);
  flex-shrink: 0;
}

.sidebar--collapsed .nav-item svg {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

.nav-section-label {
  font-size: 0.6875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--color-text-subtle);
  padding: 4px 8px 2px;
  white-space: nowrap;
  transition: opacity 200ms ease-out;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: var(--radius-md);
  color: var(--color-text-muted);
  text-decoration: none;
  font-size: 0.875rem;
  font-weight: 500;
  white-space: nowrap;
  transition: background-color 150ms ease-out, color 150ms ease-out;
}

.nav-item svg {
  flex-shrink: 0;
}

.nav-label {
  transition: opacity 200ms ease-out;
  overflow: hidden;
}

@media (hover: hover) {
  .nav-item:hover {
    background: var(--color-surface-2);
    color: var(--color-text);
  }
}

.nav-item.active {
  background: var(--color-primary-muted);
  color: var(--color-primary);
  font-weight: 600;
}

/* ─── Sidebar Footer: User Card (UserName & UserId) ───────────── */
.sidebar__footer {
  padding: 10px 12px;
  border-top: 1px solid var(--color-border);
  background: var(--color-surface);
  flex-shrink: 0;
}

.sidebar--collapsed .sidebar__footer {
  padding: 10px 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.sidebar-user-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 8px;
  background: transparent;
  border: none;
  border-radius: var(--radius-md);
  overflow: hidden;
  transition: background-color 150ms ease-out;
}

.sidebar--collapsed .sidebar-user-card {
  padding: 0;
  width: 32px;
  height: 32px;
  margin: 0 auto;
  justify-content: center;
  border-radius: 50%;
}

@media (hover: hover) {
  .sidebar-user-card:hover {
    background: var(--color-surface-2);
  }
}

.sidebar-user-avatar {
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
  flex-shrink: 0;
  overflow: hidden;
  border: 1px solid var(--color-border);
}

.sidebar-user-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.sidebar-user-meta {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.sidebar-user-name {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--color-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: 1.2;
}

.sidebar-user-id {
  font-size: 0.6875rem;
  color: var(--color-text-subtle);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: 1.2;
  margin-top: 2px;
  font-family: inherit;
}

/* ─── Main Wrapper (Scrolls independently) ────────────────────── */
.main-wrapper {
  flex: 1;
  min-width: 0;
  height: 100vh;
  max-height: 100vh;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  overflow-x: hidden;
}

/* ─── Topbar ──────────────────────────────────────────────────── */
.topbar {
  height: var(--topbar-height);
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  position: sticky;
  top: 0;
  z-index: 30;
  flex-shrink: 0;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.topbar__left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.topbar__title {
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--color-text);
}

.topbar__right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.mobile-menu-btn {
  display: none;
  width: 36px;
  height: 36px;
  border: none;
  background: transparent;
  cursor: pointer;
  border-radius: var(--radius-md);
  align-items: center;
  justify-content: center;
  color: var(--color-text-muted);
}

/* ─── User Avatar Button & Dropdown ───────────────────────────── */
.user-menu {
  position: relative;
}

.user-avatar-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  background: transparent;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  transition: background-color 150ms ease-out;
  flex-shrink: 0;
}

@media (hover: hover) {
  .user-avatar-btn:hover {
    background: var(--color-surface-2);
  }
}

.avatar-img {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
  border: 1.5px solid var(--color-border);
}

.avatar-fallback {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--color-primary-100);
  color: var(--color-primary);
  font-size: 0.8125rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1.5px solid var(--color-border);
}

.user-dropdown {
  position: absolute;
  right: 0;
  top: calc(100% + 8px);
  width: 240px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-elevated);
  padding: 8px;
  z-index: 50;
}

.user-dropdown__header {
  padding: 8px 10px 10px;
}

.user-name {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-email {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-top: 1px;
}

.user-role-badge {
  display: inline-flex;
  align-items: center;
  margin-top: 8px;
  padding: 3px 10px;
  border-radius: var(--radius-sm);
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.01em;
  line-height: 1.2;
}

.badge--admin {
  background: rgba(147, 51, 234, 0.1);
  color: #7e22ce;
  border: 1px solid rgba(147, 51, 234, 0.22);
}

.badge--manager {
  background: rgba(14, 165, 233, 0.1);
  color: #0284c7;
  border: 1px solid rgba(14, 165, 233, 0.22);
}

.badge--user {
  background: rgba(100, 116, 139, 0.1);
  color: #475569;
  border: 1px solid rgba(100, 116, 139, 0.2);
}

[data-theme='dark'] .badge--admin {
  background: rgba(168, 85, 247, 0.18);
  color: #d8b4fe;
  border-color: rgba(168, 85, 247, 0.3);
}

[data-theme='dark'] .badge--manager {
  background: rgba(56, 189, 248, 0.18);
  color: #7dd3fc;
  border-color: rgba(56, 189, 248, 0.3);
}

[data-theme='dark'] .badge--user {
  background: rgba(148, 163, 184, 0.15);
  color: #cbd5e1;
  border-color: rgba(148, 163, 184, 0.25);
}

.user-dropdown__divider {
  height: 1px;
  background: var(--color-border);
  margin: 4px 0;
}

.user-dropdown__item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border: none;
  background: transparent;
  color: var(--color-text);
  font-size: 0.8125rem;
  border-radius: var(--radius-sm);
  cursor: pointer;
  text-decoration: none;
  transition: background-color 150ms ease-out;
}

@media (hover: hover) {
  .user-dropdown__item:hover {
    background: var(--color-surface-2);
  }
}

.user-dropdown__item.danger {
  color: var(--color-danger);
}

@media (hover: hover) {
  .user-dropdown__item.danger:hover {
    background: oklch(from var(--color-danger) l c h / 0.1);
  }
}

/* ─── Page Content ────────────────────────────────────────────── */
.page-content {
  flex: 1;
  padding: 24px;
}

/* ─── Dropdown transition ─────────────────────────────────────── */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: opacity 150ms ease-out, transform 150ms ease-out;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-4px) scale(0.98);
}

/* ─── Responsive ──────────────────────────────────────────────── */
@media (max-width: 768px) {
  .sidebar {
    position: fixed;
    left: -100%;
    transition: left 200ms ease-out;
  }
  .sidebar:not(.sidebar--collapsed) {
    left: 0;
  }
  .mobile-menu-btn {
    display: flex;
  }
}
</style>

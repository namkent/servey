import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth.js'

const routes = [
  {
    path: '/survey',
    component: () => import('@/components/layout/AppShell.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'home',
        component: () => import('@/pages/Home.vue'),
      },
      {
        path: 's/:id',
        name: 'take-survey',
        component: () => import('@/pages/TakeSurvey.vue'),
      },
      {
        path: 'admin',
        meta: { requiresAdmin: true },
        children: [
          {
            path: '',
            name: 'admin-dashboard',
            redirect: '/survey',
          },
          {
            path: 'surveys',
            name: 'admin-surveys',
            component: () => import('@/pages/admin/SurveyList.vue'),
          },
          {
            path: 'surveys/new',
            name: 'admin-survey-create',
            component: () => import('@/pages/admin/CreateSurvey.vue'),
          },
          {
            path: 'surveys/:id/edit',
            name: 'admin-survey-edit',
            component: () => import('@/pages/admin/EditSurvey.vue'),
          },
          {
            path: 'surveys/:id/results',
            name: 'admin-survey-results',
            component: () => import('@/pages/admin/SurveyResults.vue'),
          },
          {
            path: 'users',
            name: 'admin-users',
            component: () => import('@/pages/admin/UserManagement.vue'),
            meta: { requiresSuperAdmin: true },
          },
        ],
      },
    ],
  },
  {
    path: '/survey/login',
    name: 'login',
    component: () => import('@/pages/Login.vue'),
    meta: { guest: true },
  },
  // Catch-all: redirect to /survey
  {
    path: '/:pathMatch(.*)*',
    redirect: '/survey',
  },
]

const router = createRouter({
  history: createWebHistory('/'),
  routes,
  scrollBehavior: () => ({ top: 0, behavior: 'smooth' }),
})

// Navigation guards
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()

  // Wait for auth init on first load
  if (!authStore.initialized) {
    await authStore.fetchMe()
  }

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return next({ name: 'login', query: { redirect: to.fullPath } })
  }

  // Super Admin only routes (e.g. User & Role management)
  if (to.meta.requiresSuperAdmin && !authStore.isAdmin) {
    return next({ name: 'admin-dashboard' })
  }

  // Admin / Manager routes (Dashboard, surveys, results)
  if (to.meta.requiresAdmin && !authStore.canManage) {
    return next({ name: 'home' })
  }

  if (to.meta.guest && authStore.isAuthenticated) {
    return next({ name: 'home' })
  }

  next()
})

export default router

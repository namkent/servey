import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/lib/axios.js'
import { useRouter } from 'vue-router'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const loading = ref(false)
  const initialized = ref(false)

  const isAuthenticated = computed(() => !!user.value)
  const isAdmin = computed(() => user.value?.role === 'admin')
  const isManager = computed(() => user.value?.role === 'manager')
  const canManage = computed(() => user.value?.role === 'admin' || user.value?.role === 'manager')
  const isUser = computed(() => !!user.value)

  const userDepartments = computed(() => {
    if (!user.value) return []
    const raw = user.value.departments
    if (Array.isArray(raw)) return raw
    if (typeof raw === 'string' && raw.trim()) {
      try {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) return parsed
      } catch {
        return raw.split(',').map(d => d.trim()).filter(Boolean)
      }
    }
    if (user.value.department) return [user.value.department]
    return []
  })

  async function fetchMe() {
    loading.value = true
    try {
      const { data } = await api.get('/auth/me')
      if (data.authenticated) {
        user.value = data.user
      } else {
        user.value = null
      }
    } catch {
      user.value = null
    } finally {
      loading.value = false
      initialized.value = true
    }
  }

  async function logout() {
    try {
      await api.post('/auth/logout')
    } finally {
      user.value = null
    }
  }

  function loginWithGoogle() {
    window.location.href = '/api/auth/google?prompt=select_account'
  }

  function loginWithSdv() {
    window.location.href = '/api/auth/sdv?prompt=select_account'
  }

  async function devLogin(param = 'admin') {
    loading.value = true
    try {
      const payload = typeof param === 'string' ? { role: param } : param
      const { data } = await api.post('/auth/dev-login', payload)
      user.value = data.user
      return data.user
    } finally {
      loading.value = false
    }
  }

  const authConfig = ref({
    google: true,
    sdv: true,
    demo: true,
    sdvName: 'SDV SSO',
  })

  async function fetchAuthConfig() {
    try {
      const { data } = await api.get('/auth/config')
      authConfig.value = data
      return data
    } catch (e) {
      console.warn('Failed to fetch auth config, using fallback defaults', e)
    }
  }

  return {
    user,
    loading,
    initialized,
    authConfig,
    isAuthenticated,
    isAdmin,
    isManager,
    canManage,
    userDepartments,
    isUser,
    fetchMe,
    fetchAuthConfig,
    logout,
    loginWithGoogle,
    loginWithSdv,
    devLogin,
  }
})

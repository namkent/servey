<template>
  <div class="login-page">
    <!-- Animated background -->
    <div class="login-bg">
      <div class="bg-orb bg-orb--1" />
      <div class="bg-orb bg-orb--2" />
      <div class="bg-orb bg-orb--3" />
    </div>

    <!-- Card -->
    <div class="login-card animate-in">
      <!-- Logo -->
      <div class="login-card__logo">
        <div class="logo-mark">
          <img src="/logo.svg" alt="MES Survey Logo" class="login-logo-img" />
        </div>
        <div>
          <h1 class="login-card__title">MES Survey</h1>
          <p class="login-card__sub">Nền tảng khảo sát trực tuyến</p>
        </div>
      </div>

      <div class="login-card__divider" />

      <!-- Error message -->
      <Transition name="fade">
        <div v-if="errorMessage" class="login-error" role="alert">
          <AlertCircleIcon :size="15" />
          {{ errorMessage }}
        </div>
      </Transition>

      <!-- Login buttons -->
      <div class="login-card__actions">
        <p v-if="authStore.authConfig.google || authStore.authConfig.sdv" class="login-card__prompt">Đăng nhập để tiếp tục</p>

        <button
          v-if="authStore.authConfig.google"
          class="login-btn login-btn--google"
          @click="authStore.loginWithGoogle()"
          :disabled="loading"
          id="btn-login-google"
        >
          <svg class="provider-icon" viewBox="0 0 24 24" width="18" height="18">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Login with Google
        </button>

        <button
          v-if="authStore.authConfig.sdv"
          class="login-btn login-btn--sdv"
          @click="authStore.loginWithSdv()"
          :disabled="loading"
          id="btn-login-sdv"
        >
          Login with {{ authStore.authConfig.sdvName || 'IDP' }}
        </button>

        <!-- Dev / Demo fast access -->
        <div v-if="authStore.authConfig.demo" class="dev-login-box">
          <div class="dev-login-divider">
            <span>HOẶC TRẢI NGHIỆM NHANH (DEMO)</span>
          </div>
          <div class="dev-buttons">
            <button
              class="btn-demo btn-demo--admin"
              type="button"
              @click="handleDevLogin('admin')"
              :disabled="loading"
              title="Quản trị viên tối cao"
            >
              👑 Admin
            </button>
            <button
              class="btn-demo btn-demo--it"
              type="button"
              @click="handleDevLogin({ role: 'manager', department: 'IT', name: 'Nguyễn Văn A (IT)', email: 'nguyen.van.a@company.com' })"
              :disabled="loading"
              title="Nguyễn Văn A (Quản lý IT)"
            >
              💻 Nguyễn Văn A (IT)
            </button>
            <button
              class="btn-demo btn-demo--hr"
              type="button"
              @click="handleDevLogin({ role: 'manager', department: 'HR', name: 'Nguyễn Thị B (HR)', email: 'nguyen.thi.b@company.com' })"
              :disabled="loading"
              title="Nguyễn Thị B (Quản lý HR)"
            >
              👥 Nguyễn Thị B (HR)
            </button>
            <button
              class="btn-demo btn-demo--user"
              type="button"
              @click="handleDevLogin('user')"
              :disabled="loading"
              title="Người dùng thông thường"
            >
              👤 User
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { AlertCircleIcon } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth.js'

const authStore = useAuthStore()
const route = useRoute()
const router = useRouter()
const loading = ref(false)

onMounted(() => {
  authStore.fetchAuthConfig()
})

async function handleDevLogin(role) {
  loading.value = true
  try {
    await authStore.devLogin(role)
    const redirect = route.query.redirect || '/survey'
    router.push(redirect)
  } catch (err) {
    console.error('Dev login failed:', err)
  } finally {
    loading.value = false
  }
}

const errorMessage = computed(() => {
  const err = route.query.error
  if (!err) return ''
  const msgs = {
    google_failed: 'Đăng nhập Google thất bại. Vui lòng thử lại.',
    sdv_failed: 'Đăng nhập SDV SSO thất bại. Vui lòng thử lại.',
    sdv_not_configured: 'SDV SSO chưa được cấu hình.',
    provider_disabled: 'Phương thức đăng nhập này hiện đang bị vô hiệu hoá.',
  }
  return msgs[err] || 'Đã có lỗi xảy ra. Vui lòng thử lại.'
})
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-bg);
  padding: 24px;
  position: relative;
  overflow: hidden;
}

/* ─── Animated orb background ───────────────────────────── */
.login-bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.bg-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.4;
}

.bg-orb--1 {
  width: 500px; height: 500px;
  background: oklch(0.70 0.18 264);
  top: -150px; left: -100px;
  animation: orbFloat 12s ease-in-out infinite alternate;
}

.bg-orb--2 {
  width: 400px; height: 400px;
  background: oklch(0.70 0.18 300);
  bottom: -100px; right: -100px;
  animation: orbFloat 15s ease-in-out infinite alternate-reverse;
}

.bg-orb--3 {
  width: 300px; height: 300px;
  background: oklch(0.75 0.15 200);
  top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  animation: orbFloat 10s ease-in-out infinite;
}

.dark .bg-orb { opacity: 0.15; }

@keyframes orbFloat {
  from { transform: translate(0, 0) scale(1); }
  to   { transform: translate(30px, -20px) scale(1.05); }
}

@media (prefers-reduced-motion: reduce) {
  .bg-orb { animation: none; }
}

/* ─── Card ───────────────────────────────────────────────── */
.login-card {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 400px;
  background: oklch(from var(--color-surface) l c h / 0.85);
  backdrop-filter: blur(24px) saturate(1.4);
  -webkit-backdrop-filter: blur(24px) saturate(1.4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-elevated);
  padding: 32px;
}

.login-card__logo {
  display: flex;
  align-items: center;
  gap: 14px;
}

.logo-mark {
  width: 52px;
  height: 52px;
  background: var(--color-surface-2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  overflow: hidden;
  padding: 6px;
}

.login-logo-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.login-card__title {
  font-size: 1.375rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--color-text);
}

.login-card__sub {
  font-size: 0.8125rem;
  color: var(--color-text-muted);
  margin-top: 2px;
}

.login-card__divider {
  height: 1px;
  background: var(--color-border);
  margin: 24px 0;
}

/* ─── Error ───────────────────────────────────────────────── */
.login-error {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  background: var(--color-danger-bg);
  color: var(--color-danger);
  border-radius: var(--radius-md);
  font-size: 0.8125rem;
  font-weight: 500;
  margin-bottom: 16px;
}

.fade-enter-active, .fade-leave-active { transition: opacity 200ms ease-out; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

/* ─── Actions ────────────────────────────────────────────── */
.login-card__actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.login-card__prompt {
  font-size: 0.875rem;
  color: var(--color-text-muted);
  margin-bottom: 4px;
}

.login-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  width: 100%;
  padding: 11px 16px;
  border-radius: var(--radius-md);
  font-size: 0.9375rem;
  font-weight: 500;
  font-family: inherit;
  cursor: pointer;
  border: 1px solid transparent;
  transition: background-color 150ms ease-out, box-shadow 150ms ease-out, border-color 150ms ease-out;
}

.login-btn:not(:disabled):active {
  scale: 0.96;
  transition: scale 150ms ease-out;
}

.login-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.login-btn--google {
  background: var(--color-surface);
  color: var(--color-text);
  border-color: var(--color-border);
  box-shadow: var(--shadow-border);
}

@media (hover: hover) {
  .login-btn--google:hover {
    box-shadow: var(--shadow-border-hover);
    border-color: var(--color-border-hover);
  }
}

.login-btn--sdv {
  background: var(--color-primary);
  color: white;
}

@media (hover: hover) {
  .login-btn--sdv:hover {
    background: var(--color-primary-600);
  }
}

.sdv-icon {
  width: 18px;
  height: 18px;
  background: white;
  color: var(--color-primary);
  border-radius: 4px;
  font-size: 0.5625rem;
  font-weight: 900;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* ─── Dev Login Box ─────────────────────────────────────── */
.dev-login-box {
  margin-top: 14px;
}

.dev-login-divider {
  display: flex;
  align-items: center;
  text-align: center;
  color: var(--color-text-muted);
  font-size: 0.6875rem;
  letter-spacing: 0.05em;
  margin-bottom: 10px;
}

.dev-login-divider::before,
.dev-login-divider::after {
  content: '';
  flex: 1;
  border-bottom: 1px dashed var(--color-border);
}

.dev-login-divider span {
  padding: 0 8px;
}

.dev-buttons {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.btn-demo {
  padding: 8px 10px;
  border-radius: var(--radius-md);
  font-size: 0.8125rem;
  font-weight: 500;
  cursor: pointer;
  border: 1px dashed var(--color-border);
  background: var(--color-surface-2);
  color: var(--color-text);
  transition: all 150ms ease-out;
}

.btn-demo:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.btn-demo:active {
  scale: 0.96;
}
</style>

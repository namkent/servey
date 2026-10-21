import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useThemeStore = defineStore('theme', () => {
  const isDark = ref(false)

  function init() {
    const saved = localStorage.getItem('survey-theme')
    isDark.value = saved === 'dark'
    applyTheme(isDark.value)
  }

  function toggle() {
    // Suppress all transitions during theme switch (Jakub Krehel technique)
    const style = document.createElement('style')
    style.textContent = '*,*::before,*::after{transition:none !important}'
    document.head.appendChild(style)

    // Force style flush
    void document.body.offsetHeight

    isDark.value = !isDark.value
    applyTheme(isDark.value)
    localStorage.setItem('survey-theme', isDark.value ? 'dark' : 'light')

    // Restore transitions after next frame
    requestAnimationFrame(() => {
      requestAnimationFrame(() => style.remove())
    })
  }

  function applyTheme(dark) {
    document.documentElement.classList.toggle('dark', dark)
  }

  return { isDark, init, toggle }
})

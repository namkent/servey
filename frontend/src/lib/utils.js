import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Merge class names with conflict resolution (shadcn-vue pattern)
 * Since we use vanilla CSS, this is a lightweight version.
 */
export function cn(...inputs) {
  return clsx(inputs)
}

/**
 * Format a date string to locale-aware display.
 */
export function formatDate(dateStr, options = {}) {
  if (!dateStr) return '—'
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options,
  })
}

export function formatDateTime(dateStr) {
  return formatDate(dateStr, { hour: '2-digit', minute: '2-digit' })
}

/**
 * Format to ISO-like YYYY-MM-DD HH:MM
 */
export function formatDateTime24(dateStr) {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return '—'
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd} ${hh}:${min}`
}

export function timeAgo(dateStr, locale) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now - date
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHr = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHr / 24)

  const currentLocale = locale || localStorage.getItem('survey_locale') || 'vi'
  const isEn = currentLocale === 'en'

  if (diffDay > 30) return formatDate(dateStr)
  if (diffDay > 0) return isEn ? `${diffDay} ${diffDay === 1 ? 'day' : 'days'} ago` : `${diffDay} ngày trước`
  if (diffHr > 0) return isEn ? `${diffHr} ${diffHr === 1 ? 'hour' : 'hours'} ago` : `${diffHr} giờ trước`
  if (diffMin > 0) return isEn ? `${diffMin} ${diffMin === 1 ? 'min' : 'mins'} ago` : `${diffMin} phút trước`
  return isEn ? 'Just now' : 'Vừa xong'
}

/**
 * Truncate text to max length with ellipsis.
 */
export function truncate(text, max = 80) {
  if (!text) return ''
  return text.length > max ? text.slice(0, max) + '…' : text
}

/**
 * Get user initial for avatar fallback (strictly 1 character).
 */
export function getInitials(name) {
  if (!name) return '?'
  const trimmed = name.trim()
  if (!trimmed) return '?'
  return trimmed.charAt(0).toUpperCase()
}

/**
 * Simple debounce function.
 */
export function debounce(fn, delay = 300) {
  let timer
  return (...args) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), delay)
  }
}

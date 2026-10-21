<template>
  <div class="custom-select" :class="{ 'custom-select--open': isOpen }" ref="containerRef">
    <!-- Trigger Button -->
    <button
      type="button"
      class="select-trigger"
      :class="{ 'select-trigger--open': isOpen, 'select-trigger--disabled': disabled }"
      @click="toggleOpen"
      :disabled="disabled"
      aria-haspopup="listbox"
      :aria-expanded="isOpen"
    >
      <span class="select-value-text">
        <component :is="selectedOption?.icon" v-if="selectedOption?.icon" :size="14" class="select-opt-icon" />
        {{ selectedLabel }}
      </span>
      <ChevronDownIcon :size="14" class="select-chevron" :class="{ 'select-chevron--rotated': isOpen }" />
    </button>

    <!-- Dropdown Popover Menu -->
    <Transition name="select-dropdown">
      <div v-if="isOpen" class="select-popover" role="listbox">
        <div class="select-options-scroll">
          <div
            v-for="opt in normalizedOptions"
            :key="opt.value"
            class="select-option"
            :class="{ 'select-option--selected': opt.value === modelValue }"
            @click="selectOption(opt)"
            role="option"
            :aria-selected="opt.value === modelValue"
          >
            <span class="option-content">
              <component :is="opt.icon" v-if="opt.icon" :size="14" class="option-icon" />
              <span class="option-label">{{ opt.label }}</span>
            </span>
            <CheckIcon v-if="opt.value === modelValue" :size="14" class="option-check" />
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { ChevronDownIcon, CheckIcon } from 'lucide-vue-next'

const props = defineProps({
  modelValue: {
    type: [String, Number],
    default: ''
  },
  options: {
    type: Array,
    default: () => []
  },
  placeholder: {
    type: String,
    default: 'Chọn một mục...'
  },
  disabled: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'change'])

const isOpen = ref(false)
const containerRef = ref(null)

const normalizedOptions = computed(() => {
  return props.options.map(opt => {
    if (typeof opt === 'object' && opt !== null) {
      return {
        label: opt.label !== undefined ? opt.label : opt.value,
        value: opt.value !== undefined ? opt.value : opt.label,
        icon: opt.icon || null
      }
    }
    return { label: String(opt), value: opt, icon: null }
  })
})

const selectedOption = computed(() => {
  return normalizedOptions.value.find(o => o.value === props.modelValue) || null
})

const selectedLabel = computed(() => {
  if (selectedOption.value) return selectedOption.value.label
  return props.placeholder
})

function toggleOpen() {
  if (props.disabled) return
  isOpen.value = !isOpen.value
}

function selectOption(opt) {
  emit('update:modelValue', opt.value)
  emit('change', opt.value)
  isOpen.value = false
}

function handleClickOutside(e) {
  if (containerRef.value && !containerRef.value.contains(e.target)) {
    isOpen.value = false
  }
}

function handleKeyDown(e) {
  if (e.key === 'Escape' && isOpen.value) {
    isOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  document.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  document.removeEventListener('keydown', handleKeyDown)
})
</script>

<style scoped>
.custom-select {
  position: relative;
  display: inline-block;
  min-width: 170px;
}

.custom-select--open {
  z-index: 999;
}

.select-trigger {
  width: 100%;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 0 10px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  color: var(--color-text);
  font-size: 0.8125rem;
  font-weight: 500;
  cursor: pointer;
  outline: none;
  transition: all 150ms ease-out;
  user-select: none;
}

@media (hover: hover) {
  .select-trigger:hover:not(.select-trigger--disabled) {
    background: var(--color-surface-2);
    border-color: var(--color-text-subtle);
  }
}

.select-trigger--open {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-muted);
}

.select-trigger--disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.select-value-text {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.select-chevron {
  color: var(--color-text-muted);
  flex-shrink: 0;
  transition: transform 200ms ease-out;
}

.select-chevron--rotated {
  transform: rotate(180deg);
  color: var(--color-primary);
}

/* ─── Popover Menu ────────────────────────────────────────── */
.select-popover {
  position: absolute;
  top: calc(100% + 5px);
  left: 0;
  min-width: 100%;
  max-width: 280px;
  z-index: 1000;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.4), 0 8px 10px -6px rgba(0, 0, 0, 0.3);
  padding: 4px;
  overflow: hidden;
  backdrop-filter: blur(8px);
}

.select-options-scroll {
  max-height: 240px;
  overflow-y: auto;
  overscroll-behavior: contain;
}

.select-options-scroll::-webkit-scrollbar {
  width: 5px;
}
.select-options-scroll::-webkit-scrollbar-thumb {
  background: var(--color-border);
  border-radius: 4px;
}

.select-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 7px 10px;
  border-radius: var(--radius-sm);
  font-size: 0.8125rem;
  color: var(--color-text-muted);
  cursor: pointer;
  transition: all 120ms ease-out;
}

@media (hover: hover) {
  .select-option:hover {
    background: var(--color-surface-2);
    color: var(--color-text);
  }
}

.select-option--selected {
  background: var(--color-primary-muted);
  color: var(--color-primary);
  font-weight: 600;
}

.option-content {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.option-check {
  color: var(--color-primary);
  flex-shrink: 0;
}

/* ─── Transitions ─────────────────────────────────────────── */
.select-dropdown-enter-active,
.select-dropdown-leave-active {
  transition: opacity 150ms ease-out, transform 150ms ease-out;
}

.select-dropdown-enter-from,
.select-dropdown-leave-to {
  opacity: 0;
  transform: translateY(-4px) scale(0.98);
}
</style>

<template>
  <div class="pie-chart-root">
    <div class="chart-wrapper">
      <svg
        :viewBox="`0 0 ${size} ${size}`"
        :width="size"
        :height="size"
        class="pie-svg"
      >
        <!-- Background ring for empty / 0 responses -->
        <circle
          v-if="totalCount === 0"
          :cx="center"
          :cy="center"
          :r="(outerRadius + innerRadius) / 2"
          :stroke-width="outerRadius - innerRadius"
          fill="none"
          class="empty-ring"
        />

        <!-- Slices -->
        <g v-else>
          <path
            v-for="(slice, i) in slicePaths"
            :key="i"
            :d="slice.d"
            :fill="slice.color"
            class="slice-path"
            :class="{ 'slice-path--active': hoveredIdx === i }"
            @mouseenter="hoveredIdx = i"
            @mouseleave="hoveredIdx = null"
          >
            <title>{{ slice.label }}: {{ slice.count }} ({{ slice.percent }}%)</title>
          </path>
        </g>

        <!-- Center content for Donut -->
        <g class="center-label" :transform="`translate(${center}, ${center})`">
          <template v-if="hoveredIdx !== null && slicePaths[hoveredIdx]">
            <text class="center-percent" y="-4">
              {{ slicePaths[hoveredIdx].percent }}%
            </text>
            <text class="center-sub" y="16">
              {{ slicePaths[hoveredIdx].count }} {{ unitLabel }}
            </text>
          </template>
          <template v-else>
            <text class="center-total" y="-4">
              {{ totalCount }}
            </text>
            <text class="center-sub" y="16">
              {{ totalCount === 0 ? '0' : unitLabel }}
            </text>
          </template>
        </g>
      </svg>

      <!-- Floating mini tooltip if hovered -->
      <Transition name="fade-fast">
        <div v-if="hoveredIdx !== null && slicePaths[hoveredIdx]" class="slice-tooltip">
          <div class="tooltip-dot" :style="{ backgroundColor: slicePaths[hoveredIdx].color }" />
          <span class="tooltip-text">{{ slicePaths[hoveredIdx].label }}</span>
          <span class="tooltip-val">{{ slicePaths[hoveredIdx].count }} ({{ slicePaths[hoveredIdx].percent }}%)</span>
        </div>
      </Transition>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'

const props = defineProps({
  items: {
    type: Array,
    default: () => []
  },
  size: {
    type: Number,
    default: 180
  },
  innerRadiusRatio: {
    type: Number,
    default: 0.62
  },
  unitLabel: {
    type: String,
    default: 'phản hồi'
  },
  colors: {
    type: Array,
    default: () => [
      '#3b82f6', // blue
      '#10b981', // emerald
      '#f59e0b', // amber
      '#8b5cf6', // purple
      '#ec4899', // pink
      '#06b6d4', // cyan
      '#f97316', // orange
      '#84cc16', // lime
      '#6366f1', // indigo
      '#14b8a6', // teal
      '#d946ef', // fuchsia
      '#64748b'  // slate
    ]
  }
})

const hoveredIdx = ref(null)

const center = computed(() => props.size / 2)
const outerRadius = computed(() => (props.size / 2) - 10)
const innerRadius = computed(() => outerRadius.value * props.innerRadiusRatio)

const totalCount = computed(() => {
  return props.items.reduce((acc, it) => acc + (Number(it.count) || 0), 0)
})

function polarToCartesian(cx, cy, radius, angleInDegrees) {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0
  return {
    x: cx + radius * Math.cos(angleInRadians),
    y: cy + radius * Math.sin(angleInRadians)
  }
}

function describeDonutSegment(cx, cy, rInner, rOuter, startAngle, endAngle) {
  const diff = endAngle - startAngle
  if (diff >= 359.9) {
    // Complete circle donut: two 180deg arcs
    return [
      `M ${cx} ${cy - rOuter}`,
      `A ${rOuter} ${rOuter} 0 1 0 ${cx} ${cy + rOuter}`,
      `A ${rOuter} ${rOuter} 0 1 0 ${cx} ${cy - rOuter}`,
      `M ${cx} ${cy - rInner}`,
      `A ${rInner} ${rInner} 0 1 1 ${cx} ${cy + rInner}`,
      `A ${rInner} ${rInner} 0 1 1 ${cx} ${cy - rInner}`,
      'Z'
    ].join(' ')
  }

  const startOuter = polarToCartesian(cx, cy, rOuter, startAngle)
  const endOuter = polarToCartesian(cx, cy, rOuter, endAngle)
  const startInner = polarToCartesian(cx, cy, rInner, startAngle)
  const endInner = polarToCartesian(cx, cy, rInner, endAngle)

  const largeArcFlag = diff <= 180 ? '0' : '1'

  return [
    `M ${startOuter.x} ${startOuter.y}`,
    `A ${rOuter} ${rOuter} 0 ${largeArcFlag} 1 ${endOuter.x} ${endOuter.y}`,
    `L ${endInner.x} ${endInner.y}`,
    `A ${rInner} ${rInner} 0 ${largeArcFlag} 0 ${startInner.x} ${startInner.y}`,
    'Z'
  ].join(' ')
}

const slicePaths = computed(() => {
  if (!props.items || props.items.length === 0 || totalCount.value === 0) return []

  const activeItems = props.items.filter(it => (Number(it.count) || 0) > 0)
  if (activeItems.length === 0) return []

  // If only 1 item has counts
  if (activeItems.length === 1) {
    const it = activeItems[0]
    const originalIndex = props.items.indexOf(it)
    const color = it.color || props.colors[originalIndex % props.colors.length]
    return [{
      label: it.text || it.label,
      count: it.count,
      percent: 100,
      color,
      d: describeDonutSegment(center.value, center.value, innerRadius.value, outerRadius.value, 0, 359.99)
    }]
  }

  let currentAngle = 0
  const result = []

  props.items.forEach((it, i) => {
    const count = Number(it.count) || 0
    if (count <= 0) return

    const sliceAngle = (count / totalCount.value) * 360
    const startAngle = currentAngle
    const endAngle = currentAngle + sliceAngle
    currentAngle = endAngle

    const color = it.color || props.colors[i % props.colors.length]
    const d = describeDonutSegment(center.value, center.value, innerRadius.value, outerRadius.value, startAngle, endAngle)

    result.push({
      originalIndex: i,
      label: it.text || it.label,
      count: it.count,
      percent: it.percent !== undefined ? it.percent : Math.round((count / totalCount.value) * 100),
      color,
      d
    })
  })

  return result
})
</script>

<style scoped>
.pie-chart-root {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
}

.chart-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.pie-svg {
  overflow: visible;
  filter: drop-shadow(0 2px 6px rgba(0, 0, 0, 0.04));
  transition: transform 0.2s ease;
}

.empty-ring {
  stroke: var(--color-border, #e2e8f0);
  stroke-dasharray: 4 4;
}

.slice-path {
  cursor: pointer;
  transition: transform 0.18s ease, filter 0.18s ease, opacity 0.18s ease;
  transform-origin: center center;
}

.slice-path:hover,
.slice-path--active {
  filter: drop-shadow(0 4px 10px rgba(0, 0, 0, 0.18));
  opacity: 0.95;
}

.center-label {
  pointer-events: none;
  text-anchor: middle;
  dominant-baseline: middle;
}

.center-total {
  font-size: 22px;
  font-weight: 700;
  fill: var(--color-text, #1e293b);
  letter-spacing: -0.02em;
}

.center-percent {
  font-size: 20px;
  font-weight: 700;
  fill: var(--color-primary, #3b82f6);
}

.center-sub {
  font-size: 11px;
  font-weight: 500;
  fill: var(--color-text-muted, #64748b);
  text-transform: lowercase;
}

.slice-tooltip {
  position: absolute;
  bottom: -18px;
  left: 50%;
  transform: translateX(-50%);
  background: var(--color-bg-elevated, #ffffff);
  border: 1px solid var(--color-border, #e2e8f0);
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.1);
  padding: 4px 10px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
  font-size: 11px;
  z-index: 10;
  pointer-events: none;
}

.tooltip-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.tooltip-text {
  font-weight: 500;
  color: var(--color-text, #1e293b);
  max-width: 140px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tooltip-val {
  font-weight: 700;
  color: var(--color-primary, #3b82f6);
}

.fade-fast-enter-active,
.fade-fast-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.fade-fast-enter-from,
.fade-fast-leave-to {
  opacity: 0;
  transform: translate(-50%, 4px);
}
</style>

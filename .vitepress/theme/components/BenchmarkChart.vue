<script setup lang="ts">
import { computed, ref } from 'vue'

const props = defineProps<{
  title: string
  labels: string[]
  series: { name: string; color: string; values: number[] }[]
  unit: string
}>()

const W = 560, H = 300
const padL = 60, padR = 20, padT = 30, padB = 50

const logScale = ref(false)

const allValues = computed(() => props.series.flatMap(s => s.values))
const maxVal = computed(() => Math.max(...allValues.value))
const minVal = computed(() => Math.min(...allValues.value.filter(v => v > 0)))

const logMin = computed(() => Math.pow(10, Math.floor(Math.log10(minVal.value))))
const logMax = computed(() => Math.pow(10, Math.ceil(Math.log10(maxVal.value))))

const xPos = (i: number) => padL + (i / (props.labels.length - 1)) * (W - padL - padR)

const yPos = (v: number) => {
  if (!logScale.value) {
    return padT + (1 - v / maxVal.value) * (H - padT - padB)
  }
  const lv = Math.log10(Math.max(v, logMin.value))
  const lMin = Math.log10(logMin.value)
  const lMax = Math.log10(logMax.value)
  return padT + (1 - (lv - lMin) / (lMax - lMin)) * (H - padT - padB)
}

const polyline = (values: number[]) =>
  values.map((v, i) => `${xPos(i)},${yPos(v)}`).join(' ')

// Linear ticks: 0 to max, 5 steps
const linearTicks = computed(() => {
  const count = 5
  return Array.from({ length: count + 1 }, (_, i) => (maxVal.value * i) / count)
})

// Log ticks: powers of 10 between logMin and logMax
const logTicks = computed(() => {
  const ticks: number[] = []
  const start = Math.floor(Math.log10(logMin.value))
  const end = Math.ceil(Math.log10(logMax.value))
  for (let e = start; e <= end; e++) {
    ticks.push(Math.pow(10, e))
  }
  return ticks
})

const yTicks = computed(() => logScale.value ? logTicks.value : linearTicks.value)

const fmt = (v: number) =>
  v >= 1000 ? (v / 1000).toFixed(1) + 'k' : v % 1 === 0 ? String(v) : v.toFixed(1)

// ── Tooltip ──────────────────────────────────────────────────────────────────
interface TooltipData {
  x: number   // px from SVG left edge (% of rendered width)
  y: number
  xPct: number  // 0–1, used to flip tooltip left/right
  label: string
  rows: { color: string; name: string; value: string }[]
}

const svgEl = ref<SVGSVGElement | null>(null)
const tooltip = ref<TooltipData | null>(null)

function onDotEnter(colIdx: number, e: MouseEvent) {
  const svg = svgEl.value
  if (!svg) return
  const rect = svg.getBoundingClientRect()
  const scaleX = rect.width / W
  const scaleY = rect.height / H

  const cx = xPos(colIdx) * scaleX
  const cy = Math.min(...props.series.map(s => yPos(s.values[colIdx]))) * scaleY

  tooltip.value = {
    x: cx,
    y: cy,
    xPct: colIdx / (props.labels.length - 1),
    label: props.labels[colIdx],
    rows: props.series.map(s => ({
      color: s.color,
      name: s.name,
      value: `${s.values[colIdx]} ${props.unit}`,
    })),
  }
}

function onDotLeave() {
  tooltip.value = null
}
</script>

<template>
  <div class="bc-wrap">
    <div class="bc-header">
      <div class="bc-title">{{ title }}</div>
      <div class="bc-header-right">
        <span class="bc-hint">悬停数据点查看详情</span>
        <div class="bc-toggle">
          <button
            :class="['bc-btn', !logScale && 'bc-btn-active']"
            @click="logScale = false"
          >线性</button>
          <button
            :class="['bc-btn', logScale && 'bc-btn-active']"
            @click="logScale = true"
          >对数</button>
        </div>
      </div>
    </div>
    <div class="bc-chart-row">
      <div class="bc-svg-wrap">
        <svg ref="svgEl" :viewBox="`0 0 ${W} ${H}`" class="bc-svg">
          <!-- grid lines -->
          <line
            v-for="t in yTicks"
            :key="t"
            :x1="padL" :y1="yPos(t)" :x2="W - padR" :y2="yPos(t)"
            stroke="var(--bc-grid)" stroke-width="1"
            :stroke-dasharray="logScale ? '4 3' : 'none'"
          />
          <!-- y axis labels -->
          <text
            v-for="t in yTicks"
            :key="'yl' + t"
            :x="padL - 6" :y="yPos(t) + 4"
            text-anchor="end" class="bc-axis-label"
          >{{ fmt(t) }}</text>
          <!-- x axis labels -->
          <text
            v-for="(lbl, i) in labels"
            :key="'xl' + i"
            :x="xPos(i)" :y="H - padB + 18"
            text-anchor="middle" class="bc-axis-label"
          >{{ lbl }}</text>
          <!-- series polylines -->
          <polyline
            v-for="s in series"
            :key="s.name"
            :points="polyline(s.values)"
            :stroke="s.color"
            fill="none" stroke-width="2.5"
            stroke-linejoin="round" stroke-linecap="round"
          />
          <!-- invisible wide hit targets per column -->
          <rect
            v-for="(lbl, i) in labels"
            :key="'hit' + i"
            :x="xPos(i) - 16" :y="padT"
            width="32" :height="H - padT - padB"
            fill="transparent"
            style="cursor: crosshair"
            @mouseenter="onDotEnter(i, $event)"
            @mouseleave="onDotLeave"
          />
          <!-- dots (rendered on top of hit targets) -->
          <template v-for="s in series" :key="'d' + s.name">
            <circle
              v-for="(v, i) in s.values"
              :key="i"
              :cx="xPos(i)" :cy="yPos(v)" r="4"
              :fill="s.color" stroke="var(--bc-dot-border)" stroke-width="1.5"
              style="pointer-events: none"
              :class="{ 'bc-dot-active': tooltip && tooltip.label === labels[i] }"
            />
          </template>
          <!-- axes -->
          <line :x1="padL" :y1="padT" :x2="padL" :y2="H - padB" stroke="var(--bc-axis)" stroke-width="1.5" />
          <line :x1="padL" :y1="H - padB" :x2="W - padR" :y2="H - padB" stroke="var(--bc-axis)" stroke-width="1.5" />
        </svg>

        <!-- Custom tooltip -->
        <Transition name="bc-fade">
          <div
            v-if="tooltip"
            class="bc-tooltip"
            :style="{
              left: tooltip.xPct > 0.6 ? 'auto' : tooltip.x + 'px',
              right: tooltip.xPct > 0.6 ? `calc(100% - ${tooltip.x}px)` : 'auto',
              top: (tooltip.y - 8) + 'px',
              transform: 'translateY(-100%)',
            }"
          >
            <div class="bc-tooltip-label">{{ tooltip.label }}</div>
            <div v-for="row in tooltip.rows" :key="row.name" class="bc-tooltip-row">
              <span class="bc-tooltip-dot" :style="{ background: row.color }" />
              <span class="bc-tooltip-name">{{ row.name }}</span>
              <span class="bc-tooltip-val">{{ row.value }}</span>
            </div>
          </div>
        </Transition>
      </div>

      <div class="bc-legend">
        <div v-for="s in series" :key="s.name" class="bc-legend-item">
          <span class="bc-legend-dot" :style="{ background: s.color }" />
          <span class="bc-legend-name">{{ s.name }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.bc-wrap {
  margin: 1.5em 0 2em;
  border: 1px solid var(--vp-c-divider);
  border-radius: 10px;
  padding: 1em 1.2em 0.8em;
  background: var(--vp-c-bg-soft);
}
.bc-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.7em;
  flex-wrap: wrap;
  gap: 0.5em;
}
.bc-title {
  font-weight: 600;
  font-size: 0.97em;
  color: var(--vp-c-text-1);
}
.bc-header-right {
  display: flex;
  align-items: center;
  gap: 0.75em;
}
.bc-hint {
  font-size: 0.78em;
  color: var(--vp-c-text-3);
  display: flex;
  align-items: center;
  gap: 0.3em;
}
.bc-hint::before {
  content: '⦿';
  font-size: 0.9em;
  opacity: 0.6;
}
.bc-toggle {
  display: flex;
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  overflow: hidden;
}
.bc-btn {
  padding: 3px 12px;
  font-size: 0.82em;
  background: transparent;
  border: none;
  cursor: pointer;
  color: var(--vp-c-text-2);
  transition: background 0.15s, color 0.15s;
}
.bc-btn:hover {
  background: var(--vp-c-bg-mute);
}
.bc-btn-active {
  background: var(--vp-c-brand-1);
  color: #fff !important;
}
.bc-chart-row {
  display: flex;
  align-items: flex-start;
  gap: 1em;
  flex-wrap: wrap;
}
.bc-svg-wrap {
  flex: 1 1 320px;
  min-width: 260px;
  max-width: 580px;
  position: relative;
}
.bc-svg {
  width: 100%;
  display: block;
}
.bc-axis-label {
  font-size: 11px;
  fill: var(--vp-c-text-2);
  font-family: var(--vp-font-family-mono, monospace);
}
:deep(.bc-dot-active) {
  r: 6;
  filter: drop-shadow(0 0 3px currentColor);
}
/* Tooltip */
.bc-tooltip {
  position: absolute;
  pointer-events: none;
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
  border-radius: 7px;
  padding: 7px 10px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.12);
  min-width: 180px;
  z-index: 10;
}
.bc-tooltip-label {
  font-size: 0.8em;
  font-weight: 600;
  color: var(--vp-c-text-2);
  margin-bottom: 5px;
  border-bottom: 1px solid var(--vp-c-divider);
  padding-bottom: 4px;
}
.bc-tooltip-row {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.82em;
  color: var(--vp-c-text-1);
  padding: 2px 0;
}
.bc-tooltip-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}
.bc-tooltip-name {
  flex: 1;
  color: var(--vp-c-text-2);
}
.bc-tooltip-val {
  font-family: var(--vp-font-family-mono, monospace);
  font-weight: 600;
}
/* Fade transition */
.bc-fade-enter-active,
.bc-fade-leave-active {
  transition: opacity 0.1s ease, transform 0.1s ease;
}
.bc-fade-enter-from,
.bc-fade-leave-to {
  opacity: 0;
  transform: translateY(calc(-100% - 4px));
}
.bc-legend {
  display: flex;
  flex-direction: column;
  gap: 0.45em;
  justify-content: center;
  padding: 0.2em 0;
  min-width: 160px;
}
.bc-legend-item {
  display: flex;
  align-items: center;
  gap: 0.45em;
  font-size: 0.88em;
  color: var(--vp-c-text-1);
}
.bc-legend-dot {
  display: inline-block;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  flex-shrink: 0;
}
</style>

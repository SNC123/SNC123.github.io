<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, nextTick } from 'vue'

const props = defineProps<{
  images: string | string[]
  layout?: 'row' | 'grid' | 'uniform'
  maxWidth?: number
  rowHeight?: number
}>()

const imageList = Array.isArray(props.images) ? props.images : [props.images]
const layout = props.layout ?? 'row'
const defaultMaxWidth = imageList.length === 1 ? 450 : 320
const maxWidth = props.maxWidth ?? defaultMaxWidth
const rowHeight = props.rowHeight ?? 280

// ── Lightbox ──────────────────────────────────────────────
const lightboxSrc = ref<string | null>(null)

function caption(src: string): string {
  const filename = src.split('/').pop() ?? src
  return filename.replace(/\.[^.]+$/, '')
}

function openLightbox(src: string) { lightboxSrc.value = src }
function closeLightbox() { lightboxSrc.value = null }
function onKeydown(e: KeyboardEvent) { if (e.key === 'Escape') closeLightbox() }
onMounted(() => window.addEventListener('keydown', onKeydown))
onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown)
  ro?.disconnect()
})

onMounted(() => {
  if (layout !== 'row') return
  const imgs = Array.from(galleryRef.value?.querySelectorAll('img') ?? []) as HTMLImageElement[]
  Promise.all(
    imgs.map(img => img.complete
      ? Promise.resolve()
      : new Promise<void>(r => { img.onload = () => r(); img.onerror = () => r() })
    )
  ).then(checkOverflow)
  ro = new ResizeObserver(checkOverflow)
  if (galleryRef.value) ro.observe(galleryRef.value)
})

// ── Carousel (uniform layout) ─────────────────────────────
// Also used for auto-detected overflow in row mode
const autoCarousel = ref(layout === 'uniform')
const galleryRef = ref<HTMLElement | null>(null)
const currentIndex = ref(0)
const stripRef = ref<HTMLElement | null>(null)
// plain array, no reactivity needed – only read in scrollToCurrent
const figRefs: (HTMLElement | null)[] = Array(imageList.length).fill(null)

let ro: ResizeObserver | null = null

function checkOverflow() {
  if (layout !== 'row' || autoCarousel.value || !galleryRef.value) return
  const el = galleryRef.value
  // Temporarily force nowrap to measure natural total width
  el.style.flexWrap = 'nowrap'
  const overflows = el.scrollWidth > el.clientWidth + 2
  el.style.flexWrap = ''
  if (overflows) {
    autoCarousel.value = true
    nextTick(scrollToCurrent)
    ro?.disconnect()
  }
}

function prevSlide() {
  currentIndex.value = (currentIndex.value - 1 + imageList.length) % imageList.length
}
function nextSlide() {
  currentIndex.value = (currentIndex.value + 1) % imageList.length
}
function goTo(i: number) { currentIndex.value = i }

function scrollToCurrent() {
  nextTick(() => {
    const strip = stripRef.value
    const fig = figRefs[currentIndex.value]
    if (!strip || !fig) return
    const target = fig.offsetLeft - (strip.clientWidth - fig.offsetWidth) / 2
    strip.scrollTo({ left: target, behavior: 'smooth' })
  })
}

watch(currentIndex, scrollToCurrent)
onMounted(scrollToCurrent)

function carouselOpacity(i: number): number {
  const n = imageList.length
  const dist = Math.min(Math.abs(i - currentIndex.value), n - Math.abs(i - currentIndex.value))
  if (dist === 0) return 1
  if (dist === 1) return 0.45
  return 0.15
}

// ── row / grid helpers ────────────────────────────────────
function imgStyle() {
  if (layout === 'row') {
    return { height: (rowHeight - 26) + 'px', width: 'auto', maxWidth: '480px' }
  }
  return {}
}

function figureStyle() {
  if (layout === 'grid') {
    return { flex: '1 1 0', maxWidth: maxWidth + 'px' }
  }
  return {}
}
</script>

<template>
  <!-- row / grid -->
  <div v-if="!autoCarousel" :class="['image-gallery', `layout-${layout}`]" ref="galleryRef">
    <figure
      v-for="src in imageList"
      :key="src"
      :style="figureStyle()"
      @click="openLightbox(src)"
    >
      <img :src="src" :alt="caption(src)" :style="imgStyle()" />
      <figcaption>{{ caption(src) }}</figcaption>
    </figure>
  </div>

  <!-- uniform: carousel -->
  <div v-else class="carousel" :style="{ '--img-h': (rowHeight - 26) + 'px' }">
    <button
      v-if="imageList.length > 1"
      class="carousel-btn"
      @click="prevSlide"
      aria-label="上一张"
    >&#8249;</button>

    <div class="carousel-strip" ref="stripRef">
      <figure
        v-for="(src, i) in imageList"
        :key="src"
        class="carousel-figure"
        :ref="(el) => { figRefs[i] = el as HTMLElement | null }"
        :style="{
          opacity: carouselOpacity(i),
          cursor: i === currentIndex ? 'zoom-in' : 'pointer',
          transform: i === currentIndex ? 'scale(1)' : 'scale(0.92)',
        }"
        @click="i === currentIndex ? openLightbox(src) : goTo(i)"
      >
        <img :src="src" :alt="caption(src)" />
        <figcaption>{{ caption(src) }}</figcaption>
      </figure>
    </div>

    <button
      v-if="imageList.length > 1"
      class="carousel-btn"
      @click="nextSlide"
      aria-label="下一张"
    >&#8250;</button>
  </div>

  <!-- Lightbox -->
  <Teleport to="body">
    <div v-if="lightboxSrc" class="lightbox-overlay" @click="closeLightbox">
      <button class="lightbox-close" @click="closeLightbox" aria-label="关闭">✕</button>
      <figure class="lightbox-figure" @click.stop>
        <img class="lightbox-img" :src="lightboxSrc" :alt="caption(lightboxSrc)" />
        <figcaption class="lightbox-caption">{{ caption(lightboxSrc) }}</figcaption>
      </figure>
    </div>
  </Teleport>
</template>

<style scoped>
/* ── row / grid ── */
.image-gallery {
  display: flex;
  justify-content: center;
  gap: 1.5rem;
  margin: 1.5rem 0;
}

.layout-row {
  flex-wrap: wrap;
  align-items: flex-end;
}

.layout-grid {
  flex-wrap: wrap;
}

figure {
  margin: 0;
  text-align: center;
  flex-shrink: 0;
  cursor: zoom-in;
}

figure img {
  display: block;
  border-radius: 8px;
  object-fit: contain;
  transition: opacity 0.15s ease, transform 0.2s ease;
}

figure:hover img {
  opacity: 0.82;
  transform: scale(1.03);
}

figcaption {
  margin-top: 0.45rem;
  font-size: 0.95em;
  color: var(--vp-c-text-2);
}

.layout-grid figure img {
  width: 100%;
}

/* ── Carousel ── */
.carousel {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 1.5rem 0;
}

.carousel-strip {
  flex: 1;
  display: flex;
  align-items: flex-end;
  gap: 1.2rem;
  overflow-x: scroll;
  overflow-y: hidden;
  scrollbar-width: none;
  /* 两端各留半个视口的 padding，使首尾图片也能滚到正中央 */
  padding-block: 0.4rem;
  padding-inline: 40%;
  scroll-snap-type: x mandatory;
}

.carousel-strip::-webkit-scrollbar {
  display: none;
}

.carousel-figure {
  flex-shrink: 0;
  margin: 0;
  text-align: center;
  transition: opacity 0.3s ease, transform 0.3s ease;
  scroll-snap-align: center;
}

.carousel-figure img {
  display: block;
  height: var(--img-h);
  width: auto;
  border-radius: 8px;
}

.carousel-figure figcaption {
  margin-top: 0.45rem;
  font-size: 0.95em;
  color: var(--vp-c-text-2);
}

.carousel-btn {
  flex-shrink: 0;
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  border-radius: 50%;
  width: 2.2rem;
  height: 2.2rem;
  font-size: 1.6rem;
  line-height: 1;
  cursor: pointer;
  color: var(--vp-c-text-1);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s;
  user-select: none;
}

.carousel-btn:hover {
  background: var(--vp-c-bg-mute);
}

/* ── Lightbox ── */
.lightbox-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.88);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  cursor: zoom-out;
}

.lightbox-close {
  position: fixed;
  top: 1.2rem;
  right: 1.5rem;
  background: rgba(255, 255, 255, 0.15);
  border: none;
  color: #fff;
  font-size: 1.4rem;
  line-height: 1;
  width: 2.2rem;
  height: 2.2rem;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s;
}

.lightbox-close:hover {
  background: rgba(255, 255, 255, 0.3);
}

.lightbox-figure {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  cursor: default;
  max-width: 92vw;
  max-height: 92vh;
}

.lightbox-img {
  max-width: 90vw;
  max-height: 82vh;
  object-fit: contain;
  border-radius: 6px;
  box-shadow: 0 8px 40px rgba(0, 0, 0, 0.6);
}

.lightbox-caption {
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.9em;
  margin: 0;
}
</style>

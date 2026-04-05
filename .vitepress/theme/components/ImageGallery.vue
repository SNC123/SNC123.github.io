<script setup lang="ts">
const props = defineProps<{
  images: string | string[]
  layout?: 'row' | 'grid'
  maxWidth?: number
}>()

const imageList = Array.isArray(props.images) ? props.images : [props.images]
const layout = props.layout ?? 'row'
const defaultMaxWidth = imageList.length === 1 ? 450 : 320
const maxWidth = props.maxWidth ?? defaultMaxWidth

function caption(src: string): string {
  const filename = src.split('/').pop() ?? src
  return filename.replace(/\.[^.]+$/, '')
}

function figureStyle() {
  return { flex: '1 1 0', maxWidth: maxWidth + 'px' }
}
</script>

<template>
  <div :class="['image-gallery', `layout-${layout}`]">
    <figure v-for="src in imageList" :key="src" :style="figureStyle()">
      <img :src="src" :alt="caption(src)" />
      <figcaption>{{ caption(src) }}</figcaption>
    </figure>
  </div>
</template>

<style scoped>
.image-gallery {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 1.5rem;
  margin: 1.5rem 0;
}

.layout-row {
  flex-direction: row;
  align-items: flex-end;
}

.layout-grid {
  flex-direction: row;
}

figure {
  margin: 0;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  min-width: 0;
}

figure img {
  width: 100%;
  border-radius: 6px;
  object-fit: contain;
}

figcaption {
  font-size: 0.85em;
  color: var(--vp-c-text-2);
}
</style>

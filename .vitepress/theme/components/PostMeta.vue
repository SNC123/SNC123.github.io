<script setup lang="ts">
import { useData } from 'vitepress'
import { computed } from 'vue'

const { frontmatter, page } = useData()

const createdAt = computed(() => {
  const d = frontmatter.value.date
  if (!d) return null
  return new Date(d).toLocaleDateString('zh-CN', {
    year: 'numeric', month: 'long', day: 'numeric'
  })
})

const updatedAt = computed(() => {
  const ts = page.value.lastUpdated
  if (!ts) return null
  return new Date(ts).toLocaleString('zh-CN', {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
})
</script>

<template>
  <div v-if="createdAt || updatedAt" class="post-meta">
    <span v-if="createdAt" class="post-meta-item">
      <span class="post-meta-icon"></span>发布于 {{ createdAt }}
    </span>
    <span v-if="updatedAt" class="post-meta-item">
      <span class="post-meta-icon"></span>更新于 {{ updatedAt }}
    </span>
  </div>
</template>

<style scoped>
.post-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 1em;
  margin: -0.5em 0 1.5em;
  font-size: 0.88em;
  color: var(--vp-c-text-3);
}
.post-meta-item {
  display: flex;
  align-items: center;
  gap: 0.3em;
}
.post-meta-icon {
  font-size: 0.95em;
}
</style>

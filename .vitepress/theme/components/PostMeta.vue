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
    <div v-if="createdAt" class="post-meta-item">
      <span class="post-meta-label">发布于</span>{{ createdAt }}
    </div>
    <div v-if="updatedAt" class="post-meta-item">
      <span class="post-meta-label">更新于</span>{{ updatedAt }}
    </div>
  </div>
</template>

<style scoped>
.post-meta {
  display: flex;
  flex-direction: column;
  gap: 0.35em;
  margin-bottom: 1em;
  padding-bottom: 0.9em;
  border-bottom: 1px solid var(--vp-c-divider);
  font-size: 0.82em;
  color: var(--vp-c-text-2);
}
.post-meta-item {
  display: flex;
  align-items: baseline;
  gap: 0.4em;
}
.post-meta-label {
  color: var(--vp-c-text-3);
  white-space: nowrap;
}
</style>

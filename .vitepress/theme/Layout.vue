<script setup lang="ts">
import DefaultTheme from 'vitepress/theme'
import PostMeta from './components/PostMeta.vue'

const { Layout } = DefaultTheme
</script>

<template>
  <Layout>
    <template #aside-outline-before>
      <PostMeta />
    </template>
  </Layout>
</template>

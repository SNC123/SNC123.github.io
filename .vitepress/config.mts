import { defineConfig } from 'vitepress'
import mathjax3 from 'markdown-it-mathjax3'

export default defineConfig({
  title: 'SNC123的博客',
  description: 'A VitePress Blog',
  markdown: {
    config: (md) => {
      md.use(mathjax3)
    }
  },
  themeConfig: {
    nav: [
      { text: '首页', link: '/' },
      { text: '文章', link: '/posts/' }
    ],
    sidebar: {
      '/posts/': [
        {
          text: '文章',
          items: [
            { text: 'VitePress 入门指南', link: '/posts/hello-vitepress' },
            { text: '基础使用：图片与公式', link: '/posts/basic-usage' }
          ]
        }
      ]
    },
    socialLinks: [
      { icon: 'github', link: 'https://github.com/SNC123' }
    ]
  }
})

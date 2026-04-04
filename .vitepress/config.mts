import { defineConfig } from 'vitepress'
import mathjax3 from 'markdown-it-mathjax3'

export default defineConfig({
  // title: 'SNC123的博客',
  description: 'A VitePress Blog',
  lastUpdated: true,
  markdown: {
    config: (md) => {
      md.use(mathjax3)

      // 自动在每篇文章第一个 h1 后注入 <PostMeta />
      md.core.ruler.push('inject-post-meta', (state) => {
        const tokens = state.tokens
        for (let i = 0; i < tokens.length; i++) {
          if (tokens[i].type === 'heading_open' && tokens[i].tag === 'h1') {
            let closeIdx = i + 1
            while (closeIdx < tokens.length && tokens[closeIdx].type !== 'heading_close') {
              closeIdx++
            }
            const metaToken = new state.Token('html_block', '', 0)
            metaToken.content = '<PostMeta />\n'
            tokens.splice(closeIdx + 1, 0, metaToken)
            break
          }
        }
      })
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
          text: '关于VitePress',
          collapsed: false,
          items: [
            { text: 'VitePress 入门指南', link: '/posts/vitepress/hello-vitepress' },
            { text: '基础使用', link: '/posts/vitepress/basic-usage' }
          ]
        },
        {
          text: '计算机系统(Sys)',
          collapsed: false,
          items: [
            { text: 'ShardCounter 性能优化', link: '/posts/computer_system/notes/ShardCounter性能优化' }
          ]
        }
      ]
    },
    socialLinks: [
      { icon: 'github', link: 'https://github.com/SNC123' }
    ],
    outline: {
      label: '本页目录'
    },
    sidebarMenuLabel: '菜单',
    returnToTopLabel: '回到顶部',
    darkModeSwitchLabel: '主题',
    lightModeSwitchTitle: '切换到浅色模式',
    darkModeSwitchTitle: '切换到深色模式',
    docFooter: {
      prev: '上一篇',
      next: '下一篇'
    },
    lastUpdated: {
      text: '最后更新于',
      formatOptions: {
        dateStyle: 'short',
        timeStyle: 'short'
      }
    }
  }
})

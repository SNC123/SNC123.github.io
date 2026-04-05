import { defineConfig, type DefaultTheme } from 'vitepress'
import mathjax3 from 'markdown-it-mathjax3'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const postsSidebar: DefaultTheme.SidebarItem[] = [
  {
    text: '关于VitePress',
    collapsed: true,
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
  },
  {
    text: '博物(Nature)',
    collapsed: false,
    items: [
      { text: '花卉分类基本方法', link: '/posts/nature/花卉分类基本方法.md' }
    ]
  }
]

function generatePostsIndex(sidebar: DefaultTheme.SidebarItem[]): string {
  let md = '# 文章列表\n\n欢迎来到我的博客！\n'
  for (const section of sidebar) {
    md += `\n## ${section.text}\n\n`
    for (const item of section.items ?? []) {
      const relLink = (item.link ?? '').replace(/^\/posts\//, './')
      md += `- [${item.text}](${relLink})\n`
    }
  }
  return md
}

function autoPostsIndexPlugin() {
  return {
    name: 'auto-posts-index',
    buildStart() {
      const indexPath = path.resolve(__dirname, '../posts/index.md')
      fs.writeFileSync(indexPath, generatePostsIndex(postsSidebar), 'utf-8')
    }
  }
}

export default defineConfig({
  // title: 'SNC123的博客',
  description: 'A VitePress Blog',
  lastUpdated: true,
  markdown: {
    config: (md) => {
      md.use(mathjax3)
    }
  },
  vite: {
    plugins: [autoPostsIndexPlugin()]
  },
  themeConfig: {
    nav: [
      { text: '首页', link: '/' },
      { text: '文章', link: '/posts/' }
    ],
    sidebar: {
      '/posts/': postsSidebar
    },
    socialLinks: [
      { icon: 'github', link: 'https://github.com/SNC123' }
    ],
    outline: {
      level: [2, 3],
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
    }
  }
})

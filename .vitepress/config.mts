import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'My Blog',
  description: 'A VitePress Blog',
  themeConfig: {
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Posts', link: '/posts/' }
    ],
    sidebar: {
      '/posts/': [
        {
          text: 'Posts',
          items: [
            { text: 'Hello VitePress', link: '/posts/hello-vitepress' },
            { text: 'Getting Started', link: '/posts/getting-started' }
          ]
        }
      ]
    },
    socialLinks: [
      { icon: 'github', link: 'https://github.com' }
    ]
  }
})

import DefaultTheme from 'vitepress/theme'
import type { Theme } from 'vitepress'
import BenchmarkChart from './components/BenchmarkChart.vue'
import PostMeta from './components/PostMeta.vue'
import EncryptedPage from './components/EncryptedPage.vue'
import Layout from './Layout.vue'
import './styles/custom.css'

export default {
  extends: DefaultTheme,
  Layout,
  enhanceApp({ app }) {
    app.component('BenchmarkChart', BenchmarkChart)
    app.component('PostMeta', PostMeta)
    app.component('EncryptedPage', EncryptedPage)
  }
} satisfies Theme

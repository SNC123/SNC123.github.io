# VitePress 入门指南

*2026 年 4 月 4 日*

欢迎来到我的博客！本站由 [VitePress](https://vitepress.dev/) 驱动。

VitePress 是基于 Vite 和 Vue 3 构建的静态站点生成器，专为文档和博客场景设计。

## 为什么选择 VitePress？

- **快速** — 毫秒级服务器启动，支持热模块替换
- **简洁** — 用 Markdown 写作，自动生成美观的页面
- **强大** — 在 Markdown 中可直接使用 Vue 组件

## 代码示例

```javascript
// 来自 VitePress 的问候
const greet = (name) => `你好，${name}！`
console.log(greet('世界'))
```

---

## 新建文章

在 `posts/` 目录下新建一个 `.md` 文件：

```
posts/
  my-new-post.md
```

然后在 `.vitepress/config.mts` 的 `sidebar` 中注册该文件。

## Frontmatter

在文章顶部添加元数据：

```yaml
---
title: 我的文章
date: 2026-04-04
---
```

## Markdown 特性

VitePress 支持标准 Markdown 的全部语法，还额外支持：

- 语法高亮
- 自定义容器（提示框）
- 在 Markdown 中直接使用 Vue 组件
- 数学公式（见[基础使用](./basic-usage)）

# 快速上手

*2026 年 4 月 4 日*

本文介绍如何为本博客撰写文章。

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

祝写作愉快！

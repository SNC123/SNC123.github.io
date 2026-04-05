---
date: 2026-04-04
---

# 基础使用

本文演示在 VitePress 博客中插入图片和数学公式的方法。

## 插入图片

### 外部图片

直接使用标准 Markdown 语法引用网络图片：

```markdown
![VitePress Logo](https://vitepress.dev/vitepress-logo-large.webp)
```

![VitePress Logo](https://vitepress.dev/vitepress-logo-large.webp)

### 本地图片

方式一：绝对路径

将图片放在项目根目录的 `public/` 下，构建时会原样复制到站点根目录，使用绝对路径引用：

```
public/
  images/
    vitepress-logo-mini.svg
```

```markdown
![VitePress Logo](/images/vitepress-logo-mini.svg)
```
方式二：相对路径

将图片放在与文章相同的目录下，使用相对路径引用，VitePress 会自动处理打包：

```
posts/
  basic-usage.md
  vitepress-logo-mini.svg   ← 与文章同级
```

```markdown
![VitePress Logo](./vitepress-logo-mini.svg)
```


### 指定图片大小

VitePress 支持通过 HTML 控制尺寸：

```html
<img src="./vitepress-logo-mini.svg" width="80" alt="logo" />
```

<img src="./vitepress-logo-mini.svg" width="80" alt="logo" />

### 图片居中

```html
<img src="./vitepress-logo-mini.svg" width="80" style="display:block;margin:0 auto" alt="logo" />
```

<img src="./vitepress-logo-mini.svg" width="80" style="display:block;margin:0 auto" alt="logo" />


## 数学公式

本站使用 [MathJax](https://www.mathjax.org/) 渲染 LaTeX 公式。

### 行内公式

用 `$...$` 包裹行内公式。

```markdown
欧拉恒等式：$e^{i\pi} + 1 = 0$
```

效果：欧拉恒等式：$e^{i\pi} + 1 = 0$

### 块级公式

用 `$$...$$` 包裹独立成行的公式。

**二次方程求根公式：**

```latex
$$
x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}
$$
```

$$
x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}
$$

**正态分布概率密度函数：**

$$
f(x) = \frac{1}{\sigma\sqrt{2\pi}} e^{-\frac{1}{2}\left(\frac{x-\mu}{\sigma}\right)^2}
$$

**矩阵：**

$$
A = \begin{pmatrix} a_{11} & a_{12} \\ a_{21} & a_{22} \end{pmatrix}
$$

**求和与积分：**

$$
\sum_{n=1}^{\infty} \frac{1}{n^2} = \frac{\pi^2}{6}, \qquad \int_{-\infty}^{\infty} e^{-x^2}\,dx = \sqrt{\pi}
$$

## 图表组件

本站内置了 `BenchmarkChart` Vue 组件，可在任意 Markdown 文章中直接使用，无需 `import`。

### 用法

在 Markdown 中插入以下标签：

```html
<BenchmarkChart
  title="图表标题"
  :labels="['A', 'B', 'C', 'D']"
  :series="[
    { name: '方案一', color: '#e05c5c', values: [10, 20, 30, 40] },
    { name: '方案二', color: '#56c26e', values: [5, 25, 50, 100] },
  ]"
  unit="ms"
/>
```

### 参数说明

| 参数 | 类型 | 说明 |
|------|------|------|
| `title` | `string` | 图表标题，显示在左上角 |
| `labels` | `string[]` | X 轴刻度标签数组 |
| `series` | `object[]` | 数据系列，每项含 `name`（名称）、`color`（颜色）、`values`（数值数组） |
| `unit` | `string` | 数值单位，显示在 tooltip 中 |

### 示例效果

<BenchmarkChart
  title="示例：两组数据对比"
  :labels="['Q1', 'Q2', 'Q3', 'Q4']"
  :series="[
    { name: '方案一', color: '#e05c5c', values: [10, 8, 7, 6] },
    { name: '方案二', color: '#56c26e', values: [10, 18, 32, 60] },
  ]"
  unit="M ops/s"
/>

### 线性 / 对数轴切换

图表右上角提供「线性」与「对数」两种坐标轴模式，点击可切换。

当各方案数值相差数量级时（如性能基准测试），切换到对数轴可清晰展示各方案间的差异：

<BenchmarkChart
  title="对数轴示例：跨越多个数量级"
  :labels="['1线程', '2线程', '4线程', '48线程']"
  :series="[
    { name: '方案一 SingleAtomic', color: '#e05c5c', values: [133.7, 56.6, 51.9, 43.1] },
    { name: '方案二 HashShard',    color: '#f0a500', values: [76.1, 149.4, 297.3, 743.2] },
    { name: '方案三 ThreadLocal',  color: '#56c26e', values: [411.7, 823.4, 1638.8, 7458.3] },
  ]"
  unit="M ops/s"
/>

> [!TIP]
> 悬停在数据点上可查看该列所有方案的精确数值。

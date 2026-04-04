# 基础使用：图片与公式

*2026 年 4 月 4 日*

本文演示在 VitePress 博客中插入图片和数学公式的方法。

## 插入图片

### 外部图片

直接使用标准 Markdown 语法引用网络图片：

```markdown
![VitePress Logo](https://vitepress.dev/vitepress-logo-large.webp)
```

效果：

![VitePress Logo](https://vitepress.dev/vitepress-logo-large.webp)

### 本地图片：方式一 —— `public/` 目录（绝对路径）

将图片放在项目根目录的 `public/` 下，构建时会原样复制到站点根目录，使用绝对路径引用：

```
public/
  images/
    vitepress-logo-mini.svg
```

```markdown
![VitePress Logo](/images/vitepress-logo-mini.svg)
```

效果：

![VitePress Logo](/images/vitepress-logo-mini.svg)

**适合场景：** 多篇文章共用的图片、favicon、全局资源。

---

### 本地图片：方式二 —— 与 `.md` 同级（相对路径）

将图片放在与文章相同的目录下，使用相对路径引用，VitePress 会自动处理打包：

```
posts/
  basic-usage.md
  vitepress-logo-mini.svg   ← 与文章同级
```

```markdown
![VitePress Logo](./vitepress-logo-mini.svg)
```

效果：

![VitePress Logo](./vitepress-logo-mini.svg)

**适合场景：** 仅某篇文章使用的配图，与文章放在一起便于管理。

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

效果：

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

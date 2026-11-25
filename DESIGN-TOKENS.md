# 《共鸣 RESONANCE》Design Tokens · v0.1

> 浙江省桐乡市高级中学 音乐社 × 化学社 × 哲学社 × 新闻社 × 数学社 联袂出品 · 开放校外征稿
> 范围：扉页 + 正文（封面 / 封底暂缓）
> 渲染链：DOCX → Pandoc → HTML 模板 → Playwright + Headless Chrome → PDF（RGB）→ 色彩重映射 → PDF/X（CMYK）

本文件是全书唯一的视觉事实来源。`src/tokens.css` 必须由本文件第 9 节逐字生成，模板里不允许出现本文件以外的尺寸、字号和颜色值。

---

## 0. 设计原则

参照瑞士国际主义风格（International Typographic Style），但不做成"极简白板"：

1. **网格先行**：所有元素都落在 12 栏模块网格与 15 pt 基线网格上。
2. **字体即图形**：用 Google Sans 的超大数字、窄体粗体、字重对比制造视觉张力，不靠装饰图片。
3. **非对称**：标题区左对齐、右侧留白，页码和栏外标题放在外切口。
4. **一个信号色 + 社团色码**：全书只有一个品牌红；五个社团各有一个识别色，只用于色条、编号、标签等小面积元素。
5. **克制里要有节奏**：每篇的开篇页做足（大编号、粗线、社团色块），正文页安静。
6. **文学与非文学分开**：文学用思源宋体，非文学用思源黑体 + Google Sans。

---

## 1. 页面与出血

| Token | 值 | 说明 |
|---|---|---|
| `page.trim` | 210 × 297 mm | A4 成品尺寸 |
| `page.bleed` | 3 mm | 四边出血；印刷版 MediaBox = 216 × 303 mm |
| `page.safe` | 5 mm | 裁切线内 5 mm 为安全区，文字和页码不得越过 |
| `page.slug` | 0 | 不设辅助信息区；裁切标记只在 CMYK 校样版加 |
| `binding` | 胶装，左翻 | 奇数页 = 右页 (recto) |

**两套输出的页面框**

| 构建版本 | MediaBox | TrimBox | BleedBox |
|---|---|---|---|
| `screen-rgb` | 210 × 297 | = Media | = Media |
| `print-rgb` / `print-cmyk` | 216 × 303 | 内缩 3 mm | = Media |

Chrome 直接按 216 × 303 mm 出页；TrimBox 和 BleedBox 在后处理阶段写入。

---

## 2. 版心与网格

### 2.1 边距（左右页镜像）

| Token | mm | pt |
|---|---|---|
| `margin.top` | 20 | 56.69 |
| `margin.bottom` | 23 | 65.20 |
| `margin.inner`（订口） | 20 | 56.69 |
| `margin.outer`（切口） | 15 | 42.52 |
| 版心 | 175 × 254 | **496 × 720** |

### 2.2 栏网格

| Token | 值 |
|---|---|
| `grid.columns` | 12 |
| `grid.col` | 26.667 pt |
| `grid.gutter` | 16 pt（≈ 5.64 mm） |
| `text.columns` | **2**（正文 = 6 + 6 模块） |
| `text.col-width` | **240 pt**（84.67 mm） |
| `text.col-gap` | 16 pt |
| `text.col-rule` | 无（瑞士风格靠留白分栏） |

正文栏宽 240 pt 是按字数反推的：宋体 9.6 pt 正好每行 25 字，所以文学正文的字能严格对齐网格。

### 2.3 基线网格

| Token | 值 |
|---|---|
| `baseline` | **15 pt**（5.2917 mm） |
| `baseline.half` | 7.5 pt |
| 每栏行数 | 48 行（48 × 15 = 720 pt = 版心高） |

规则：所有行距、段前段后、图片高度、标题区高度都取 `baseline.half` 的整数倍。图片高度向上取整到 15 pt 的倍数，余量放在图注下方。

### 2.4 篇首页分区（Swiss Opener）

```
┌──────────────── 12 cols ────────────────┐
│ [社团色条 4pt × 2 cols]   CH 01 / 03     │ ← 第 1 行
│                                          │
│  03                    (大编号, 1–5 栏)  │ ← 第 2–9 行（8 行 = 120 pt）
│                                          │
│  标题 Title (1–9 栏)                     │ ← 第 10–15 行
│  —— 副标题                               │
│  ─────────────── 1.5pt 黑线 ──────────── │ ← 第 16 行
│  作者 / 单位        社团标签   形式标签  │ ← 第 17 行
│ ┌──── col A ────┐  ┌──── col B ────┐    │ ← 第 19–48 行：双栏正文
```

- 标题区固定占 **18 行（270 pt）**，正文从第 19 行起排。
- 短诗（`form: poem` 且不超过 30 行）：单页排完，正文改为单栏，左对齐到第 4 栏。

---

## 3. 字体

### 3.1 字体文件（`fonts/`）

> ⚠️ 状态：`scripts/fonts.py` 还没有执行成功，`fonts/` 目录目前是空的。开始写模板之前必须先跑一遍。

| 族名（CSS） | 文件 | 来源 | 用途 |
|---|---|---|---|
| `GS Text` 400/500/700 | `GSF-Text-{Regular,Medium,Bold}.ttf` | Google Sans Flex 静态实例，opsz 12，wdth 100 | 西文 / 数字正文、页眉页脚、图注 |
| `GS Display` 300/500/700 | `GSF-Display-{Light,Medium,Bold}.ttf` | opsz 72，wdth 100 | 标题中的西文、扉页 |
| `GS Cond` 500/700/900 | `GSF-Cond-{Medium,Bold,Black}.ttf` | opsz 72，wdth 最窄 | 大编号、RESONANCE 字标、章节号 |
| `SHS` 300/400/500/700/900 | `SourceHanSansSC-*.otf` | 思源黑体 | 非文学正文、所有中文标题 |
| `SHSerif` 300/400/500/600/700/900 | `NotoSerifCJKsc-*.otf` | 思源宋体（Noto Serif CJK 与思源宋体字形相同） | 文学正文 |
| `KaTeX_*` | `node_modules/katex/dist/fonts` | KaTeX | 公式 |

可变字体要先做成静态实例再用。Chrome 能在 PDF 里嵌入可变字体，但部分 RIP 对可变字体的 PDF/X 支持不稳定，所以不直接用。

### 3.2 字族栈

```
--ff-ui:      "GS Text", "SHS", sans-serif;          /* 全书核心设计语言 */
--ff-display: "GS Display", "SHS", sans-serif;
--ff-cond:    "GS Cond", "GS Display", sans-serif;
--ff-sans:    "GS Text", "SHS", sans-serif;          /* 非文学正文：西文、数字走 Google Sans */
--ff-serif:   "SHSerif", serif;                      /* 文学正文：中西文统一用宋体 */
```

Google Sans 排在思源黑体前面，西文和数字会自动用 Google Sans，汉字回落到思源黑体。

### 3.3 文体 → 字体映射（由 `manifest.json` 的 `form` 字段驱动）

| form | 文体 | 正文字体 | 典型篇目 |
|---|---|---|---|
| `prose` | 散文 | `--ff-serif` | 1-1、1-3、1-7 |
| `fiction` | 小说 | `--ff-serif` | 1-2、1-9、1-10 |
| `poem` | 诗 | `--ff-serif` | 1-5、1-6、1-8 |
| `lyrics` | 歌词 | `--ff-serif` | 2-7 |
| `essay` | 科普 / 评论 | `--ff-sans` | 2-1 ～ 2-9 |

**例外**：1-4《在世界中心呼唤名为爱的野兽》在 manifest 里标的是 `essay`，但它是文学评论，放在第一章（文学）。默认按 `--ff-serif` 排，用 `manifest.override.font = "serif"` 处理。**待你确认。**

不论正文用什么字体，标题、编号、页眉页脚、图注、表格一律用 `--ff-ui` 或 `--ff-display`。这样 Google Sans 贯穿全书，是统一的设计语言。

---

## 4. 字号阶梯

单位 pt。行高都是 7.5 pt 的倍数。

| Token | 字体 | 字号 / 行高 | 字重 | 字距 | 用途 |
|---|---|---|---|---|---|
| `t.mega` | GS Cond | 168 / 150 | 900 | -0.02em | 篇首大编号 `03` |
| `t.chapter` | GS Cond | 240 / 210 | 900 | -0.03em | 章扉页编号 |
| `t.wordmark` | GS Cond | 72 / 75 | 900 | 0.02em | RESONANCE 字标（扉页） |
| `t.title` | SHS + GS Display | 30 / 37.5 | 700 | -0.01em，`palt` | 篇名 |
| `t.title-long` | 同上 | 24 / 30 | 700 | `palt` | 篇名超过 12 字时用（如 1-4、2-6） |
| `t.subtitle` | SHS | 12 / 22.5 | 400 | 0 | 副标题，前面加"——" |
| `t.lead` | SHS / SHSerif | 11 / 22.5 | 400 | 0 | 导语（可选） |
| `t.h2` | SHS | 12 / 22.5 | 700 | 0 | 正文内的章节（"第一章"、"Part 1"） |
| `t.h3` | SHS | 9.6 / 15 | 700 | 0 | 小标题 |
| `t.body-serif` | SHSerif | **9.6 / 15** | 400 | 0 | 文学正文，每行 25 字 |
| `t.body-sans` | GS Text + SHS | **9.25 / 15** | 400 | 0 | 非文学正文 |
| `t.poem` | SHSerif | 10.5 / 22.5 | 400 | 0 | 诗行（行距加大） |
| `t.byline` | GS Text + SHS | 8 / 15 | 500 | 0.02em | 作者、单位 |
| `t.tag` | GS Text | 7 / 7.5 | 700 | 0.12em，大写 | 社团标签 `MATH`、`MUSIC` |
| `t.caption` | GS Text + SHS | 7.5 / 11.25 | 400 | 0 | 图注、表注 |
| `t.table` | GS Text + SHS | 8 / 11.25 | 400 | 0 | 表格 |
| `t.note` | GS Text + SHS | 7.5 / 11.25 | 400 | 0 | 篇末注释（①②③） |
| `t.folio` | GS Text | 8 / 7.5 | 700 | 0.04em，等宽数字 `tnum` | 页码 |
| `t.runhead` | GS Text + SHS | 7 / 7.5 | 500 | 0.08em | 栏外标题 |
| `t.math` | KaTeX | 1.05em | — | — | 行内公式按正文字号的 1.05 倍 |

---

## 5. 中文排版规则

| Token | 值 |
|---|---|
| `p.indent` | `2em`（散文、小说、科普文都缩进） |
| `p.indent.poem` | 0 |
| `p.space` | 0（段间不留空，靠缩进区分段落） |
| `text-align` | `justify`（两端对齐） |
| `line-break` | `strict`（严格执行中文禁则） |
| `text-spacing-trim` | `space-first`（行首标点挤压） |
| `text-autospace` | `normal`（中西文之间自动加间距；Chrome 140+ 支持） |
| `hyphens` | `auto`（只对西文单词生效） |
| `font-kerning` | `normal` |
| 标点挤压 `palt` | 只在标题、标签上开，正文不开 |
| `orphans` / `widows` | 2 / 2 |
| `h2`、`h3` | `break-after: avoid` |

**预处理清洗**（DOCX → HTML 阶段）：

- 删除行首的全角空格（`\u3000`）、`&nbsp;` 和手打的缩进空格，缩进统一交给 CSS。1-1 和 1-4 有这种情况。
- 删除中西文之间手打的半角空格，否则会和 `text-autospace` 叠加，空隙变成双倍。
- 引号统一用 `“ ”` 和 `‘ ’`。修正 1-9 里写反的“林汀用手点了一下江之弋的前额，”这类引号。
- 破折号统一成 `——`（U+2014 × 2），省略号统一成 `……`。
- 1-4 里的 `--` 改成 `——`。1-4 的“t陶喆”看起来是笔误，**不自动改，记进 `content/errata.md` 请编辑确认**。

---

## 6. 色彩

### 6.1 原则

- **CSS 只用实色**：禁止 `opacity`、`rgba()`、`mix-blend-mode`、渐变。否则 PDF 里会生成透明组和混合色，没法精确换算成 CMYK。
- **每个色值的 RGB hex 必须唯一**。CMYK 构建时会按 hex 精确匹配，把矢量和文字颜色换成指定的 CMYK 值（见 6.4），所以 hex 不能撞。
- 正文和所有小于 12 pt 的字只用 `ink`（K100 单色黑），**不能用四色黑**，否则套印偏差会让小字发虚。
- 总墨量 ≤ 300%（对应 ISO Coated v2 300% / FOGRA39）。

### 6.2 中性色

| Token | CSS（RGB） | CMYK | 用途 |
|---|---|---|---|
| `c.paper` | `#FFFFFF` | 0 / 0 / 0 / 0 | 纸张 |
| `c.ink` | `#1D1D1B` | 0 / 0 / 0 / 100 | 正文、标题、粗线 |
| `c.rich` | `#000001` | 50 / 40 / 40 / 100 | 只用于 ≥ 60 pt 的大编号、大面积黑块 |
| `c.k70` | `#575756` | 0 / 0 / 0 / 70 | 副标题、栏外标题 |
| `c.k45` | `#9C9B9B` | 0 / 0 / 0 / 45 | 图注、页码上方的细线 |
| `c.k15` | `#DADADA` | 0 / 0 / 0 / 15 | 表格分隔线、公式块底色 |
| `c.k6` | `#F1F1F1` | 0 / 0 / 0 / 6 | 引用块、编者按底色 |

### 6.3 品牌色与社团色码

| Token | 社团 / 用途 | CSS（RGB） | CMYK |
|---|---|---|---|
| `c.signal` | 品牌红：字标、征稿栏目、强调 | `#E30613` | 0 / 100 / 100 / 0 |
| `c.music` | 音乐社 MUSIC | `#EE7F00` | 0 / 60 / 100 / 0 |
| `c.chem` | 化学社 CHEMISTRY | `#009A82` | 85 / 10 / 60 / 0 |
| `c.philo` | 哲学社 PHILOSOPHY | `#6E4C9B` | 65 / 80 / 0 / 0 |
| `c.news` | 新闻社 JOURNALISM | `#FFDD00` | 0 / 10 / 100 / 0 |
| `c.math` | 数学社 MATH | `#0069B4` | 100 / 55 / 0 / 0 |

> RGB 值是 FOGRA39 下的近似显示色。实际交付时，屏幕版直接用表中 hex；CMYK 版强制用表中 CMYK 数值，不走 ICC 换算。

**社团归属**（取自 docx 文件名括号里的标记）：

| 标记 | 社团色 | 篇目 |
|---|---|---|
| `征稿` | `c.signal` | 1-1 ～ 1-10、2-4、2-5、2-9 中没有其他标记的 |
| `数` | `c.math` | 2-1、2-2、2-3 |
| `化音` | `c.chem` + `c.music`（双色条） | 2-6 |
| `歌词` | `c.music` | 2-7 |
| `数音` | `c.math` + `c.music` | 2-8 |
| `数哲` | `c.math` + `c.philo` | 2-9 |

2-4、2-5 的标记只有"征稿"，但作者都是钱东成，内容也是数学。是否归到 `c.math`？**待你确认。**

跨社团文章的色条按标记顺序分成两段，每段 1 栏宽、4 pt 高。

### 6.4 CMYK 构建的颜色处理

1. Chrome 输出的 PDF 只有 RGB（DeviceRGB 的 `rg` / `RG` 操作符）。
2. `scripts/cmyk_remap.py`（用 pikepdf）遍历所有内容流，把与 6.2、6.3 表中 hex 精确匹配的 `r g b rg` 换成对应的 `c m y k k`。这样 K100 文字仍然是单色黑。
3. 剩下的 RGB（主要是插图）由 Ghostscript 用 `icc/ISOcoated_v2_300_eci.icc` 换算成 CMYK，DeviceCMYK 原样保留。
4. 黑色文字设为叠印（overprint）。

---

## 7. 版式组件

### 7.1 页眉页脚（running elements）

| 元素 | 位置 | 样式 |
|---|---|---|
| 页码 | 切口一侧，基线距成品下边 14 mm | `t.folio`，`c.ink`；页码上方是 1 栏宽、0.5 pt 的 `c.k45` 细线 |
| 栏外标题（左页） | 切口一侧，基线距成品上边 12 mm | `RESONANCE · 2026 冬`，`t.runhead`，`c.k70` |
| 栏外标题（右页） | 同上 | `篇号 / 篇名`，`t.runhead` |
| 社团色标 | 右页切口，从版心顶部开始 | 4 × 30 pt 的社团色块，出血到页边，方便翻书时快速定位 |

篇首页、扉页、章扉页不显示栏外标题；页码照常显示。

### 7.2 篇首（article opener）

- 社团色条：2 栏宽、4 pt 高，放在版心第 1 行顶部。
- 大编号：两位数的篇内序号，`t.mega`，`c.rich`，占第 1–5 栏。
- 篇名：`t.title` 或 `t.title-long`，最多 3 行，左对齐，占第 1–9 栏。
- 1.5 pt 的 `c.ink` 粗线横跨全版心。
- 署名行：`作者（单位）` 左对齐；右边是社团标签和文体标签（`t.tag`）。没有作者的篇目只显示标签。
- 正文从第 19 行起排，双栏。

### 7.3 章扉页（chapter opener）

全书分两章，章名暂定：**01 文学 LITERATURE**、**02 交叉 INTERSECTIONS**。**章名待你确认。**

- 整页：左上角是 `t.chapter` 章号（`c.signal`，出血到页边）。
- 章名：中文 `SHS 900 48/60` + 英文 `GS Display 300 24/30`，放在第 7–12 栏、第 33 行。
- 章目录：本章篇目列表，`t.byline`，放在第 7–12 栏的底部。

### 7.4 正文元素

| 元素 | 规则 |
|---|---|
| `h2` | 段前 15 pt、段后 7.5 pt；左边有 2 pt 宽的社团色竖线 |
| `h3` | 段前 7.5 pt；没有缩进 |
| 行内公式 | KaTeX，`t.math` |
| 独立公式 | 居中，上下各 7.5 pt；超出栏宽就缩小（最小 0.8 倍）；还放不下就跨栏 |
| 图片（≤ 栏宽） | 宽度 = 栏宽，高度按基线取整 |
| 图片（宽图，宽高比 > 2:1 或原图宽度 > 5 in） | 跨双栏 `column-span: all` |
| 并排小图（2-3 的分形示意、生僻字） | 3–5 张一行的 flex 网格，统一高度 |
| 图注 | `t.caption`，`c.k70`；图片下方 3.75 pt；前缀 `图 1`（GS Text 700） |
| 表格 | 只用横线：顶线 1 pt `c.ink`、表头下 0.5 pt、行间 0.25 pt `c.k15`、底线 1 pt；数字列右对齐、等宽数字 |
| 宽表（≥ 5 列，如 2-2、2-3） | 跨双栏 |
| 引用 / 题记 | `c.k6` 底色；缩进 1em；1-9 开头的题记用这个 |
| 篇末注释 | 0.5 pt 分隔线 + `t.note`；编号用 ①②③ |
| 篇末符号 | 正文最后一行后面加 `■`（`c.signal`，0.6em） |
| 诗、歌词 | 单栏，左对齐到第 4 栏；节与节之间空 15 pt；不做两端对齐 |

### 7.5 分页规则

| 规则 | 值 |
|---|---|
| 每篇从哪里开始 | 新页开始；文学篇不强制右页，非文学篇也不强制（目的是控制总页数） |
| 篇幅不足半页的短诗（1-5、1-8 等） | 可以两篇合排一页，用 7.2 的精简篇首（不放大编号） |
| 图片 | `break-inside: avoid` |
| 跨栏元素 | 放在页面顶部或底部，不要卡在一栏中间 |

---

## 8. 扉页（Front Matter）

页码用罗马数字（i, ii, iii …），正文从阿拉伯数字 1 开始。

| 页 | 内容 | 版式 |
|---|---|---|
| i 书名页（Half-title） | `RESONANCE` 字标 + `共鸣` | 字标 `t.wordmark` 放在第 7 栏起、第 20 行基线；其余留白 |
| ii | 空白，或五社团的色条阵列 | 5 条社团色带，各 1 栏宽、240 pt 高，等距排列，出血到下边 |
| iii 正扉页（Title page） | 《共鸣（RESONANCE）》、期号、出品方 | 刊名 `SHS 900 60/75` + 字标；`浙江省桐乡市高级中学` + 五个社团名竖排列表（每个前面带对应色点）+ `联袂出品`；`开放校外征稿` 用 `c.signal` |
| iv 版权页（Colophon） | 主编、编辑、设计、字体、印刷信息 | `t.caption`，放在左页底部第 1–6 栏 |
| v 卷首语（Editor's note） | 可选 | 单栏，`t.lead` |
| vi–vii 目录 | 两章及篇目 | 每条：两位编号（GS Cond 700 24 pt）、篇名（SHS 500 10 pt）、作者（`t.byline`）、页码（右对齐，`tnum`）；章名前加社团或品牌色块 |

**版权页还缺的信息**（不会自动生成，需要你提供）：期号或出版日期、主编和各社团负责人、设计者署名、印数、联系方式或征稿邮箱。

---

## 9. CSS 变量（生成 `src/tokens.css`）

```css
:root {
  /* page */
  --trim-w: 210mm; --trim-h: 297mm; --bleed: 3mm;
  --m-top: 20mm; --m-bottom: 23mm; --m-inner: 20mm; --m-outer: 15mm;

  /* grid */
  --bl: 15pt; --bl-half: 7.5pt;
  --grid-col: 26.667pt; --grid-gap: 16pt;
  --col-w: 240pt; --col-gap: 16pt;
  --block-w: 496pt; --block-h: 720pt;
  --opener-h: calc(var(--bl) * 18);

  /* families */
  --ff-ui: "GS Text", "SHS", sans-serif;
  --ff-display: "GS Display", "SHS", sans-serif;
  --ff-cond: "GS Cond", "GS Display", sans-serif;
  --ff-sans: "GS Text", "SHS", sans-serif;
  --ff-serif: "SHSerif", serif;

  /* scale (size / line-height) */
  --t-mega: 900 168pt/150pt var(--ff-cond);
  --t-chapter: 900 240pt/210pt var(--ff-cond);
  --t-wordmark: 900 72pt/75pt var(--ff-cond);
  --t-title: 700 30pt/37.5pt var(--ff-display);
  --t-title-long: 700 24pt/30pt var(--ff-display);
  --t-subtitle: 400 12pt/22.5pt var(--ff-ui);
  --t-h2: 700 12pt/22.5pt var(--ff-ui);
  --t-h3: 700 9.6pt/15pt var(--ff-ui);
  --t-body-serif: 400 9.6pt/15pt var(--ff-serif);
  --t-body-sans: 400 9.25pt/15pt var(--ff-sans);
  --t-poem: 400 10.5pt/22.5pt var(--ff-serif);
  --t-byline: 500 8pt/15pt var(--ff-ui);
  --t-tag: 700 7pt/7.5pt var(--ff-ui);
  --t-caption: 400 7.5pt/11.25pt var(--ff-ui);
  --t-table: 400 8pt/11.25pt var(--ff-ui);
  --t-note: 400 7.5pt/11.25pt var(--ff-ui);
  --t-folio: 700 8pt/7.5pt var(--ff-ui);
  --t-runhead: 500 7pt/7.5pt var(--ff-ui);

  /* color — solid only, hex must stay unique (CMYK remap keys) */
  --c-paper: #FFFFFF;
  --c-ink: #1D1D1B;     /* K100 */
  --c-rich: #000001;    /* 50/40/40/100, ≥60pt only */
  --c-k70: #575756;
  --c-k45: #9C9B9B;
  --c-k15: #DADADA;
  --c-k6: #F1F1F1;
  --c-signal: #E30613;  /* 0/100/100/0 */
  --c-music: #EE7F00;   /* 0/60/100/0 */
  --c-chem: #009A82;    /* 85/10/60/0 */
  --c-philo: #6E4C9B;   /* 65/80/0/0 */
  --c-news: #FFDD00;    /* 0/10/100/0 */
  --c-math: #0069B4;    /* 100/55/0/0 */

  /* rules */
  --rule-hair: 0.25pt; --rule-thin: 0.5pt; --rule-mid: 1pt; --rule-bold: 1.5pt;
  --clubbar-h: 4pt;
}
```

**CMYK 映射表**：`scripts/cmyk_map.json` 由第 6 节生成，格式是 `{ "#1D1D1B": [0,0,0,1], ... }`。

---

## 10. 输出规格

| 产物 | 文件 | 标准 | 色彩 | 说明 |
|---|---|---|---|---|
| 屏幕预览 | `dist/resonance-screen.pdf` | — | sRGB | 无出血 |
| RGB 印刷版 | `dist/resonance-print-rgb_PDFX4.pdf` | PDF/X-4 | RGB + 输出意图 ISO Coated v2 | 带出血、TrimBox |
| CMYK 印刷版 | `dist/resonance-print-cmyk_PDFX.pdf` | PDF/X-1a 级内容（gs `-dPDFX`） | DeviceCMYK | 不含透明，字体全部嵌入 |

**预检**（`scripts/preflight.py`，任何一项不通过都会让构建失败）：

- 字体全部嵌入
- 没有 RGB 残留（只检查 CMYK 版）
- 总墨量 ≤ 300%
- 小于 12 pt 的文字只用 K 通道
- TrimBox 和 BleedBox 正确
- 图片有效分辨率 ≥ 300 ppi（低于 200 ppi 报错，200–300 ppi 只警告）

**已知风险**：2-3 的分形示意图和生僻字图片都很小（4–15 KB）。按栏宽排的话，有效分辨率大概只有 72–150 ppi。需要编辑提供原图，或者改成矢量重绘。

---

## 11. 待确认事项

1. 1-4 是否按文学篇用宋体排？
2. 2-4、2-5 是否归到数学社？
3. 章名是否用"01 文学 LITERATURE / 02 交叉 INTERSECTIONS"？
4. 期号叫"2026 冬"还是别的？
5. 版权页的人员名单和出版信息。
6. 新闻社在现有 19 篇里没有对应文章，社团色 `c.news` 目前只出现在扉页的社团列表和色条阵列里。

# 构建链路与模块划分

> 本文是模块化之前的**调用链路测绘**，也是模块化之后的**目录索引**。
> 读它之前先看 `AGENTS.md`（环境与坑）与 `DESIGN-TOKENS.md`（版式取值）。
> 一句话：`docs/*.docx` → pandoc → HTML 片段 → `build/book.html` → Chrome 打印两遍 → `merge.py` 合层 → 三份 PDF。

---

## 1. 入口与产物

| 入口 | 命令 | 产物 | 前置 |
| --- | --- | --- | --- |
| 正文 | `npm run build` → `scripts/build.mjs` | `dist/resonance-screen.pdf`（阅读版）、`dist/resonance-print-rgb.pdf`（216×303 出血） | `build/html/*.html`（`convert.ps1` 产出） |
| 试读 | `npm run demo` → `scripts/build-demo.mjs` | `dist/resonance-demo.pdf` | `dist/resonance-print-rgb.pdf` |
| 付印 | `npm run cmyk` → `scripts/build-cmyk.mjs` | `dist/resonance-print-cmyk.pdf`（DeviceCMYK + OutputIntent） | 同上 + Ghostscript + ICC |
| 全链 | `npm run all` | 上面三份 | — |
| 转稿 | `scripts/setup/convert.ps1` | `build/html/<id>.html`、`build/md/<id>.md`、`build/media/<id>/` | pandoc |
| 初始化 | `scripts/setup/{setup,fonts,envcheck}.ps1`、`scripts/setup/fonts.py` | `fonts/`、`icc/`、工具链自检 | 见 AGENTS.md §2 |

`build-demo.mjs` 在找不到 print-rgb 时**自己回头调 `build.mjs`**（`--rebuild` 或产物缺失），所以 demo 是 build 的下游消费者而非独立分支。

## 2. 主链路（build.mjs 的九个阶段）

```
docs/*.docx ──pandoc(convert.ps1)──▶ build/html/<id>.html ─┐
content/manifest.json ─────────────────────────────────────┤
                                                            ▼
①  装配  content/articles.mjs（manifest × docx 文件名）
         → content/frontmatter.mjs + chapter.mjs + article.mjs → build/book.html
                                                            │
②  打印  Chrome + src/js/*（运行时排版）→ build/body.pass1.pdf
③  量页  scripts/pdf/pagemap.py（命名书签 → 真实页序）→ front = 最早章首页 − 1
④  回填  在页面里把目录页码写进 .pn[data-target] → build/body.pdf → build/pagemap.json
⑤  底图  scripts/art/chapter-art.py（章扉页）· findtext.py（雾蓝收在哪一行）
⑥  跨页  overlay/art.mjs（位图 spec + 每页装饰）→ orb-art.py / swiss-photo.py / chapter-art.py
⑦  overlay 打印 → build/overlay.pdf、build/under.json（哪些页的 overlay 垫在正文下）
⑧  合层  scripts/pdf/merge.py → screen / print-rgb（原子写入，占用时 .new.pdf + exit 2）
⑨  派生  demo（水印）/ cmyk（Ghostscript）
```

**阶段③→④ 是全书唯一的两遍打印**：第一遍只为拿到「每篇文章从第几页开始」，第二遍前把页码写回目录。目录里没有写死的页码，删改一篇后全书页码自动跟随。

## 3. 阶段①：装配

`build.mjs` 装配阶段的数据流向：

| 步骤 | 输入 | 输出 |
| --- | --- | --- |
| 元数据 | `content/manifest.json` + `docs/*.docx` 文件名 | `articles[]`：补 `ch`/`seq`/`tag`/`clubs`/`serif`/`verse` |
| 社团判定 | docx 文件名里的 `（征稿 数音）` | `clubs[]`（`math`/`chem`/`music`/`philo`/`news`/`open`），`OVERRIDE` 可覆盖 |
| 正文补丁 | `build/html/<id>.html` | 依次套 6 张替换表 + 公式卡 + SVG 重绘 |
| 页面骨架 | 上面两者 | `<section class="article" data-strip=…>`，正文先放进 `<template class="raw">` |

正文补丁的**顺序有语义**，不可乱序：

1. `SWAP_IMG` 换图（2-4 贝克莱肖像）
2. `FIG_W` 改原稿 `width/height`（英寸，必须成对，否则纵向拉伸）
3. `FIG_FLOAT` 打 `data-float="0/1"`（点名竖图绕不绕排）
4. `FIG_MOVE` 挪图锚点（图挂到哪一段）
5. `TEXT_FIX` 改字（pandoc 吞段补回、颜色描述同步）
6. `FIG_REF` 把「上图/右图」换成 `[[fig:文件名]]`（编号由运行时解析）
7. 2-8 手写笔记 → `TRIG_CARD`（HTML + KaTeX）
8. `FIGURES` 位图 → 内联 SVG（宽度沿用上一步的英寸，高度按 viewBox 比例重算）
9. 单栏判定：独立公式 ≥ 8 条或 2-1 强制单栏
10. 2-3 生僻字 → `content/rare-glyphs.mjs`
11. 跨页篇目（1-1/1-2/1-3/1-6）的 opener / 文字结构 / 收尾竖排

第 8 步之后 `data-cap`/`data-ref`/`data-fw` 落到 `<svg>` 上，运行时靠这三个属性出图注、解析图号、定绕排宽度。

## 4. 阶段②：运行时时序（src/js/*）

在 `build/book.html` 里按序执行，每个模块只暴露一个命名空间成员（`window.RS.*`）。**不能用 ES module**：页面走 `file://`，Chrome 会拒绝加载 `type="module"`。

```
state.js        report / CJK / norm
dom.js          renameEl / unwrapDivs
lists.js        unwrapLists          拆 Word 列表，判「条目小标题」fn-h
structure.js    stripHead / structure / endnotes
figures.js      figures()  figure 包裹、图注编号、状态 state.map
refs.js         figrefs()  [[fig:x]] → 「图 N」（查 state.map）
text.js         cleanText / joinDashes（破折号靠负边距接成一条线，仅正文层）
tables.js       tables()   包 .tbl，列数 ≥ 5 的通栏
math.js         plainMath / joinConnectors / splitMathProse / demote / KaTeX
equations.js    fitEq()   超宽公式先缩字号再转通栏（量 scrollWidth）
main.js         串起上面全部 + fonts.ready 之后再量字宽
```

依赖方向是单向的：`figures → state`、`refs → state`、`math → state`、`structure → dom`、`main → 全部`。`state.map`（图文件名 → 图号）是 `figures` 写、`refs` 读的唯一共享状态。

## 5. 阶段⑤⑥：底图（python 艺术管线）

三个脚本同构：`python <script>.py <spec.json> <out.jpg>`，JSON 进、不透明 JPEG 出，300 dpi，文字一律留给 overlay 的矢量层。

| 脚本 | 干什么 | spec 由谁写 |
| --- | --- | --- |
| `art/chapter-art.py` | 风光照 → CMYK 四色网 / 专色网 + 套印错位 + 纸纹 + 实色蓝圆 | `content/chapter.mjs` 的 `renderChapterArt`、`overlay/art.mjs` |
| `art/orb-art.py` | 正扉页颗粒渐变光球 + 竖条磨砂（OKLab 插值） | `config/photos.mjs` 的 `TITLE_ORB` |
| `art/swiss-photo.py` | 1-6 银盐黑白（暗角、压黑、颗粒） | `overlay/art.mjs` |

`pdf/findtext.py` 是唯一的「先排版、再定位」通道：它回答「1-2 的雾蓝底色该在哪一行收住」，答案回填进 1-2 的 overlay（`pos.fog`）。

## 6. 隐性契约

改任何一处都要同时想到另一头。这些没有类型系统兜底，只能靠文档和人。

| # | 契约 | 生产方 | 消费方 | 违约后果 |
| --- | --- | --- | --- | --- |
| C1 | `build/html/<id>.html` 以 `id` 开头命名 | `setup/convert.ps1` | `content/article.mjs` | `readFileSync` 直接崩；docx 改了不重转则静默用旧稿 |
| C2 | 图片路径 `media/<id>/media/<file>` | pandoc `--extract-media` | `FIG_W`/`FIG_FLOAT`/`FIGURES`/`rare-glyphs` 的键 `"<id>/<file>"` | 替换 miss（只在 console 警告，PDF 照出） |
| C3 | `manifest.json` 字段 `id/title/subtitle/author/author_note/form/subtitle/strip_lines` | 人工 | `articles.mjs`、`article.mjs`、`frontmatter.mjs` | 书眉/目录/开篇缺字段 |
| C4 | 锚点 `#a-<id>`、`#ch-<n>` | `article.mjs`、`chapter.mjs` | 目录链接、Chrome 命名书签、`pagemap.py` | 页面映射缺失 → 页码全错 |
| C5 | `data-strip` / `data-float` / `data-fw` / `data-ref` / `data-cap` / `data-form` / `.single` / `.verse` / `.serif` | 装配阶段 | `src/js/*` 与 `src/css/*` 双向读取 | 绕排、图号、分栏、书眉体裁全错 |
| C6 | python 位置参数与 spec 字段名 | `build.mjs` 各调用点 | `scripts/art/*.py`、`scripts/pdf/*.py` | 位图错位或 KeyError |
| C7 | 页面几何 216×303 mm、出血 3 mm | `pdf/merge.py`、`art/*.py` 的常量 | `css/base.css` 的 `@page`、`css/overlay.css` | 出血裁切错位（印刷事故） |
| C8 | 颜色十六进制唯一 | `tokens.css` | `figures/svg.mjs` 的 `C`、`config/photos.mjs` 的 `RGB`、`chapter-art.py` 的 `INKS` | CMYK 逐 hex 映射落空，印出来偏色 |
| C9 | 20 个字体文件名 | `setup/fonts.py` | `css/fonts.css`、`setup/envcheck.ps1` | 缺失不报错，Chrome 静默回退（「跑通≠字体对」） |
| C10 | python 解释器与 pypdf / pypdfium2 / numpy / Pillow | 系统 | 所有 `runPy()` 调用 | 由 `lib/run.mjs` 依次试 `PYTHON`、`python`、`py`、`%LOCALAPPDATA%` 3.11–3.13；都不可用才报错 |
| C11 | 一页 PDF = 一张 overlay | `overlay/sheets.mjs` | `pdf/merge.py` 的 `assert len(rb)==len(ro)` | 断言失败 |
| C12a | overlay 层的破折号由构建期接合（`lib/html.mjs` 的 `dashJoin`），不是运行时 | `chapter.mjs` | overlay 没有 `text.js`，漏掉就是 0.095 em 的白口 |
| C12 | `strip_lines` 与 HTML 标题行的归一化一致 | `manifest.json` | `js/state.js` 的 `norm()`（去 `#*空白《》`、去前导破折号） | 稿子里残留标题行 |

## 7. 现状问题（模块化的动因）

1. **`build.mjs` 745 行，四类东西混住**：配置常量（≈300 行：社团、期号、照片授权、每篇的替换表）／HTML 构造／进程编排／版式补丁。改一句引言要翻到第 150 行，改一张图的宽度要翻到第 224 行。
2. **每篇的补丁表与装配逻辑同文件**：`TEXT_FIX`/`FIG_REF`/`FIG_MOVE` 属于**内容校对**，`article()` 属于**装配机制**，两者生命周期完全不同（前者每期重写，后者跨期复用）。
3. **`figures.mjs` 一文件十张图**：共享的 SVG helper（`T`/`line`/`curve`/调色板）与十套互不相干的几何算在一起，增删一张图要通读 356 行。
4. **CSS 双用途**：`art.css` 同时喂正文层和 overlay 层，`book.css` 369 行里塞了序言页、章扉页、开篇、正文、公式、图、表、注、诗九个版块；改一处要确认不误伤另一层。
5. **`transform.js` 710 行单 IIFE**：12 个变换步骤共用一个作用域，`report`、`dashLig`、`state` 全是闭包内变量，没法单独测、单独改。
6. **重复实现**：python 解释器兜底（demo/cmyk 各一份）、`ROOT`/`B()` 路径（三个入口各一份）、调色板（CSS 与 JS 各一份）、页数常量（三处）。
7. **脚本散在根目录**：24 个文件平铺，`.py` `.mjs` `.ps1` `.cmd` 混排，看不出「谁是每次构建都跑的、谁是一次性初始化」。

## 8. 模块划分（当前结构）

```
scripts/
├── build.mjs            入口：参数 → ①装配 ②打印 ③量页 ④回填 ⑤底图 ⑥overlay ⑧合层
├── build-demo.mjs       入口：水印层叠加（缺 print-rgb 时先回调 build.mjs）
├── build-cmyk.mjs       入口：Ghostscript → DeviceCMYK + OutputIntent
├── lib/                 path.mjs  ROOT/B()/dist 路径与外部程序
│                        run.mjs   execFileSync 包装 + python 解释器解析（PYTHON → python → py → 3.11–3.13）
│                        cli.mjs   --only / --flag / --opt 解析
│                        browser.mjs Chrome 启动、打印、页面报错收集
│                        html.mjs  转义、补零、按清单注入样式与脚本
├── config/              issue.mjs   期号、章名、社团、体裁（跨期改动少）
│                        photos.mjs  照片授权、引语、正扉页光球、车灯光线、油墨 RGB
│                        geometry.mjs 字标格位、章扉页几何（左右页镜像）
│                        patches.mjs 每篇的内容补丁：换图、改宽、绕排、挪锚、改字、图号
├── content/             articles.mjs   manifest × docx → articles[]
│                        frontmatter.mjs 序言页四页 + 目录
│                        chapter.mjs    章扉页锚点与 overlay 页面
│                        article.mjs    单篇骨架 + 跨页篇目的 opener/frag/coda
│                        rare-glyphs.mjs 2-3 生僻字（字表、拼音、码位）
│                        book.mjs       汇总成 book.html（并给出 CSS/JS 清单）
├── overlay/             sheets.mjs 页脚/书眉/色标/章扉页叠层
│                        art.mjs    篇目跨页每页底图 spec 与装饰
├── figures/             index.mjs 注册表（"<id>/<file>" → 生成函数）
│                        svg.mjs   调色板、文字/线段/采样曲线
│                        2-1-ln-x / 2-2-intensity / 2-3-{sierpinski,quarter,segment,fractal-set}
│                        / 2-8-fourier  每张图一个模块
├── art/                 chapter-art.py / orb-art.py / swiss-photo.py   底图生成
├── pdf/                 merge.py（合层+出血）/ pagemap.py（书签→页序）/ findtext.py（定位）
├── setup/               convert.ps1 / setup.ps1 / envcheck.ps1 / fonts.py / fonts.ps1
│                        sample.ps1（抽样构建+预览）/ build-demo.ps1 / build-demo.cmd
└── tools/               figpreview.mjs（逐张目检 SVG）/ pdfdiff.py（重构回归：逐页像素比对）

src/
├── css/                 tokens.css   设计令牌（由 DESIGN-TOKENS §9 生成）
│                        fonts.css    @font-face（20 个文件）
│                        base.css     页面几何、正文元素、通用类
│                        frontmatter.css 序言页 i–v 与目录
│                        article.css  开篇、标题层级、条目、引文、诗栏
│                        math.css     独立公式、推导标签、KaTeX 分数线
│                        figures.css  图、图注、图号引用、公式卡
│                        tables.css   三线表、生僻字格与 ruby
│                        notes.css    注释块
│                        chapter.css  章扉页（overlay 层）
│                        overlay.css  overlay 的页脚/书眉/色标/裁切线
│                        art/         篇目跨页：base + 1-1/1-2/1-3/1-6 各一份
├── js/                  state / dom / text / lists / structure / figures / refs / tables
│                        / math / equations / main
└── assets.mjs           BOOK_CSS / OVERLAY_CSS / TRANSFORM_JS 三份清单（顺序即依赖顺序）
```

**加载顺序即依赖顺序**：清单集中在 `src/assets.mjs`，`content/book.mjs` 与 `overlay/sheets.mjs` 只负责按清单注入 `<link>` / `<script>`。CSS 仍靠层叠，所以 `BOOK_CSS` 的顺序必须与原 `book.css` 的段落顺序一致（`base → frontmatter → article → math → figures → tables → notes`，再挂 `art/`）。

## 9. 迁移映射

| 原 | 现 |
| --- | --- |
| `build.mjs` 常量段 | `config/{issue,photos,geometry,patches}.mjs` |
| `build.mjs` `frontMatter` | `content/frontmatter.mjs` |
| `build.mjs` `chapterGeom`/`renderChapterArt`/`chapterOpener`/`chapterSheet` | `config/geometry.mjs` + `content/chapter.mjs` |
| `build.mjs` `article`/`artOpener`/`artFrag`/`artCoda`/`bookHtml` | `content/article.mjs`、`content/book.mjs` |
| `build.mjs` `overlayHtml` | `overlay/sheets.mjs`（内联 `<style>` 移入 `src/css/overlay.css`） |
| `build.mjs` `artSheets`/`renderArt` | `overlay/art.mjs` |
| `figures.mjs` | `figures/{index,svg}.mjs` + 每张图一个模块 |
| `rare-glyphs.mjs` | `content/rare-glyphs.mjs` |
| `chapter-art.py`/`orb-art.py`/`swiss-photo.py` | `art/` |
| `merge.py`/`pagemap.py`/`findtext.py` | `pdf/` |
| `convert.ps1`/`setup.ps1`/`envcheck.ps1`/`fonts.*`/`sample.ps1`/`build-demo.*` | `setup/`、`tools/` |
| `src/book.css` | `src/css/{base,frontmatter,article,math,figures,tables,notes}.css` |
| `src/art.css` | `src/css/art/{base,1-1-night,1-2-fog,1-3-mist,1-6-swiss}.css` |
| `src/transform.js` | `src/js/*.js`（11 个文件，`window.RS.*` 命名空间） |

## 10. 红线（重构必须守住的）

- 产物页数 **58**（6 页前置 + 52 页正文）。`AGENTS.md` 里的 57 是跨页篇目上线前的旧值。
- `npm run build` 的产物与重构前**逐页像素零差异**（`scripts/tools/pdfdiff.py` 校验）。
- 入口命令不变：`npm run build|demo|cmyk|all`；`python` 仍在 PATH 上优先使用。
- 只在 `src/` 与 `scripts/` 里动刀；`content/`、`docs/`、`assets/`、`icc/` 一字不动。

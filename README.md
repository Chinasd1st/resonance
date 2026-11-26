# 《共鸣 RESONANCE》2026 秋季刊 · 排版工程

浙江省桐乡市高级中学 音乐社 × 化学社 × 哲学社 × 新闻社 × 数学社 联袂出品的社团联刊。
本仓库只包含**排版与印前链路**：19 篇稿件的 DOCX 原稿、版面样式、插图重绘脚本，以及生成四种 PDF 的构建脚本。

封面 / 封底的成品文件不在本仓库构建。

> 让模型接手这个仓库时，先读 [`AGENTS.md`](AGENTS.md)：目录职责、构建链路、踩过的坑与验收口径都在那里。

## 渲染链

```
DOCX ──pandoc──▶ HTML 片段 ──node scripts/build.mjs──▶ book.html
      ──Playwright + Headless Chrome──▶ PDF（RGB）
      ──Ghostscript + ICC──▶ DeviceCMYK（付印）
```

- 版式全部由 `src/book.css` + `src/tokens.css` 决定，排版细节（绕排、图注、公式卡、分页）在浏览器里由 `src/transform.js` 完成；
- 公式统一走 KaTeX，原稿里的 OMML 由 pandoc 转成 TeX；
- 插图有的是重绘的内联 SVG（`scripts/figures.mjs`），有的保留原稿位图。

## 目录结构

| 路径 | 内容 |
| --- | --- |
| `docs/` | 稿件原稿（DOCX，一个文件一篇） |
| `content/manifest.json` | 篇目元数据：标题、作者、体裁、需要从正文剥掉的标题行 |
| `src/tokens.css` | 版面与字号令牌（版心、基线、颜色、字体族） |
| `src/book.css` | 组件样式（书眉、章节扉页、目录、图注、公式卡、表格…） |
| `src/transform.js` | 浏览器端排版：图文绕排、公式、序号、推导块、图号引用 |
| `scripts/build.mjs` | 装配全书 → 两遍打印 → 回填页码 |
| `scripts/build-demo.mjs` | 派生带水印的试读版 |
| `scripts/build-cmyk.mjs` | Ghostscript 转 DeviceCMYK + 挂 ICC |
| `DESIGN-TOKENS.md` | 版式规范：本仓库的取值都必须能在这里找到出处 |
| `legacy/` | 旧版封面、版式源文件（PSD / AI / INDD），仅备查 |
| `ref/` | 上一期成品（`2025-autumn-issue-cn.pdf`）与字体反查记录 `font-audit.py`、`README.md` |

## 构建

需要 Node 18+、Python 3.10+（命令名必须是 `python`，且在 PATH 上）、pandoc、Google Chrome、Ghostscript 10。各版本与本机路径见 [`AGENTS.md`](AGENTS.md) §2。

```bash
npm install                                      # katex / playwright-core（不下载 Chromium）
python -m pip install pypdf pypdfium2 fonttools brotli
python scripts/fonts.py                          # 生成 fonts/，唯一需要手工备料的一步
powershell -File scripts/envcheck.ps1            # 核对工具链 / 字体 / ICC
node scripts/convert.ps1                         # DOCX → build/html（Windows；其他平台按脚本里的 pandoc 参数重写）
npm run all                                      # 出四份 PDF 到 dist/
```

`npm run all` 等价于 `build` → `demo` → `cmyk`，产物：

- `dist/resonance-screen.pdf`：屏幕阅读版，裁到成品尺寸；
- `dist/resonance-print-rgb.pdf`：付印版，留 3 mm 出血；
- `dist/resonance-print-cmyk.pdf`：DeviceCMYK + OutputIntent；
- `dist/resonance-demo.pdf`：带「样品」水印的试读版。

改文字 / 图 / 公式之后只需重跑 `npm run build`（十几秒），不必重新转 DOCX；
除非改的是 `docs/*.docx` 本身，那时要再跑一次 `convert.ps1`。

## 字体

`fonts/` 共 229 MB，不进仓库，克隆后是空目录。`scripts/fonts.py` 负责备料：从系统字体目录复制思源宋 6 个、思源黑 5 个，再把 **Google Sans Flex 可变字体**按 `(wght, wdth, opsz)` 实例化成 9 个静态 `GSF-*`（该可变字体不随仓库分发，也不在 Google Fonts 公开目录，需自备）。`scripts/fonts.ps1` 在此基础上顺手抓 ICC。

字体缺失**不会**让构建失败——Chrome 静默回退到系统字体，页数照旧、字形全错。备好后跑 `powershell -File scripts/envcheck.ps1`，工具链、20 个字体文件、ICC、构建缓存一次看全。

## 许可

稿件文字版权归各作者所有；版式与构建脚本以 MIT 许可发布。

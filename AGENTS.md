# 初始化提示词

> 给接手本仓库的模型或新会话用：读完这一份就能动手，不必再翻历史对话。
> 仓库：`github.com/Chinasd1st/resonance`（public，默认分支 `main`）。

## 0. 先读规范

改动前先看 `agent/`：`git.md`（提交）、`style.md`（版式与字体）、`setup.md`（依赖与初始化）、`architecture.md`（调用链路与模块边界）。
本文件记录环境、链路、坑与验收口径；**约束与取值以 `agent/` 为准**，两边不一致时按 `agent/README.md` 的优先级处理。

## 1. 这是什么

《共鸣 RESONANCE》校刊的排版工程：把作者交来的 Word 稿，排成可付印的 PDF。不是内容管理系统，也不是网站——所有代码都服务于“把 19 篇 docx 排成一本 58 页、蓝橙双色的刊物”。

**当前基线**：19 篇稿件、2 章（`1` 文学 / `2` 交叉）、6 页罗马页码前置页 + 52 页正文，共 **58 页**；产物四份：`dist/resonance-screen.pdf`（阅读版）、`-print-rgb.pdf`（付印，3 mm 出血）、`-print-cmyk.pdf`（DeviceCMYK + OutputIntent）、`-demo.pdf`（叠水印的试读版）。

## 2. 环境与初始化（克隆后第一件事）

整条链路只在 Windows 上跑通，外部程序的路径写死在三处：`convert.ps1`（pandoc 走 PATH）、`build.mjs`（Chrome）、`build-cmyk.mjs`（Ghostscript）。换平台要改这三处。

| 依赖 | 干什么 | 本机实测 | 注意 |
| --- | --- | --- | --- |
| Node | 跑 `scripts/build.mjs` / `scripts/figures/` | 22.22.2（≥18） | |
| npm 包 | `katex@0.19.1`、`playwright-core@1.65.1` | `npm install` | 只驱动**系统 Chrome**，不需要 `playwright install`；`PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1` 可省一份 Chromium |
| Python | `pdf/merge.py` / `pdf/pagemap.py` / 底图生成 / 挂 OutputIntent | 3.12.7（≥3.10） | 解释器统一由 `scripts/lib/run.mjs` 解析：先用 PATH 上的 `python`，缺解释器或缺包（pypdf / pypdfium2 / numpy / Pillow）时依次退到 `py`、`%LOCALAPPDATA%\Programs\Python\3.11–3.13`；也可用 `PYTHON` 环境变量指定 |
| pip 包 | 清单与版本下限见 `requirements.txt`：`pypdf`（合并、书签、ICC）、`pypdfium2`（定位与渲图）、`numpy`+`Pillow`（底图）、`fonttools`+`brotli`（重建字体） | pypdf 7.1.1 | 前四个构建必需；fonttools 只在第一次生成 `fonts/` 时用 |
| pandoc | `docx → html5 / gfm`，参数 `--katex --wrap=none --extract-media` | 3.9 | 版本会改 OMML 转义、列表拆解和 `--wrap=none` 的吞段行为；升级后公式与编号要重看 |
| Google Chrome | Playwright 的打印引擎：CSS 分页、字体光栅、`preferCSSPageSize` 全由它决定 | 默认安装路径 | 路径可用环境变量 `CHROME` 覆盖；Chrome 大版本升级会改分页与分数线渲染，升完必须目检 |
| Ghostscript | RGB → DeviceCMYK、写 `/OutputIntents` | 10.07.1 | 路径可用 `GS` 覆盖；`icc/` 里两份基础 profile 就来自它的 `iccprofiles\` |

初始化（PowerShell，一次，按顺序）：

```powershell
npm install
python -m pip install -r requirements.txt
python scripts/setup/fonts.py                   # 生成 fonts/（见下，唯一必须手工备料的一步）
powershell -File scripts/setup/envcheck.ps1     # 核对 node / pandoc / gs / chrome / fonts / icc
powershell -File scripts/setup/convert.ps1      # 首次必须转稿，之后只在 docx 改动时重跑
npm run all
```

`scripts/setup/setup.ps1` 是上面几步的合并版（额外从 GS 目录拷 ICC、把参考刊前 24 页渲成 PNG），日志在 `build/logs/setup.log`；它写死了 `gs10.07.1`，版本不同要改。其它脚本的日志同样在 `build/logs/`（`build/` 已 gitignore）。

### 字体：仓库里没有，必须自己备

`fonts/` 共 229 MB，被 `.gitignore` 排除，克隆下来是空目录；`src/fonts.css` 引用其中 20 个文件：

- **思源黑 5 个**（`SourceHanSansSC-{Light,Regular,Medium,Bold,Heavy}.otf`）与**思源宋 6 个**（`NotoSerifCJKsc-{Light,Regular,Medium,SemiBold,Bold,Black}.otf`）：从系统字体目录复制，`scripts/setup/fonts.py` 上半段就是这件事。
- **Google Sans 9 个**（`GSF-Text/Display/Cond-*`）：不是下载来的，是把 **Google Sans Flex 可变字体**（`GoogleSansFlex-VariableFont_GRAD,ROND,opsz,slnt,wdth,wght.ttf`）按 `(wght, wdth, opsz)` 三轴实例化出的静态 TTF——`wdth=25` 得 Cond，`opsz=12/72` 得 Text/Display。这个可变字体不随仓库分发、也不在 Google Fonts 公开目录，换机要自备同名文件，并改 `fonts.py` 里的 `UF`（默认 `%LOCALAPPDATA%\Microsoft\Windows\Fonts`）和 `ROOT`（目前是绝对路径）。
- **`fonts/火山字型青荷_试用版/`**：书法体，只服务封面与 `ref/` 的字体反查，**正文链路不引用**，缺失不影响构建。

字体缺一个不会报错：Chrome 静默回退到系统字体，页数照旧、文字全变，构建照样「成功」。所以「跑通了」不等于「字体对」——要么跑 `envcheck.ps1` 看清单，要么看 PDF 里实际嵌入的字体名。

### 环境变量与一次性文件

| 变量 / 文件 | 作用 |
| --- | --- |
| `CHROME` | 覆盖 Chrome 可执行文件路径 |
| `GS` | 覆盖 `gswin64c.exe` 路径 |
| `PYTHON` | 覆盖 Python 解释器（优先于 PATH 上的 `python`；解释器缺包时仍会自动换下一个） |
| `--icc=icc/xxx.icc` | 换 CMYK 目标空间；付印前必须换成印厂 profile（见 `icc/README.md`） |
| `icc/sRGB.icc`、`icc/gs_default_cmyk.icc` | 从 GS 的 `iccprofiles\` 复制而来；后者是通用占位，不是 FOGRA39 |

## 3. 目录结构

| 路径 | 内容 | 是否入库 |
| --- | --- | --- |
| `docs/*.docx` | **唯一正文源**。一篇一个文件，文件名形如 `2-8_（数）波纳万象，函数无穷.docx` | 是 |
| `content/manifest.json` | 19 篇的元数据：`id`（`2-8` 这种，章号取自前缀）、`title`、`author`、`author_note`、`form`（体裁，决定书眉的 ESSAY / PROSE…）、`subtitle`、`strip_lines`（要从正文剥掉的标题行） | 是 |
| `src/css/tokens.css` | 版面与字号令牌：成品 210×297、出血 3 mm、版心 496×720 pt、基线 15 pt、三族字体、调色板 | 是 |
| `src/css/*.css` | 版式分区：`base`（页面与基础元素）、`frontmatter`（序言页与目录）、`article`（开篇/正文/标题/条目/诗栏）、`math`（公式）、`figures`（图与图注/公式卡）、`tables`（三线表/生僻字）、`notes`（注释）、`chapter`（章扉页）、`overlay`（书眉页脚）；`art/` 下是篇目跨页 | 是 |
| `src/js/*.js` | **运行时排版**（在 Chrome 里跑）：state / dom / text / lists / structure / figures / refs / tables / math / equations / main。页面走 `file://`，Chrome 不加载 ES module，所以是顺序加载的经典脚本，只共享 `window.RS` | 是 |
| `src/assets.mjs` | CSS 与 JS 的清单和加载顺序（加文件只改这一处） | 是 |
| `src/css/fonts.css` | `@font-face`，指向 `fonts/` | 是 |
| `scripts/build.mjs` | 入口：装配 → Chrome 打印两遍 → 分页回填 → 底图与 overlay → 调 `pdf/merge.py` | 是 |
| `scripts/lib/` | `path`（根目录与外部程序）、`run`（子进程 + python 解释器解析）、`cli`、`browser`（Chrome 打印）、`html`（转义与注入清单） | 是 |
| `scripts/config/` | `issue`（期号/章名/社团/体裁）、`photos`（照片授权、引语、光球、油墨 RGB）、`geometry`（字标格位与章扉页圆阵）、`patches`（每篇的换图/改宽/绕排/挪锚/改字/图号表） | 是 |
| `scripts/content/` | `articles`（manifest × docx → 篇目）、`frontmatter`、`chapter`、`article`、`rare-glyphs`（2-3 的五个生僻字）、`book`（装订成 book.html） | 是 |
| `scripts/overlay/` | `sheets`（书眉、页码、色标、章扉页叠层）、`art`（篇目跨页每页的底图 spec 与装饰） | 是 |
| `scripts/figures/` | 重绘插图：`svg`（画布与调色板）+ 每张图一个模块 + `index` 注册表 | 是 |
| `scripts/art/*.py` | 底图生成：`chapter-art`（网点/套印错位/纸纹）、`orb-art`（正扉页光球）、`swiss-photo`（银盐黑白） | 是 |
| `scripts/pdf/*.py` | `merge.py`（两层合并、裁切/出血）、`pagemap.py`（书签→页序）、`findtext.py`（排版后定位） | 是 |
| `scripts/setup/` | `convert.ps1`（docx → HTML 片段）、`envcheck.ps1`、`setup.ps1`、`fonts.py` / `fonts.ps1`、`sample.ps1`（抽样构建 + 渲图）、`build-demo.ps1` / `.cmd` | 是 |
| `scripts/tools/` | `figpreview.mjs`（逐张目检 SVG）、`pdfdiff.py`（改版后逐页像素回归） | 是 |
| `scripts/build-demo.mjs` / `build-cmyk.mjs` | 派生试读版 / Ghostscript 转 CMYK | 是 |
| `icc/` | 色彩 profile：`sRGB.icc` + 占位的 `gs_default_cmyk.icc`，附 `README.md` 说明替换口径 | 是 |
| `DESIGN-TOKENS.md` | 版式规范。**改动前先看这里**，取值要有出处 | 是 |
| `agent/` | 规范：`git`（提交）、`style`（版式与字体）、`setup`（依赖与初始化）、`architecture`（调用链路）。**改动前先看** | 是 |
| `requirements.txt` | Python 依赖清单（版本下限按本机实测） | 是 |
| `ref/` | 上一期成品 `2025-autumn-issue-cn.pdf` + 字体反查 `font-audit.py`、`README.md`（46 种字体清单） | 是 |
| `legacy/` | 旧封面、版式源文件（PSD / AI / INDD），仅备查 | 是 |
| `assets/` | 压缩过的插图（如贝克莱肖像） | 是 |
| `build/`、`dist/` | 中间产物与成品 | 否（.gitignore） |
| `fonts/` | 字体文件，229 MB | 否 |

## 4. 构建链路

```
docs/*.docx ──setup/convert.ps1(pandoc)──▶ build/html/<id>.html + build/media/
                                         │
      build.mjs 装配（content/*：manifest + config/patches 的补丁表 + figures/ + rare-glyphs）
                                         ▼
                                   build/book.html
                                         │  Chrome + src/js/*：绕排/公式/图号/分页
                    ┌────────────────────┴────────────────────┐
          body.pass1.pdf（先打一遍取页码）→ 回填目录 → body.pdf     overlay.pdf（书眉/页码/色标/章扉页）
                    └────────────────────┬────────────────────┘
                              pdf/merge.py ──▶ screen / print-rgb ──▶ demo / cmyk
```

命令（依赖与首次初始化见 §2）：

```bash
powershell -File scripts/setup/convert.ps1   # 只有 docx 改动后才需要跑（会重转全部稿件）
npm run build                # 装配 + 打印 + 分页回填；约 45 秒
npm run all                  # build → demo → cmyk
```

**关键分工**：`build/html/` 是派生的缓存，与 docx 没有自动比对。改正文/结构/图片 → 必须重跑 `convert.ps1`；只改字号、图、公式、间距、页序 → 只跑 `npm run build`。

## 5. 动手前必须知道的坑

以下每一条都是踩过的，不是假想：

1. **替换表一律按数组遍历**。`FIG_REF` / `TEXT_FIX` 的值是 `[[找, 换], …]`，曾用 `Object.entries` 循环，结果下标 `"0"` 被当成待替换字符串，全书每个 `0` 都被替换掉（`I_{0}`、表格数字全毁，57 页掉到 47 页）。
2. **`inline-block` 会新开块容器**，继承来的负 `text-indent` 会把内容推出框外——`li-n` 这类行内块必须补 `text-indent: 0`，否则 PDF 里序号整块消失。
3. **KaTeX 的行间公式是块级元素**，盒子宽度恒等于栏宽。`getBoundingClientRect()` 量不到真实内容宽度，判超宽要用 `scrollWidth`，否则超宽公式从没被收进去，直接被页边裁掉。
4. **分数线别用 `border-bottom` 调细**：低于 1 CSS px 的边框会被 Chrome 打印吸附成 1 px（0.75 pt），`.01em` 和 `.032em` 出来一样粗；现用 `linear-gradient` 做线（PDF 里是 shading，不吸附）。
5. **`figure.float` 只绕横幅**（`aspect ≤ 1.02`）。竖幅绕排会把行宽挤窄，被推到页顶还留空洞；确需绕排的单张竖图在 `scripts/config/patches.mjs` 的 `FIG_FLOAT` 里点名，`src/js/figures.js` 认 `data-float`。
6. **分页别乱加 `break-after: avoid`**：把整条推导链粘成一块，装不下就整块跳页，页底空出半页。只对“引出句→公式”生效，公式之间允许断。
7. **docx 的 OMML 里括号必须是半角**（`m:t` 内 `（` 会让 KaTeX 撑出大空隙）。改 docx 的 `xml` 时注意有的包 CRC 是坏的，读 zip 要跳过校验。
8. **`dist/*.pdf` 被 Acrobat 打开时无法替换**（Windows `PermissionError`）。`merge.py` 已改为原子写入，占用时另存 `.new.pdf` 并非零退出——看到 `LOCKED` 就让用户关掉阅读器再跑。
9. **`--wrap=none` 的 pandoc 会吞段落**：2-3 有一段正文被图注文本框顶掉，2-5 的 `[1]：标题` 与 `<ol>` 编号各自残缺。补在 `scripts/config/patches.mjs` 的 `TEXT_FIX` 与 `src/js/lists.js` 的列表拆解里。
10. **图表编号不写死**：正文里写 `[[fig:文件名]]`，由出图顺序解析成蓝色「图 N」；增删、调序插图后引用自动跟随。页码同理，由 `scripts/pdf/pagemap.py` 回填。
11. **颜色只有实色**，每个 hex 唯一（CMYK 映射按 hex 匹配）；重绘图的配色必须用 `tokens.css` 里的蓝/橙，正文里描述颜色的句子也要同步（见 2-1 的“红线→蓝线”）。
12. **`build/` 与 `dist/` 是产物**，不要手改；要改效果就改 `src/` 或 `scripts/`。

## 6. 排版口径

- 三族字体：`GS Text`/`GS Display`（西文与数字）、思源黑 `SHS`、思源宋 `SHSerif`。文学类宋体、非文学黑体，由 `serif` 判定。
- 正文 9.6/15（宋）与 9.25/15（黑）；`h3` 10.5/16.5 蓝、`h2` 12/22.5 蓝；条目小标题 `.fn-h` 9.8/13 墨色、编号蓝；书眉 7/7.5。
- 全刊唯一强调色是信号蓝 `#458CEE`（深 `#2F6FD6`），次强调橙 `#ED7207` 只用于注释。
- 中文标点全角，句末必须有句号；数字与变量走 KaTeX，不与正文混字体。
- 书名《共鸣 RESONANCE》，期号在 `build.mjs` 的 `ISSUE` 常量（当前 `2026 冬 / VOL. 02`，标记 TODO）。

## 7. 验收方式

- 只认渲染出来的 PDF：`pypdfium2` 把页面渲成 PNG 打开看（`pdf[i].render(scale=2).to_pil().save(...)`），逐项看版式；不要用 DOM 尺寸代替目检，也不要每改一行就截图刷屏。
- 每次重建确认 **58 页**、`mathErrors` 为空、无 `TEXT_FIX miss` / `FIG_REF miss`。改结构（拆分模块、重排 CSS）后再加一道 `npm run diff -- <旧.pdf> <新.pdf>`：逐页像素零差异才算没动版式。
- 不测量字符坐标来判断“有没有被裁”，先看渲染结果。

## 8. 已知未完成

- 2-5 第 44 页（图 3 那页）底部空约 225 pt、第 42 页有一处约 130 pt 断口，成因是竖幅肖像绕排装不下整块跳页，待调。
- 字体仍是 Chrome 子集化的 Type3 大户（参考刊 InDesign 为 0），部分老 RIP 可能报错。
- `icc/gs_default_cmyk.icc` 是占位 profile，付印前应换 FOGRA39。
- 2-2 的“韦伯常数”表格在源 docx 里是合并单元格，pandoc 转出后每行重复文字，尚未改成三线表。

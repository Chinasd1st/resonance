# 样式标准

> 规范文件：**改版式前先读这里**，取值出处见 `DESIGN-TOKENS.md`，令牌落在 `src/css/tokens.css`。
> 冲突时的优先级：本文件 > `DESIGN-TOKENS.md` > 现有 CSS 的既有取值。发现成品与本文件不符，改成品或改文件，不要留下两套。

## 1. 字体：只允许字重轴

全书三族，且**只允许用字重（`wght`）区分**：

| 族 | 用途 | 来源 |
| --- | --- | --- |
| `GS Text` / `GS Display` | 西文、数字、标题、图注、表格 | Google Sans Flex 静态实例 |
| `SHS` | 非文学正文、标题中文 | 思源黑 |
| `SHSerif` | 文学正文、诗 | 思源宋 |

**硬性规则**：Google Sans Flex 是可变字体，`wght` 之外的轴——`wdth`（宽度）、`opsz`（光学尺寸）、`slnt`（倾斜）、`ROND`（圆角）、`GRAD`（灰度）——**一律钉在字体默认值**。

- 禁止在 CSS 里写 `font-variation-settings`（任何轴，包括 `wght`；字重用 `font-weight`）。
- 禁止在 CSS 里写 `font-stretch` / `font-optical-sizing` / `font-synthesis` 去模拟这些轴。
- 新增字体实例只能在 `scripts/setup/fonts.py` 里加，且实例化的 `loc` 只允许 `wght` 取值，其余轴显式取 `axes[tag][1]`（默认值）——照 `GSF-W-*` 那四行的写法。
- 不要为了「标题更紧」去开 `wdth`：标题的字距靠 `letter-spacing`（单位 em/pt）与 `--t-title*` 令牌调。
- `GS Cond`（`wdth=25`）目前**没有进入正文实现**，不要启用；真要窄体先改本节。

理由：非字重轴会造成同一族在不同字号下字形骨架不一致（同一个数字在 150 pt 大编号和 8 pt 页码里长得不是一家人），而这本书的识别度全靠「大编号 + 标题」的字重反差。

## 2. 令牌

- 一切尺寸、字号、颜色、线宽从 `src/css/tokens.css` 取；**禁止在版式 CSS 里写新的 hex 或裸 pt 字号**。
- 例外只有两种：`@page` 的边距（`calc(var())` 在 `@page` 里会被 Chrome 丢弃，必须写字面值），以及一次性微调（如 `[data-id="2-2"] .text { line-height: 14.2pt }`）——这类微调必须带注释说明「为什么不是 15」。
- 令牌由 `DESIGN-TOKENS.md` §9 逐字生成，改值先改文档。

## 3. 颜色

- **只允许实色**，不用透明度、渐变、混合模式（网点、雾化、颗粒都在位图里，见 `scripts/art/`）。
- 每个 hex 唯一：CMYK 转换按 hex 逐一映射，出现近似色就会印出「两个蓝」。
- 强调色只有信号蓝 `#458CEE`（深 `#2F6FD6`）；橙 `#ED7207` 只用于注释、社徽与「待确认」标记。
- 正文里描述颜色的句子必须与插图配色一致（改图必改文，见 `scripts/config/patches.mjs` 的 `TEXT_FIX`）。

## 4. 线与版心

- 线宽只有 `0.25 / 0.5 / 1 pt` 三档，没有 1.5 pt。
- 版心 496 × 720 pt，基线 15 pt，双栏 240 + 16 + 240。所有纵向节奏用 `var(--bl)` 的倍数，不要写 14、22 这种。
- 分数线**不要用 `border-bottom` 调细**：低于 1 CSS px 的边框会被 Chrome 吸附成 1 px，改用 `linear-gradient`（现写法在 `src/css/math.css`）。

## 5. 分层：正文层 / overlay 层

- 越出版心的东西（满版底色、出血照片、章扉页、大色块）**只能画在 overlay 层**（`scripts/overlay/*` + `src/css/overlay.css`、`src/css/chapter.css`、`src/css/art/`）。正文层里任何超出版心的元素都会让 Chrome 把整份文档等比缩小。
- 正文层的元素只排字；overlay 层只排装饰，不排正文（除了章扉页的标题/引语——那里没有正文）。
- 新增满版版式时，`merge.py` 的 `under` 页（`build/under.json`）决定 overlay 垫在正文下面还是压在上面。

## 6. 图

- 图注编号不写死：正文写 `[[fig:文件名]]`，由 `src/js/refs.js` 按出图顺序解析。
- 单图默认只绕横幅（`aspect ≤ 1.02`）；竖幅要绕必须在 `scripts/config/patches.mjs` 的 `FIG_FLOAT` 里点名。
- 重绘插图一律走 `scripts/figures/`（viewBox 单位 = pt，1:1），不要贴位图。
- 图宽沿用原稿英寸值，改宽必须成对改高（`FIG_W`）。

## 7. 文件组织

- 加一条版式规则 → 放进 `src/css/` 对应的分区（`base / frontmatter / article / math / figures / tables / notes`），不要新建文件；篇目专属的跨页样式才放 `src/css/art/<篇号>.css`。
- 加一个运行时变换 → 在 `src/js/` 新建模块，并在 `src/assets.mjs` 的 `TRANSFORM_JS` 里按依赖顺序登记（页面走 `file://`，只能用经典脚本 + `window.RS`）。
- 加一张图 → 在 `scripts/figures/` 建模块，并在 `figures/index.mjs` 登记 `"<篇号>/<文件名>"`。
- 加一页/一个版式组件 → 先在 `content/*` 里生成 markup，样式进 CSS 分区，坐标以 pt 或 mm 明确写出并注明参照原点。

## 8. 验收

- 只认渲染出来的 PDF：`pypdfium2` 渲 PNG 亲眼看，不用 DOM 尺寸代替目检。
- 版式改动必须跑 `npm run diff -- 旧.pdf 新.pdf`；非零差异要能逐条解释（是本次要改的那一处，而不是顺手带出来的）。
- 改完确认 58 页、`mathErrors` 为空；页数变了就要说明变了哪一页、为什么。

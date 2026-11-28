# 构建与依赖标准

> 规范文件，配合 `AGENTS.md` §2 使用。**取值以本文件为准**，AGENTS.md 里的「踩过的坑」是经验，不是标准。
> 改这里之前先确认：换依赖会不会改分页（Chrome / pandoc / GS 的版本都会）。

## 1. 工具链

| 依赖 | 用途 | 版本下限 | 装在哪 |
| --- | --- | --- | --- |
| Node | 跑 `scripts/**/*.mjs` | 18（实测 22.22.2） | 系统 |
| pandoc | `docx → html5 / gfm`，参数 `--katex --wrap=none --extract-media` | 3.x（实测 3.9） | PATH |
| Google Chrome | 打印引擎： CSS 分页、字体光栅、`preferCSSPageSize` | 实测 157 | 默认安装路径，可用 `CHROME` 覆盖 |
| Ghostscript | RGB → DeviceCMYK、写 `/OutputIntents` | 10.x（实测 10.07.1） | 可用 `GS` 覆盖 |
| Python | 合并、量页、定位、底图生成 | 3.10（实测 3.12.7） | PATH，或用 `PYTHON` 指定 |

外部程序路径只有两个来源：`process.env` 覆盖，或默认值。**不要在脚本里写死绝对路径**——仓库根一律由 `scripts/lib/path.mjs` 从 `import.meta.url` 推出。

## 2. Python 依赖

清单在仓库根的 `requirements.txt`，装法：

```bash
python -m pip install -r requirements.txt
```

| 包 | 谁用 | 什么时候必需 |
| --- | --- | --- |
| `pypdf` | `pdf/merge.py`、`pdf/pagemap.py`、demo 水印、cmyk 挂 OutputIntent | 每次构建 |
| `pypdfium2` | `pdf/findtext.py`、`tools/pdfdiff.py` | 每次构建（1-2 雾蓝底定位） |
| `numpy` | `art/*.py`（网点、光栅、颗粒） | 每次构建 |
| `Pillow` | `art/*.py` 的读写与滤镜 | 每次构建 |
| `fonttools` + `brotli` | `setup/fonts.py` 切可变字体 | 只在备字体时 |

解释器由 `scripts/lib/run.mjs` 解析：`PYTHON` → PATH 上的 `python` → `py` → `%LOCALAPPDATA%\Programs\Python\3.11–3.13`，**缺包也会换下一个**（`ModuleNotFoundError` 视同不适用）。所以「第一行 `python` 不是带 pypdf 的那个」不会再让构建崩在合并前。

## 3. 一次性初始化

```bash
npm install                                   # katex + playwright-core（不下载 Chromium）
python -m pip install -r requirements.txt
python scripts/setup/fonts.py                 # 唯一需要手工备料的一步，见 §4
powershell -File scripts/setup/envcheck.ps1   # 工具链 / 字体 / ICC / 缓存自检
powershell -File scripts/setup/convert.ps1    # docx → build/html
npm run all                                   # 四份 PDF
```

`scripts/setup/setup.ps1` 是上面的合并版（额外拷 ICC、把参考刊前 24 页渲成 PNG），日志在 `build/logs/`。

## 4. 字体

`fonts/` 229 MB，不入库，克隆后是空目录。`src/css/fonts.css` 引用其中 20 个文件，全部由 `scripts/setup/fonts.py` 生成：

- 思源黑 5 个、思源宋 6 个：从系统字体目录复制。
- Google Sans 9 个静态实例：从 **Google Sans Flex 可变字体**按 `(wght, wdth, opsz)` 切出。该可变字体不随仓库分发，需自备同名文件到 `%LOCALAPPDATA%\Microsoft\Windows\Fonts`。
- 切轴规则见 `agent/style.md` §1：**只允许 `wght` 变化**。

缺字体**不会**让构建失败：Chrome 静默回退，页数照旧、字形全错。所以「跑通了」不等于「字体对」，必须看 `envcheck` 的清单或 PDF 里嵌入的字体名。

## 5. 构建与验收

```bash
npm run build      # 全量：装配 + 两遍打印 + 分页回填 + 底图 + 合层（约 62 秒）
npm run release    # 全量 + demo + cmyk（交付时跑，日常不要跑）
npm run shot -- 4 20          # 从**现有** PDF 取页渲 PNG（约 2 秒，不构建）
npm run overlay    # 复用正文层，只重做 overlay + 合层（约 10 秒）
npm run body       # 复用 overlay 层与底图，只重做正文层 + 合层（约 15 秒）
npm run figs       # 逐张渲出 figures/ 的 SVG，目检用
npm run diff -- 旧.pdf 新.pdf   # 逐页像素回归
```

### 5.1 一次改完，只构建一次

**一批改动全部写完再构建。** 不要每改一处就跑 `npm run build`——一次构建要 Chrome 打两遍再走 Python 合层，六十秒起步；改十处就建十次，等于把同一份排版重算十遍，除了拖时间没有任何信息量。

迭代期的定位靠**局部证据**，不靠重建：

| 想知道 | 用这个 | 成本 |
| --- | --- | --- |
| 某段 HTML 补丁有没有命中 | 看 `build/html/<id>.html`、`build/book.html` | 零 |
| 某个元素的真实位置 | `getBoundingClientRect` 量一下（Chrome 里跑几行） | 秒级 |
| **上一步的产物长什么样** | `npm run shot -- 4 20`（取页渲图，可选 `--pdf=cmyk`、`--scale=6`） | **2 s** |
| 只改了 overlay 层（页码、书眉、色标） | `npm run overlay` | **10 s** |
| 只改了正文层（文案、补丁表、正文 CSS），且页序不变 | `npm run body` | **15 s** |
| 改了底图参数（`art.mjs` 的 spec） | `npm run build`（必须全量，底图要重算） | 62 s |
| 某篇改动是否只影响自己 | `node scripts/build.mjs --only 1-2`（只排这几篇） | 十几秒 |

构建一次的时机是「这一批改动我认为已经完整」，不是「改了一行想看看」。构建完一次做完 §5.2 的全部核对，不要建一次、看一页、再建一次。

**日常不出 demo / cmyk。** 这两个只是同一份 PDF 的派生（叠水印 / Ghostscript 转 CMYK），每改一处就重出等于白等两分钟，而且它们不参与版式判断。只有交付或要核对印刷效果时才 `npm run release`。

**全量为什么贵**：62 秒里约 40 秒花在底图（8 组半调 / 银盐 / 雾化，Python 逐像素）。所以只要没动 `art.mjs` 的 spec，`--no-art` 就是最值钱的那个开关——`npm run overlay` 与 `npm run body` 都默认带上它。

### 5.1.1 增量开关的口径

`--reuse=body` / `--reuse=overlay` 复用上一步的 PDF，**只在检查时用**：

- 复用即代表「那一层没变」。改了正文却 `--reuse=body`，产出就是旧的，而且不会报错。
- 增量产出**不能当交付件**：`npm run release` 必须从全量开始。
- `--reuse=body` 与 `--only` 互斥（`--only` 会改页序），脚本里已有断言。
- `--no-art` 复用 `build/art/*.jpg`；改了 `art.mjs` 的 spec 却加这个开关，底图不会更新。

### 5.2 每次构建必须核对

- **58 页**（6 前置 + 52 正文）
- `mathErrors` 为空
- 无 `TEXT_FIX miss` / `FIG_REF miss`
- 改结构或版式后加一道 `npm run diff -- 旧.pdf 新.pdf`，逐页零差异才算没动版式

`--only` 的结果不能用于验收：它只排指定篇目，页数、页码基准都与成品不同，只适合看局部版式。

## 6. 产物

| 文件 | MediaBox | TrimBox | 说明 |
| --- | --- | --- | --- |
| `dist/resonance-screen.pdf` | 210 × 297 | = Media | 阅读版 |
| `dist/resonance-print-rgb.pdf` | 216 × 303 | 内缩 3 mm | 付印（RGB） |
| `dist/resonance-print-cmyk.pdf` | 216 × 303 | 内缩 3 mm | DeviceCMYK + OutputIntent |
| `dist/resonance-demo.pdf` | 同 print-rgb（216 × 303） | 同 print-rgb | 叠水印试读版（`build-demo.mjs` 以 print-rgb 为底） |

`dist/*.pdf` 被 Acrobat 打开时无法替换，`pdf/merge.py` 会另存 `.new.pdf` 并以 exit 2 退出（`LOCKED`）——关掉阅读器重跑。

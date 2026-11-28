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
npm run build      # 装配 + 两遍打印 + 分页回填 + 合层，约 45 秒
npm run all        # build → demo → cmyk
npm run figs       # 逐张渲出 figures/ 的 SVG，目检用
npm run diff -- 旧.pdf 新.pdf   # 逐页像素回归
```

每次构建必须核对：**58 页**（6 前置 + 52 正文）、`mathErrors` 为空、无 `TEXT_FIX miss` / `FIG_REF miss`。改结构或版式后再加一道 `npm run diff`。

## 6. 产物

| 文件 | MediaBox | TrimBox | 说明 |
| --- | --- | --- | --- |
| `dist/resonance-screen.pdf` | 210 × 297 | = Media | 阅读版 |
| `dist/resonance-print-rgb.pdf` | 216 × 303 | 内缩 3 mm | 付印（RGB） |
| `dist/resonance-print-cmyk.pdf` | 216 × 303 | 内缩 3 mm | DeviceCMYK + OutputIntent |
| `dist/resonance-demo.pdf` | 同 screen | 同 screen | 叠水印试读版 |

`dist/*.pdf` 被 Acrobat 打开时无法替换，`pdf/merge.py` 会另存 `.new.pdf` 并以 exit 2 退出（`LOCKED`）——关掉阅读器重跑。

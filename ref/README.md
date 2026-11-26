# ref/ —— 参照物

上一期成品与对它的反查记录。这里的文件只作参照，不参与渲染。

| 文件 | 说明 |
| --- | --- |
| `2025-autumn-issue-cn.pdf` | 2025 秋季刊（第十三期）成品，196 页，Adobe InDesign 21.0 导出，作版式与字体的对照 |
| `font-audit.py` | 反查任意 PDF 每页实际使用的字体、字号与子类型 |

```bash
python ref/font-audit.py ref/2025-autumn-issue-cn.pdf
```

字体名取自 pdfium 的按字符回报（`FPDFText_GetFontInfo`），不是资源表里声明过却没用上的字体；字号取自内容流的 `Tf × Tm` 缩放，因为 InDesign 把 `Tf` 写成 1、真正的字号在文本矩阵里，而 pdfium 的 `FPDFText_GetFontSize` 对这种页面恒返回 1.0。

---

## 一、字体清单（196 页，46 种）

### 正文

| 字体 | 页数 | 字符数 | 字号 | 用途 |
| --- | --- | --- | --- | --- |
| IBM Plex Sans SC Text | 112 | 81148 | 8.5 / 7.1 / 11.3 | 中文正文（黑体篇目） |
| 思源宋体 Regular | 70 | 43296 | 8.5 / 17 / 11.3 | 中文正文（宋体篇目） |

### 标题

| 字体 | 页数 | 字号 | 用途 |
| --- | --- | --- | --- |
| 思源宋体 SemiBold | 49 | 8.5 / 25.5 / 34 | 篇名、大标题 |
| 思源宋体 Medium | 11 | 11.3 / 17 / 34 / 82.2 | 卷首语、章题 |
| IBM Plex Sans SC Bold | 67 | 8.5 / 25.5 / 42.5 / 51 | 栏目标题 |
| IBM Plex Sans SC Semibold | 35 | 8.5 / 11.3 / 7.1 | 小标题、导语 |
| IBM Plex Sans SC Medium | 37 | 8.5 / 7.1 / 17 | 书眉、小题 |
| IBM Plex Sans SC（无字重后缀） | 6 | 8.5 | 零星强调 |

### 书法体

厂商「火山字型」，字面名「青荷」；PDF 里的 PostScript 名是 `HuoshanQinghe`，检索字体文件时按这个名字找。

| 字体 | 页数 | 字号 | 用途 |
| --- | --- | --- | --- |
| 火山字型 青荷 Regular<br>`HuoshanQinghe-Regular` | 67 | 9.9 / 25.5 / 42.5 | 「封面故事」「放学后」等栏目名 |
| 火山字型 青荷 Bold<br>`HuoshanQinghe-Bold` | 13 | 12.8 / 56.7 | 同上，更重的标题 |

### 西文与数字

| 字体 | 页数 | 字号 | 用途 |
| --- | --- | --- | --- |
| STK Bureau Serif Light | 62 | 8.9 / 119.1 / 13.4 | 全部阿拉伯数字、英文正文 |
| STK Bureau Serif Book | 34 | 8.9 / 26.8 / 51 | 英文标题 |
| STK Bureau Serif Medium | 2 | 8.9 | 强调 |
| Astoria Sans Bold Condensed | 18 | 62.4 | 封面封底英文大字 |
| Astoria Sans Medium / Roman、Astoria Roman / Medium | 各 2 | 5.5–17.2 | 封面、封底 |
| Halyard Display Regular / Medium / SemiBold、Halyard Micro Medium | 13 / 3 / 2 / 11 | 7.1–263.6 | 英文专题页 |
| Obviously Narw / Medi / Cond / CondItalic / Comp | 4–8 | 8.5–113.4 | 英文专题页要点 |

### 辅助

| 字体 | 页数 | 字号 | 用途 |
| --- | --- | --- | --- |
| 更纱黑体 SC Regular / SemiBold | 38 / 27 | 7.1 | 署名、图注、采访对象 |
| JinhuaSerifC Regular | 4 | 8.5 / 46.2 | 「附近 · 物种志」专题页 |
| 方正新书宋 ARFangXinShuH7 | 2 | 9 / 32.6 | 封面刊名 |
| AdobeSongStd-Light | **192** | 6 | **不是版面字体**，见下 |
| PingFang SC、ChillKai、MiSans Heavy、FrexSans VF、CoFoSans VF、GesturaText、KentenGeneric、Source Serif 4 / Pro、IBM Plex Sans Italic 系列 | 1–3 | — | 广告页，每页一套 |

## 二、AdobeSongStd-Light（6 pt，192 页）是印前标记

每页下缘 y≈6 pt 处有一行 `TKM13_cn_13.6.indd 11/15/25 10:18 PM`。这是 InDesign 导出时带出的 slug（文件名 + 导出时间），既不属于版面，也把内部信息印在了纸上。这份 PDF 的 MediaBox 因此比成品高，付印前应当删除并改按 TrimBox 裁切。

## 三、正文字体按篇目分族，不是混排

按每页「字数最多的字体」排序：

- p3–96：IBM Plex Sans SC（黑体）
- p97–151：思源宋体，其中 p140–143 换成金华宋（专题页）
- p153–183：IBM Plex Sans SC（黑体）
- p186–194：思源宋体

即报道类用黑体、文学类用宋体，与我们「文学宋体 / 非文学黑体」的分法一致。

逐页表里出现的 `AdobeSongStd-Light` 单页（p10、p16、p24…）是整页广告图，页面上除了 slug 没有别的文字。

## 四、字体子类型

| 子类型 | 数量 |
| --- | --- |
| Type0（CID） | 759 |
| Type1 | 327 |
| TrueType | 92 |
| **Type3** | **0** |

InDesign 会把用到的字形做成 CID 子集，不产生 Type3。本刊走 Chrome 打印，前 20 页就有 1401 个 Type3 对象——不影响出片，但文件更大，老 RIP 更容易报错。

## 五、与本刊的四处差异

| 项目 | 参考刊 | 本刊 |
| --- | --- | --- |
| 中文正文（黑体） | IBM Plex Sans SC 8.5 pt | 思源黑体 + Google Sans 9.25 pt |
| 中文正文（宋体） | 思源宋体 8.5 pt | 思源宋体 9.6 pt |
| 数字与西文 | STK Bureau Serif 8.9 pt（衬线） | Google Sans（无衬线） |
| 书法层 | 火山字型 青荷，栏目名与专题大字 | 无，章号到篇名全用 Google Sans Display |

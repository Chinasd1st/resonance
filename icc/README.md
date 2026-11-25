# ICC 配置文件

付印转换（`node scripts/build-cmyk.mjs`）用的色彩空间定义。RGB 稿只用于屏幕校对，
真正送印前必须落到某个确定的 CMYK 条件上，否则同一份 PDF 在印厂会出不同的蓝。

## 现有文件

| 文件 | 色彩空间 | 类别 | 来源 | 用途 |
| --- | --- | --- | --- | --- |
| `gs_default_cmyk.icc` | CMYK / Lab PCS | printer | Ghostscript 10.07 自带 | **默认**目标空间，接近 SWOP 的一般印刷条件，用于打样与内部核对 |
| `sRGB.icc` | RGB / XYZ PCS | monitor | 通用 sRGB（IEC 61966-2.1） | 源空间参考；正文/图片都按 sRGB 制作 |

`gs_default_cmyk.icc` 是「通用」CMYK，不是某台机器或某个标准的实测特征文件。
它保证颜色能落地、不出现 RGB 直出，但**不能保证与印厂实际印刷一致**。

## 正式付印前要做的替换

向印厂索取他们的 ICC（通常随邮件给一个 `.icc`），按下面的命名放进本目录，再指定：

```bash
node scripts/build-cmyk.mjs --icc=icc/JapanColor2001Coated.icc
```

命名建议 `<标准名>.icc`，只保留 ASCII：

- `JapanColor2001Coated.icc` — 日本 2001 年涂布纸标准（国内书刊常用）
- `CoatedFOGRA39.icc` — ISO 12647-2 涂布纸（欧标）
- `UncoatedFOGRA29.icc` — 胶版纸/轻型纸
- `GRACoL2013_CRPC6.icc` — 北美商业印刷

注意：FOGRA / Japan Color 的特征文件由 ECI、
Japan Color 企业协议会授权发行，不随本仓库分发 —— 从印厂或官方渠道取得后放到这里即可，
`.gitignore` 不排除本目录（除本文件与上述两份基础文件外，别把大文件提交进来）。

## 生成的 PDF 里有什么

`dist/resonance-print-cmyk.pdf`：

- 全部颜色为 `DeviceCMYK`（内容流里只有 `k` / `K`，没有 `rg` / `RG`）
- `/OutputIntents` 挂 `GTS_PDFX` 意图，`/DestOutputProfile` 内嵌所用 ICC，
  `OutputConditionIdentifier` 取 ICC 文件名，印厂能看到该按哪个条件还原
- 页面 216 × 303 mm，`TrimBox` 内缩 3 mm（成品 210 × 297），`BleedBox` 为整页
- 字体全部嵌入并子集化

仍不是严格 PDF/X-4：未做 PDF/X 元数据声明（`GTS_PDFXVersion`），也未经过 preflight 校验。
若印厂要求 PDF/X-4 认证文件，还需补 XMP 声明并用 callas / Acrobat preflight 过一遍。

## 校验

```bash
# 每页油墨覆盖率（总墨量超过 300% 时印厂会压色）
gs -q -o - -sDEVICE=inkcov dist/resonance-print-cmyk.pdf

# 看输出意图
python -c "from pypdf import PdfReader; r=PdfReader('dist/resonance-print-cmyk.pdf'); print(r.trailer['/Root']['/OutputIntents'])"
```

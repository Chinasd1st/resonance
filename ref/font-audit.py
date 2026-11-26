# -*- coding: utf-8 -*-
"""反查一份 PDF 里每个字符实际使用的字体，以及各字体声明的字号。

用法：
    python ref/font-audit.py ref/2025-autumn-issue-cn.pdf

输出三张表：
  1. 字体清单：基础名 → 页数、字符数、字号（内容流里 Tf 的声明值）、子类型
  2. 逐页主导字体：判断版面是「通篇混排」还是「按篇目分族」
  3. 字体子类型计数：Type3 是 Chrome 打印产物的特征，InDesign 产出为 0

字体名来自 FPDFText_GetFontInfo（pdfium 按字符回报的实际分配），不是资源表里
「声明过但没用上」的字体。字号取内容流的 Tf：InDesign 会把最终字号写进 Tf，
而 pdfium 的 FPDFText_GetFontSize 对这类页面恒返回 1.0，不能用。
"""
import collections
import ctypes
import logging
import re
import sys

import pypdfium2 as pdfium
import pypdfium2.raw as C
from pypdf import PdfReader

TEXT = re.compile(rb"\((?:[^()\\]|\\.)*\)", re.S)
# InDesign 把 Tf 写成 1、把真正的字号放进 Tm 的缩放里，所以字号 = Tf × Tm 缩放
TOK = re.compile(
    rb"/([A-Za-z0-9_.+-]+)\s+([\d.]+)\s+Tf"                                   # 1,2 字体与 Tf 值
    rb"|([-\d.]+)\s+([-\d.]+)\s+[-\d.]+\s+[-\d.]+\s+[-\d.]+\s+[-\d.]+\s+Tm"   # 3,4 文本矩阵缩放
    rb"|(TJ|Tj|'|\")"                                                          # 5 出字操作符
)

logging.getLogger("pypdf").setLevel(logging.ERROR)


def page_fonts(page):
    """({资源名: 基础名}, {基础名: Counter(字号)})"""
    res = (page.get("/Resources") or {}).get_object()
    font_map = {}
    for key, ref in (res.get("/Font") or {}).items():
        try:
            font_map[str(key).lstrip("/")] = str(ref.get_object().get("/BaseFont")).split("+")[-1]
        except Exception:
            font_map[str(key).lstrip("/")] = "?"
    sizes = collections.defaultdict(collections.Counter)
    try:
        data = page.get_contents().get_data()
    except Exception:
        return font_map, sizes
    data = TEXT.sub(b"()", data)          # 去掉字符串，免得把正文当操作符
    cur, tf, scale = None, 1.0, 1.0
    for m in TOK.finditer(data):
        if m.group(1) is not None:
            cur = font_map.get(m.group(1).decode(), m.group(1).decode())
            tf = float(m.group(2))
        elif m.group(3) is not None:
            scale = (float(m.group(3)) ** 2 + float(m.group(4)) ** 2) ** 0.5 or 1.0
        elif cur:
            sizes[cur][round(tf * scale, 1)] += 1
    return font_map, sizes


def main(path):
    pdf = pdfium.PdfDocument(path)
    reader = PdfReader(path)
    buf = ctypes.create_string_buffer(256)
    flags = ctypes.c_int()

    pages = collections.defaultdict(set)
    chars = collections.Counter()
    sizes = collections.defaultdict(collections.Counter)
    subtypes = collections.defaultdict(lambda: collections.Counter())
    dom = []

    for pno in range(len(pdf)):
        tp = pdf[pno].get_textpage()
        local = collections.Counter()
        for i in range(tp.count_chars()):
            if not C.FPDFText_GetFontInfo(tp.raw, i, buf, 256, ctypes.byref(flags)):
                continue
            name = buf.value.decode("utf-8", "ignore").split("+")[-1]
            chars[name] += 1
            pages[name].add(pno + 1)
            local[name] += 1
        dom.append(local.most_common(1)[0][0] if local else "-")

    for page in reader.pages:
        font_map, page_sizes = page_fonts(page)
        for base, counter in page_sizes.items():
            sizes[base].update(counter)
        res = (page.get("/Resources") or {}).get_object()
        for ref in (res.get("/Font") or {}).values():
            try:
                f = ref.get_object()
                subtypes[str(f.get("/BaseFont")).split("+")[-1]][str(f.get("/Subtype"))] += 1
            except Exception:
                pass

    print("== 字体清单（按页数排序）")
    print(f"{'字体':40s}{'页数':>5s}{'字符':>8s}  字号（Tf 出现最多的几个）")
    for base, ps in sorted(pages.items(), key=lambda kv: -len(kv[1])):
        top = sizes.get(base, collections.Counter()).most_common(4)
        sz = ", ".join(f"{s:g}" for s, _ in top) or "-"
        sub = "/".join(k.strip("/") for k in subtypes.get(base, {}))
        print(f"{base:40s}{len(ps):5d}{chars[base]:8d}  {sz:<26s} {sub}")

    print("\n== 逐页主导字体（连续相同则合并）")
    start, prev = 1, dom[0]
    for i, name in enumerate(dom[1:], start=2):
        if name != prev:
            print(f"  p{start}-{i - 1}  {prev}")
            start, prev = i, name
    print(f"  p{start}-{len(dom)}  {prev}")

    all_sub = collections.Counter()
    for c in subtypes.values():
        all_sub.update(c)
    print("\n== 字体子类型计数（Type3 = Chrome 打印产物常见，InDesign 为 0）")
    for k, v in all_sub.most_common():
        print(f"  {k.strip('/')}: {v}")


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else "ref/2025-autumn-issue-cn.pdf")

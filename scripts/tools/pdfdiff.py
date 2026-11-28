"""重构 / 改版后的回归校验：把两份 PDF 逐页渲成位图比像素。

用法：
    python scripts/tools/pdfdiff.py a.pdf b.pdf [scale]
    python scripts/tools/pdfdiff.py a.pdf b.pdf 1.2 --tol=0.02

判据：单页「明显不同」的像素占比（任一通道差 > 8）超过 tol（默认 0.02%）即算差异；
页数不等直接失败。退出码 0 = 版式零漂移，1 = 有差异。

依赖 pypdfium2 + numpy（构建环境本来就有）。刻意不做「像素完全相等」的比较：
只用容差判定，才能容忍 Chrome 的亚像素抗锯齿差异。
"""
import sys
import numpy as np
import pypdfium2 as pdfium


def main(argv):
    args = [a for a in argv[1:] if not a.startswith('--')]
    tol = 0.02
    for a in argv[1:]:
        if a.startswith('--tol='):
            tol = float(a.split('=', 1)[1])
    if len(args) < 2:
        print(__doc__)
        return 1
    a, b = args[0], args[1]
    scale = float(args[2]) if len(args) > 2 else 1.2

    pa, pb = pdfium.PdfDocument(a), pdfium.PdfDocument(b)
    print(f'pages {len(pa)} vs {len(pb)}')
    if len(pa) != len(pb):
        print('PAGE COUNT MISMATCH')
        return 1

    worst = []
    for i in range(len(pa)):
        ia = pa[i].render(scale=scale).to_pil().convert('RGB')
        ib = pb[i].render(scale=scale).to_pil().convert('RGB')
        if ia.size != ib.size:
            print(f'p{i + 1:02d} SIZE MISMATCH {ia.size} vs {ib.size}')
            worst.append((100.0, i + 1, 255))
            continue
        d = np.abs(np.asarray(ia, dtype=np.int16) - np.asarray(ib, dtype=np.int16))
        pct = float((d.max(axis=2) > 8).mean() * 100)
        worst.append((pct, i + 1, int(d.max())))
        if pct > tol or d.max() > 24:
            print(f'p{i + 1:02d} diff={pct:.4f}% max={int(d.max())}')

    worst.sort(reverse=True)
    print('--- worst 5 (diff%, page, max channel delta)')
    for pct, page, mx in worst[:5]:
        print(f'  {pct:.4f}%  p{page}  max={mx}')
    ok = worst[0][0] <= tol
    print('OK' if ok else 'DIFFERS')
    return 0 if ok else 1


if __name__ == '__main__':
    sys.exit(main(sys.argv))

"""程序化半调网点底图生成脚本（与 chapter-art.py 保持同一网点、错位与纸纹工艺）。

由 scripts/overlay/art.mjs 调用：python scripts/art/halftone-art.py <spec.json> <out.jpg>
复用同目录 chapter-art.py 的 AM 余弦圆点网 screen_at()、套印错位 shift() 与纸纹 paper_texture()。

spec（单位 mm，原点 = 出血页左上角，整页 216 × 303 mm）：
  paper: [r, g, b]（默认 chapter_art.PAPER = [238, 233, 222]）
  seed: 纸纹随机种子；texture: True/False；tex_strength: 纸纹叠加系数（深墨底建议 0.4）
  dpi: 默认 300；quality: 默认 90；out_rect: [x, y, w, h] 可选裁切输出
  plates: [{
    rgb: [r, g, b], angle: 15, lpi: 40, shift: [dx, dy],
    absorb: 0.7, density: 0.92, blend: 'multiply' | 'over', floor: 0.02,
    shapes: [{ kind: 'radial' | 'band' | 'ridge' | 'slats' | 'gradient', op?: 'max'|'add'|'mul'|'mul_inv', ... }]
  }]
"""
import importlib.util
import json
import math
import sys
from pathlib import Path
import numpy as np
from PIL import Image


def _load_chapter_art():
    path = Path(__file__).with_name('chapter-art.py')
    spec = importlib.util.spec_from_file_location('chapter_art', path)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


_CA = _load_chapter_art()


def _smoothstep(t):
    t = np.clip(t, 0.0, 1.0)
    return t * t * (3.0 - 2.0 * t)


def _box_window(xx, yy, sh):
    """矩形区间 [x0, y0, x1, y1] 的四边羽化遮罩（0–1）。"""
    mx = np.ones_like(xx)
    my = np.ones_like(yy)
    if 'x0' in sh:
        fl = sh.get('fade_l', 0.0)
        mx *= _smoothstep((xx - sh['x0']) / fl) if fl > 0 else (xx >= sh['x0']).astype(np.float32)
    if 'x1' in sh:
        fr = sh.get('fade_r', 0.0)
        mx *= _smoothstep((sh['x1'] - xx) / fr) if fr > 0 else (xx <= sh['x1']).astype(np.float32)
    if 'y0' in sh:
        ft = sh.get('fade_t', 0.0)
        my *= _smoothstep((yy - sh['y0']) / ft) if ft > 0 else (yy >= sh['y0']).astype(np.float32)
    if 'y1' in sh:
        fb = sh.get('fade_b', 0.0)
        my *= _smoothstep((sh['y1'] - yy) / fb) if fb > 0 else (yy <= sh['y1']).astype(np.float32)
    return my * mx


def _eval_shape(sh, xx, yy):
    kind = sh['kind']
    peak = float(sh.get('peak', 1.0))

    if kind == 'radial':
        dist = np.hypot(xx - sh['cx'], yy - sh['cy'])
        r0, r1 = float(sh.get('r0', 0.0)), float(sh.get('r1', 40.0))
        val = _smoothstep((r1 - dist) / max(r1 - r0, 1e-3))
        if sh.get('power', 1.0) != 1.0:
            val = val ** float(sh['power'])
        if 'half_plane' in sh:
            nx, ny, d, feather = sh['half_plane']
            val = val * _smoothstep((nx * xx + ny * yy - d) / max(feather, 1e-3))
        return (val * peak).astype(np.float32)

    if kind == 'band':
        return (_box_window(xx, yy, sh) * peak).astype(np.float32)

    if kind == 'ridge':
        pts = sorted(sh['pts'], key=lambda p: p[0])
        xs = [p[0] for p in pts]
        ys = [p[1] for p in pts]
        ridge_y = np.interp(xx[0], xs, ys)[None, :].astype(np.float32)
        ft = max(float(sh.get('feather_top', 2.0)), 1e-3)
        val = _smoothstep((yy - (ridge_y - ft * 0.5)) / ft)
        if 'fade_bottom' in sh:
            yb0, yb1 = sh['fade_bottom']
            val = val * _smoothstep((yb1 - yy) / max(yb1 - yb0, 1e-3))
        val = val * _box_window(xx, yy, {k: sh[k] for k in ('x0', 'x1', 'fade_l', 'fade_r') if k in sh})
        return (val * peak).astype(np.float32)

    if kind == 'slats':
        box = _box_window(xx, yy, sh)
        ang = math.radians(sh.get('angle', -24.0))
        pitch = max(float(sh.get('pitch', 10.0)), 1e-3)
        duty = float(sh.get('duty', 0.35))
        soft = max(float(sh.get('soft', 0.12)), 1e-3)
        u = xx * math.cos(ang) + yy * math.sin(ang)
        phase = np.mod(u, pitch) / pitch
        d = np.abs(phase - 0.5)
        stripes = _smoothstep((duty * 0.5 + soft * 0.5 - d) / soft)
        return (box * stripes * peak).astype(np.float32)

    if kind == 'gradient':
        x0, y0, x1, y1 = sh['x0'], sh['y0'], sh['x1'], sh['y1']
        vx, vy = x1 - x0, y1 - y0
        denom = max(vx * vx + vy * vy, 1e-6)
        t = ((xx - x0) * vx + (yy - y0) * vy) / denom
        val = _smoothstep(t)
        if sh.get('power', 1.0) != 1.0:
            val = val ** float(sh['power'])
        if any(k in sh for k in ('fade_l', 'fade_r', 'fade_t', 'fade_b')):
            val = val * _box_window(xx, yy, sh)
        return (val * peak).astype(np.float32)

    raise ValueError(f'Unknown halftone shape kind: {kind}')


def main(spec_path, out_path):
    spec = json.load(open(spec_path, encoding='utf8'))
    dpi = spec.get('dpi', 300)
    mm = dpi / 25.4
    W, H = round(_CA.PAGE_W * mm), round(_CA.PAGE_H * mm)

    if spec.get('out_rect'):
        x, y, w, h = spec['out_rect']
        ox, oy, ow, oh = round(x * mm), round(y * mm), round(w * mm), round(h * mm)
    else:
        ox, oy, ow, oh = 0, 0, W, H

    rng = np.random.default_rng(spec.get('seed', 1))
    tex = _CA.paper_texture(oh, ow, rng) if spec.get('texture', True) else np.ones((oh, ow), np.float32)
    paper = np.array(spec['paper'], np.float32) / 255.0 if spec.get('paper') else _CA.PAPER
    img = np.broadcast_to(paper, (oh, ow, 3)).copy()

    xx = ((np.arange(ow, dtype=np.float32) + ox) / mm)[None, :]
    yy = ((np.arange(oh, dtype=np.float32) + oy) / mm)[:, None]

    for plate in spec.get('plates', []):
        cov = np.zeros((oh, ow), np.float32)
        for sh in plate.get('shapes', []):
            val = _eval_shape(sh, xx, yy)
            op = sh.get('op', 'max')
            if op == 'mul_inv':
                cov *= 1.0 - val
            elif op == 'mul':
                cov *= val
            elif op == 'add':
                cov = np.clip(cov + val, 0.0, 1.0)
            else:
                cov = np.maximum(cov, val)

        floor = float(plate.get('floor', 0.02))
        if floor > 0:
            cov = np.where(cov < floor, 0.0, cov)

        cell = dpi / float(plate.get('lpi', _CA.LPI))
        dots = _CA.screen_at(cov, float(plate.get('angle', 45)), cell, ox, oy)
        dx, dy = plate.get('shift', (0, 0))
        if dx or dy:
            dots = _CA.shift(dots, int(dx), int(dy))

        k = float(plate.get('absorb', 0.8))
        base = float(plate.get('density', 0.92))
        absorb = np.clip(base + (tex - 1.0) * 2.5 * k, base - 0.15 * k, base + 0.15 * k)
        dots *= absorb

        ink_rgb = np.array(plate['rgb'], np.float32) / 255.0
        if plate.get('blend', 'multiply') == 'over':
            img = img * (1.0 - dots[..., None]) + ink_rgb * dots[..., None]
        else:
            img *= 1.0 - dots[..., None] * (1.0 - ink_rgb)

    tex_strength = float(spec.get('tex_strength', 1.0))
    if spec.get('texture', True) and tex_strength != 0.0:
        img *= 1.0 + (tex[..., None] - 1.0) * tex_strength

    Image.fromarray((np.clip(img, 0.0, 1.0) * 255.0 + 0.5).astype(np.uint8)).save(
        out_path, quality=spec.get('quality', 90), dpi=(dpi, dpi), subsampling=0
    )


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])

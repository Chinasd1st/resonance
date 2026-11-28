// 2-3　四个分形：谢尔宾斯基 / 科赫 / 维切克 / 希尔伯特
// 四张图同属表格里的一格四联，尺寸与线宽一起定，改一张会牵动那一格的高度。
import { C, r2 } from './svg.mjs';

export function sierpinski() {
  const W = 100, H = 76.1;
  const base = 96 / Math.pow(2, 5);
  // 让三角形高度 = H - 2
  const h = H - 2, side = h / Math.sin(Math.PI / 3);
  const bx = (W - side) / 2, by = H - 1;
  const A = [bx + side / 2, by - h], B = [bx, by], Cp = [bx + side, by];
  const mid = (p, q) => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];

  let d = '';
  const walk = (a, b, c, n) => {
    if (n === 0) { d += `M${r2(a[0])} ${r2(a[1])}L${r2(b[0])} ${r2(b[1])}L${r2(c[0])} ${r2(c[1])}Z`; return; }
    const ab = mid(a, b), bc = mid(b, c), ca = mid(c, a);
    walk(a, ab, ca, n - 1); walk(ab, b, bc, n - 1); walk(ca, bc, c, n - 1);
  };
  walk(A, B, Cp, 5);
  return {
    vw: W, vh: H,
    body: `<path d="${d}" fill="none" stroke="${C.blue}" stroke-width="0.45" stroke-linejoin="miter"/>`,
  };
}

export function koch() {
  const W = 94, H = 29.2;
  const x0 = 2, x1 = 92, yb = 27;
  // 迭代：把每段三等分，中段向上折出等边三角形的两腰
  const iter = (a, b, n) => {
    if (n === 0) return [a];
    const dx = (b[0] - a[0]) / 3, dy = (b[1] - a[1]) / 3;
    const p1 = [a[0] + dx, a[1] + dy];
    const p2 = [a[0] + 2 * dx, a[1] + 2 * dy];
    // 顶点：绕 p1 把 (p2-p1) 旋转 -60°
    const vx = dx * Math.cos(-Math.PI / 3) - dy * Math.sin(-Math.PI / 3);
    const vy = dx * Math.sin(-Math.PI / 3) + dy * Math.cos(-Math.PI / 3);
    const peak = [p1[0] + vx, p1[1] + vy];
    return [...iter(a, p1, n - 1), ...iter(p1, peak, n - 1), ...iter(peak, p2, n - 1), ...iter(p2, b, n - 1)];
  };
  const pts = [...iter([x0, yb], [x1, yb], 3), [x1, yb]];
  const d = pts.map((p, i) => `${i ? 'L' : 'M'}${r2(p[0])} ${r2(p[1])}`).join('');
  return { vw: W, vh: H, body: `<path d="${d}" fill="none" stroke="${C.blue}" stroke-width="0.55" stroke-linejoin="miter"/>` };
}

export function vicsek() {
  const W = 88, H = 86.3;
  const S = 84, ox = (W - S) / 2, oy = (H - S) / 2;
  let d = '';
  // 每层 3×3 保留四角与中心（共 5 格），到第 3 层于格内画对角十字
  const walk = (x, y, size, n) => {
    if (n === 0) {
      d += `M${r2(x)} ${r2(y)}L${r2(x + size)} ${r2(y + size)}`
        + `M${r2(x + size)} ${r2(y)}L${r2(x)} ${r2(y + size)}`;
      return;
    }
    const c = size / 3;
    for (const [i, j] of [[0, 0], [2, 0], [0, 2], [2, 2], [1, 1]]) {
      walk(x + i * c, y + j * c, c, n - 1);
    }
  };
  walk(ox, oy, S, 3);
  return { vw: W, vh: H, body: `<path d="${d}" fill="none" stroke="${C.blue}" stroke-width="0.42"/>` };
}

// 希尔伯特曲线（原稿 alt 即「希尔伯特曲线」，此处按同构算法重绘）
export function hilbert() {
  const W = 85, H = 85;
  const order = 4, n = Math.pow(2, order);
  const pad = 3, side = W - pad * 2, step = side / (n - 1);
  const pts = [];
  (function walk(level, x, y, xi, xj, yi, yj) {
    if (level <= 0) { pts.push([x + (xi + yi) / 2, y + (xj + yj) / 2]); return; }
    walk(level - 1, x, y, yi / 2, yj / 2, xi / 2, xj / 2);
    walk(level - 1, x + xi / 2, y + xj / 2, xi / 2, xj / 2, yi / 2, yj / 2);
    walk(level - 1, x + xi / 2 + yi / 2, y + xj / 2 + yj / 2, xi / 2, xj / 2, yi / 2, yj / 2);
    walk(level - 1, x + xi / 2 + yi, y + xj / 2 + yj, -yi / 2, -yj / 2, -xi / 2, -xj / 2);
  })(order, 0, 0, n, 0, 0, n);
  // 归一化到 [0,1]，再映射到版面（y 翻转，使曲线正立）
  const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
  const mnx = Math.min(...xs), mxx = Math.max(...xs);
  const mny = Math.min(...ys), mxy = Math.max(...ys);
  const d = pts.map((p, i) => {
    const x = pad + (p[0] - mnx) / (mxx - mnx) * side;
    const y = pad + (1 - (p[1] - mny) / (mxy - mny)) * side;
    return `${i ? 'L' : 'M'}${r2(x)} ${r2(y)}`;
  }).join('');
  return { vw: W, vh: H, body: `<path d="${d}" fill="none" stroke="${C.blue}" stroke-width="0.5" stroke-linejoin="miter" stroke-linecap="square"/>` };
}

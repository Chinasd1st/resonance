// 2-8　傅里叶叠加：a(x)=Σ(1/n)sin((2n−1)πx)
import { C, T, line, curve, r2 } from './svg.mjs';

export function fig28() {
  const W = 415, H = 138.8;
  // plot 高度收到 110，底部留出一条干净的地带放 x 刻度：
  // 曲线在 x=±1 处正好过零，刻度若贴着 x 轴摆会被曲线穿过
  const px = 8, py = 10, pw = 399, ph = 110;
  const xmin = -1.62, xmax = 1.62, ymax = 1.85;
  const X = v => px + (v - xmin) / (xmax - xmin) * pw;
  const Y = v => py + (ymax - v) / (2 * ymax) * ph;

  const a = x => {
    let t = 0;
    for (let n = 1; n <= 4; n++) t += Math.sin((2 * n - 1) * Math.PI * x) / n;
    return t;
  };

  let s = '';
  for (let v = -1.5; v <= 1.5; v += 0.5) if (Math.abs(v) > 1e-9) s += line(X(v), py, X(v), py + ph, 0.25, C.grid);
  for (let v = -1.5; v <= 1.5; v += 0.5) if (Math.abs(v) > 1e-9) s += line(px, Y(v), px + pw, Y(v), 0.25, C.grid);

  s += line(px, Y(0), px + pw, Y(0), 0.55, C.k70);
  s += line(X(0), py, X(0), py + ph, 0.55, C.k70);

  for (const v of [-1.5, -1, -0.5, 0.5, 1, 1.5]) {
    s += line(X(v), py + ph, X(v), py + ph - 2.4, 0.55, C.k70);
    s += T(X(v), py + ph + 9.6, v === 0.5 ? '0.5' : v === -0.5 ? '\u22120.5' : v < 0 ? `\u2212${-v}` : String(v));
  }

  const pts = curve(xmin, xmax, a, 760).map(([x, y]) => [X(x), Y(y)]);
  s += `<path d="${pts.map((p, i) => `${i ? 'L' : 'M'}${r2(p[0])} ${r2(p[1])}`).join('')}"`
    + ` fill="none" stroke="${C.blue}" stroke-width="1.5" stroke-linejoin="round"/>`;

  s += T(X(0) + 6, py + 4, 'a(x)', { size: 6.4, anchor: 'start', fill: C.k70 });
  s += T(px + pw - 1, Y(0) + 15, 'x', { size: 6.4, anchor: 'end', fill: C.ink });
  return { vw: W, vh: H, body: s };
}

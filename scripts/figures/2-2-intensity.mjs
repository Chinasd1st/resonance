// 2-2　光强—感知折线（原稿数据点，原样保留）
import { C, F, T, line, r2 } from './svg.mjs';

export const P22 = [
  [0, 0.3317], [20, 0.3317], [30, 0.3430], [40, 0.3459], [50, 0.3443],
  [60, 0.3320], [70, 0.3334], [80, 0.3205], [90, 0.3317], [110, 0.3317],
];

export function fig22() {
  const W = 396, H = 282.5;
  const px = 36, py = 14, pw = 348, ph = 228;
  const x0 = 0, x1 = 112, y0 = 0.3195, y1 = 0.3475;
  const X = v => px + (v - x0) / (x1 - x0) * pw;
  const Y = v => py + (y1 - v) / (y1 - y0) * ph;

  const xt = [0, 20, 40, 60, 80, 100];
  const yt = [0.320, 0.325, 0.330, 0.335, 0.340, 0.345];

  let s = '';
  for (const v of xt) s += line(X(v), py, X(v), py + ph, 0.25, C.grid);
  for (const v of yt) s += line(px, Y(v), px + pw, Y(v), 0.25, C.grid);

  // 轴（只左、底）
  s += line(px, py, px, py + ph, 0.55, C.k70);
  s += line(px, py + ph, px + pw, py + ph, 0.55, C.k70);

  for (const v of xt) {
    s += line(X(v), py + ph, X(v), py + ph - 2.6, 0.55, C.k70);
    s += T(X(v), py + ph + 10, String(v));
  }
  for (const v of yt) {
    s += line(px, Y(v), px + 2.6, Y(v), 0.55, C.k70);
    s += T(px - 5, Y(v), v.toFixed(3), { anchor: 'end' });
  }

  // 折线 + 数据点（白心，像实测记号）
  const d = P22.map(([x, y], i) => `${i ? 'L' : 'M'}${r2(X(x))} ${r2(Y(y))}`).join('');
  s += `<path d="${d}" fill="none" stroke="${C.blue}" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round"/>`;
  for (const [x, y] of P22) {
    s += `<circle cx="${r2(X(x))}" cy="${r2(Y(y))}" r="1.75" fill="${C.paper}" stroke="${C.blue}" stroke-width="1"/>`;
  }

  s += T(px + pw + 4, py + ph + 10, 't', { size: 6.6, fill: C.ink });
  s += `<text x="9" y="${r2(py + ph / 2)}" font-family='${F}' font-size="6.6" fill="${C.ink}"`
    + ` text-anchor="middle" dominant-baseline="middle" transform="rotate(-90 9 ${r2(py + ph / 2)})">S</text>`;
  return { vw: W, vh: H, body: s };
}

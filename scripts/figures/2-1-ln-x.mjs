// 2-1　y = ln x 与 y = 1/x
// 原稿：Desmos 截图，红线 ln x、紫线 1/x，x∈[-4.8,8.8]、y∈[-4.6,5.0]，等比例。
// 重绘后配色改为全刊的蓝（主线）/ 橙（辅线），正文里的颜色描述同步改过（config/patches.mjs）。
import { C, T, line, curve, toPath } from './svg.mjs';

export function fig21() {
  const W = 285, H = 224.5;
  const xmin = -4.8, xmax = 8.8, ymin = -4.6, ymax = 5.0;
  const u = 250 / (xmax - xmin);
  const px = 28, py = (H - (ymax - ymin) * u) / 2;
  const X = v => px + (v - xmin) * u;
  const Y = v => py + (ymax - v) * u;

  let s = '';
  // 网格（1 单位），0 线留给坐标轴
  for (let v = -4; v <= 8; v++) if (v !== 0) s += line(X(v), Y(ymax - 0.35), X(v), Y(ymin + 0.35), 0.25, C.grid);
  for (let v = -4; v <= 4; v++) if (v !== 0) s += line(X(xmin + 0.35), Y(v), X(xmax - 0.35), Y(v), 0.25, C.grid);

  // 坐标轴
  s += line(X(xmin), Y(0), X(xmax), Y(0), 0.55, C.k70);
  s += line(X(0), Y(ymin), X(0), Y(ymax), 0.55, C.k70);

  // 刻度
  for (const v of [-4, -2, 2, 4, 6, 8]) {
    s += line(X(v), Y(0), X(v), Y(0) + 2.6, 0.55, C.k70);
    s += T(X(v), Y(0) + 9.2, v < 0 ? `\u2212${-v}` : String(v));
  }
  for (const v of [-4, -2, 2, 4]) {
    s += line(X(0), Y(v), X(0) - 2.6, Y(v), 0.55, C.k70);
    s += T(X(0) - 5, Y(v), v < 0 ? `\u2212${-v}` : String(v), { anchor: 'end' });
  }

  // 曲线：ln x（蓝，主线）、1/x（橙，辅线）
  const lnPts = curve(Math.exp(ymin + 0.06), xmax, Math.log, 260)
    .filter(([, y]) => y <= ymax + 0.1)
    .map(([x, y]) => [X(x), Y(y)]);
  const invPts = curve(1 / (ymax - 0.06), xmax, x => 1 / x, 200).map(([x, y]) => [X(x), Y(y)]);
  s += `<path d="${toPath(lnPts)}" fill="none" stroke="${C.blueDeep}" stroke-width="1.5" stroke-linejoin="round"/>`;
  s += `<path d="${toPath(invPts)}" fill="none" stroke="${C.orange}" stroke-width="1.35" stroke-linejoin="round"/>`;

  // 图例（右上，垫纸白以断开网格）
  s += `<rect x="192" y="22" width="90" height="30" fill="${C.paper}"/>`;
  s += line(196, 30, 208, 30, 1.5, C.blueDeep);
  s += T(212, 30, 'y = ln x', { anchor: 'start', fill: C.ink, size: 6.4 });
  s += line(196, 43, 208, 43, 1.35, C.orange);
  s += T(212, 43, 'y = 1 / x', { anchor: 'start', fill: C.ink, size: 6.4 });

  // 轴名
  s += T(X(xmax) - 2, Y(0) + 9.2, 'x', { size: 6.6, fill: C.ink });
  s += T(X(0) + 8, Y(ymax) + 2, 'y', { size: 6.6, fill: C.ink });
  return { vw: W, vh: H, body: s };
}

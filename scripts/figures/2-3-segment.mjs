// 2-3　线段二等分（原文：2 个 ½a）
import { C, T, line, r2 } from './svg.mjs';

export function fig23seg() {
  const W = 148, H = 39.7;
  let s = '';
  const xa = 4, xb = 96, mid = 50;
  // 上：整体 a
  s += line(xa, 9, xb, 9, 0.7, C.k70);
  s += line(xa, 5.5, xa, 12.5, 0.7, C.k70) + line(xb, 5.5, xb, 12.5, 0.7, C.k70);
  s += T(xb + 4, 9, 'a', { size: 6.6, anchor: 'start', fill: C.ink });
  // 下：二等分
  s += line(xa, 27, xb, 27, 0.7, C.k70);
  s += line(xa, 23.5, xa, 30.5, 0.7, C.k70) + line(xb, 23.5, xb, 30.5, 0.7, C.k70);
  s += line(mid, 23.5, mid, 30.5, 0.75, C.blueDeep);
  s += `<path d="M${xa} 31v2.6h${mid - xa}V31" fill="none" stroke="${C.k70}" stroke-width="0.5"/>`;
  s += T((xa + mid) / 2, 37.4, '½a', { size: 6.4, fill: C.ink });
  return { vw: W, vh: H, body: s };
}

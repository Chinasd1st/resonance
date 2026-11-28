// 2-3 图 1：谢尔宾斯基三角形（实心，照原稿），蓝框圈出顶部 1/2 子三角 ——
// 正文所谓「蓝色边框圈出的部分与整体相似」即指此
import { C, r2 } from './svg.mjs';

export function sierpMain() {
  const W = 133, H = 101;
  const top = 4, bot = 98, h = bot - top;
  const side = h / Math.sin(Math.PI / 3);
  const cx = W / 2;
  const A = [cx, top], B = [cx - side / 2, bot], Cp = [cx + side / 2, bot];
  const mid = (p, q) => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];

  let d = '';
  const walk = (a, b, c, n) => {
    if (n === 0) {
      const g = [(a[0] + b[0] + c[0]) / 3, (a[1] + b[1] + c[1]) / 3];
      const k = 0.93, sh = p => [g[0] + (p[0] - g[0]) * k, g[1] + (p[1] - g[1]) * k];
      const p = sh(a), q = sh(b), s = sh(c);
      d += `M${r2(p[0])} ${r2(p[1])}L${r2(q[0])} ${r2(q[1])}L${r2(s[0])} ${r2(s[1])}Z`;
      return;
    }
    const ab = mid(a, b), bc = mid(b, c), ca = mid(c, a);
    walk(a, ab, ca, n - 1); walk(ab, b, bc, n - 1); walk(ca, bc, c, n - 1);
  };
  // 5 层照原稿的密度；小三角内缩 7%（缝隙 0.29 pt ≈ 0.1 mm）——正好压在四色印刷
  // 能稳定还原的最细白线附近，再细就糊成网点
  walk(A, B, Cp, 5);

  // 顶部子三角（边长为整体一半、形状相同）的外接矩形
  const yMid = (top + bot) / 2;
  const x0 = cx - side / 4 - 2.5, x1 = cx + side / 4 + 2.5;
  let s = `<path d="${d}" fill="${C.blue}"/>`;
  s += `<rect x="${r2(x0)}" y="${r2(top - 2.5)}" width="${r2(x1 - x0)}" height="${r2(yMid + 2.5 - (top - 2.5))}"`
    + ` fill="none" stroke="${C.blueDeep}" stroke-width="0.75"/>`;
  return { vw: W, vh: H, body: s };
}

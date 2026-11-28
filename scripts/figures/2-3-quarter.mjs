// 2-3　正方形四等分（原文：4 个 ½a）
import { C, T, r2 } from './svg.mjs';

export function fig23square() {
  const W = 155, H = 100.7;
  // 内容高 58 + 3.5（括线）+ 12（标签），上下留白均分
  const top = (H - (58 + 3.5 + 12)) / 2;
  let s = '';
  // 左：边长 a 的正方形（灰，表示「整体」）
  s += `<rect x="6" y="${r2(top)}" width="58" height="58" fill="none" stroke="${C.k70}" stroke-width="0.7"/>`;
  // 右：2×2 等分为 4 个 ½a（蓝，表示「被分出的单元」）；白缝 2.4pt 作分隔
  const gap = 2.4, cell = (58 - gap) / 2;
  for (let j = 0; j < 2; j++) for (let i = 0; i < 2; i++) {
    s += `<rect x="${r2(91 + i * (cell + gap))}" y="${r2(top + j * (cell + gap))}" width="${r2(cell)}" height="${r2(cell)}"`
      + ` fill="none" stroke="${C.blueDeep}" stroke-width="0.6"/>`;
  }
  // 下方括线：左「整体 a」
  const yb = top + 58;
  s += `<path d="M6 ${r2(yb + 2.5)}v3.5h58v-3.5" fill="none" stroke="${C.k70}" stroke-width="0.45"/>`;
  s += T(35, yb + 13.4, 'a', { size: 6.8, fill: C.ink });
  // 右侧只标「单个小方格的边长 ½a」：原稿把 ½a 的括线横跨了四个格，
  // 但四格整体仍是 a，½a 指的是一个格 —— 括线必须只覆盖左上那一格
  const cellW = (58 - 2.4) / 2;
  s += `<path d="M91 ${r2(yb + 2.5)}v3.5h${r2(cellW)}v-3.5" fill="none" stroke="${C.blueDeep}" stroke-width="0.45"/>`;
  s += T(91 + cellW / 2, yb + 13.4, '½a', { size: 6.6, fill: C.ink });
  return { vw: W, vh: H, body: s };
}

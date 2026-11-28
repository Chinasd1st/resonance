// SVG 画布：viewBox 用户单位 = pt，与最终印刷尺寸 1:1，
// 所以 stroke-width 与 font-size 就是实际磅值，不需要换算。
// 颜色一律取这里，与 tokens.css 同值（CMYK 映射按 hex 匹配）。

export const C = {
  ink: '#1D1D1B',
  k70: '#56657F',
  k45: '#9AA6B8',
  k15: '#D9E2EE',
  blue: '#458CEE',
  blueDeep: '#2F6FD6',
  orange: '#ED7207',
  tint: '#E6F1FF',
  grid: '#C2DEF7',
  paper: '#FFFFFF',
};

export const F = '"SHS", sans-serif';
export const r2 = v => Math.round(v * 100) / 100;

export const T = (x, y, s, o = {}) => {
  const { size = 6.2, fill = C.k70, anchor = 'middle', base = 'middle', weight = 400 } = o;
  return `<text x="${r2(x)}" y="${r2(y)}" font-family='${F}' font-size="${size}" font-weight="${weight}"`
    + ` fill="${fill}" text-anchor="${anchor}" dominant-baseline="${base}"`
    + ` style="font-feature-settings:'tnum' 1,'pnum' 0">${s}</text>`;
};

export const line = (x1, y1, x2, y2, w, c, o = '') =>
  `<path d="M${r2(x1)} ${r2(y1)}L${r2(x2)} ${r2(y2)}" fill="none" stroke="${c}" stroke-width="${w}"${o}/>`;

/** 采样折线：避开断点与越界值 */
export function curve(x0, x1, f, n = 220) {
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const x = x0 + (x1 - x0) * i / n;
    const y = f(x);
    if (!Number.isFinite(y)) continue;
    pts.push([x, y]);
  }
  return pts;
}

/** 点列 → SVG path 的 d */
export const toPath = a => a.map((p, i) => `${i ? 'L' : 'M'}${r2(p[0])} ${r2(p[1])}`).join('');

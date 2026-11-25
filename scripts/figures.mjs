// 图表重绘：以矢量 SVG 取代原稿位图。
// 原则：函数的解析式、坐标范围、数据点一律照原稿，只重做线条、字号、色板与标注，
//      使其与 DESIGN-TOKENS v1.0（蓝／橙双色 + 蓝灰中性 + 15pt 基线）同一套视觉语言。
// 单位：viewBox 用户单位 = pt，与最终印刷尺寸 1:1，故 stroke-width 与 font-size 即实际磅值。

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

const F = '"SHS", sans-serif';
const r2 = v => Math.round(v * 100) / 100;

const T = (x, y, s, o = {}) => {
  const { size = 6.2, fill = C.k70, anchor = 'middle', base = 'middle', weight = 400 } = o;
  return `<text x="${r2(x)}" y="${r2(y)}" font-family='${F}' font-size="${size}" font-weight="${weight}"`
    + ` fill="${fill}" text-anchor="${anchor}" dominant-baseline="${base}"`
    + ` style="font-feature-settings:'tnum' 1,'pnum' 0">${s}</text>`;
};

const line = (x1, y1, x2, y2, w, c, o = '') =>
  `<path d="M${r2(x1)} ${r2(y1)}L${r2(x2)} ${r2(y2)}" fill="none" stroke="${c}" stroke-width="${w}"${o}/>`;

// 采样折线：避开断点与越界值
function curve(x0, x1, f, n = 220) {
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const x = x0 + (x1 - x0) * i / n;
    const y = f(x);
    if (!Number.isFinite(y)) continue;
    pts.push([x, y]);
  }
  return pts;
}

// ============ 2-1　y = ln x 与 y = 1/x ============
// 原稿：Desmos 截图，红线 ln x、紫线 1/x，x∈[-4.8,8.8]、y∈[-4.6,5.0]，等比例
function fig21() {
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
  const toPath = a => a.map((p, i) => `${i ? 'L' : 'M'}${r2(p[0])} ${r2(p[1])}`).join('');
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

// ============ 2-2　光强—感知折线（原稿数据点，原样保留）============
const P22 = [
  [0, 0.3317], [20, 0.3317], [30, 0.3430], [40, 0.3459], [50, 0.3443],
  [60, 0.3320], [70, 0.3334], [80, 0.3205], [90, 0.3317], [110, 0.3317],
];

function fig22() {
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

// ============ 2-3　正方形四等分 / 线段二等分（原文：4 个 ½a、2 个 ½a）============
function fig23square() {
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

function fig23seg() {
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

// 2-3 主图「图 1」：谢尔宾斯基三角形（实心，照原稿），蓝框圈出顶部 1/2 子三角 ——
// 正文所谓「蓝色边框圈出的部分与整体相似」即指此
function sierpMain() {
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

// ============ 2-3　四个分形（谢尔宾斯基 / 科赫 / 维切克 / 希尔伯特）============
function sierpinski() {
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

function koch() {
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

function vicsek() {
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
function hilbert() {
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

// ============ 2-8　傅里叶叠加：a(x)=Σ(1/n)sin((2n−1)πx) ============
function fig28() {
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

// 键与 build/media 下的相对路径一致
export const FIGURES = {
  '2-1/image1.jpeg': fig21,
  '2-2/image1.png': fig22,
  '2-3/image1.jpeg': sierpMain,
  '2-3/image2.png': fig23square,
  '2-3/image3.png': fig23seg,
  '2-3/image2.jpeg': sierpinski,
  '2-3/image3.jpeg': koch,
  '2-3/image4.jpeg': vicsek,
  '2-3/image5.jpeg': hilbert,
  '2-8/image2.png': fig28,
};

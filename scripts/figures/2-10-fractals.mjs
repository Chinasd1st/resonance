// 2-10 七幅分形图案矢量重绘：
// φ 雪花 / 六角雪花晶簇 / 枝晶雪花 / 珊瑚分形 / 水杉树分形 / φ 树叶分形 / 侧卷柏分形
// viewBox 单位 = pt，颜色取自 tokens.css 令牌（svg.mjs）。
import { C, r2 } from './svg.mjs';

const PHI = (1 + Math.sqrt(5)) / 2;

/** 将线段数组 [[x1,y1,x2,y2], ...] 等比居中映射进 vw × vh 画幅并拼成单个 <path> */
function packSegs(segs, W, H, pad, stroke, width) {
  let mnx = Infinity, mxx = -Infinity, mny = Infinity, mxy = -Infinity;
  for (const [x1, y1, x2, y2] of segs) {
    if (x1 < mnx) mnx = x1; if (x1 > mxx) mxx = x1;
    if (x2 < mnx) mnx = x2; if (x2 > mxx) mxx = x2;
    if (y1 < mny) mny = y1; if (y1 > mxy) mxy = y1;
    if (y2 < mny) mny = y2; if (y2 > mxy) mxy = y2;
  }
  const s = Math.min((W - 2 * pad) / Math.max(mxx - mnx, 1e-6), (H - 2 * pad) / Math.max(mxy - mny, 1e-6));
  const ox = (W - (mxx - mnx) * s) / 2 - mnx * s;
  const oy = (H - (mxy - mny) * s) / 2 - mny * s;
  const r1 = v => Math.round(v * 10) / 10;
  let d = '';
  for (const [x1, y1, x2, y2] of segs) {
    d += `M${r1(x1 * s + ox)} ${r1(y1 * s + oy)}L${r1(x2 * s + ox)} ${r1(y2 * s + oy)}`;
  }
  return {
    vw: W, vh: H,
    body: `<path d="${d}" fill="none" stroke="${stroke}" stroke-width="${width}" stroke-linecap="round"/>`,
  };
}

/** 1. image12.jpeg：正六边形——φ 雪花（6 长尖芒 + 中心 φ 蕾丝环） */
export function phiSnowflake() {
  const segs = [];
  const rad = d => d * Math.PI / 180;
  for (let k = 0; k < 6; k++) {
    const a1 = rad(-90 + k * 60), a2 = rad(-90 + ((k + 1) % 6) * 60);
    for (const r of [0.06, 0.14]) segs.push([r * Math.cos(a1), r * Math.sin(a1), r * Math.cos(a2), r * Math.sin(a2)]);
  }
  const arm = (x, y, ang, len, depth) => {
    if (depth <= 0 || len < 0.014) return;
    const x2 = x + len * Math.cos(ang), y2 = y + len * Math.sin(ang);
    segs.push([x, y, x2, y2]);
    // 越靠近中心分支越舒展、外半段沿 1/φ 急剧收束，突出六道尖锐星芒
    const nodes = depth >= 4
      ? [[0.20, 0.30], [0.34, 0.38], [0.50, 0.26], [0.66, 0.16], [0.80, 0.10], [0.90, 0.06]]
      : [[0.32, 0.42], [0.60, 0.30], [0.82, 0.16]];
    for (const [t, k] of nodes) {
      const nx = x + (x2 - x) * t, ny = y + (y2 - y) * t;
      arm(nx, ny, ang + rad(60), len * k, depth - 1);
      arm(nx, ny, ang - rad(60), len * k, depth - 1);
    }
  };
  for (let k = 0; k < 6; k++) arm(0, 0, rad(-90 + k * 60), 1.0, 4);
  return packSegs(segs, 150, 168, 3, C.blue, 0.32);
}

/** 2. image13.jpeg：雪花分形.(2,108) —— 六角雪花晶簇（Hexaflake, 1/3 自相似） */
export function hexSnowflake() {
  const W = 156, H = 162;
  const R = 76, cx = W / 2, cy = H / 2;
  const polys = [];
  const walk = (x, y, r, depth) => {
    if (depth === 0) {
      polys.push([x, y, r]);
      return;
    }
    const r3 = r / 3;
    walk(x, y, r3, depth - 1);
    for (let k = 0; k < 6; k++) {
      const a = (-90 + k * 60) * Math.PI / 180;
      walk(x + 2 * r3 * Math.cos(a), y + 2 * r3 * Math.sin(a), r3, depth - 1);
    }
  };
  walk(cx, cy, R, 4);
  const r1 = v => Math.round(v * 10) / 10;
  let d = '';
  for (const [px, py, pr] of polys) {
    for (let k = 0; k < 6; k++) {
      const a = (-90 + k * 60) * Math.PI / 180;
      const vx = r1(px + pr * 0.92 * Math.cos(a)), vy = r1(py + pr * 0.92 * Math.sin(a));
      d += (k ? 'L' : 'M') + `${vx} ${vy}`;
    }
    d += 'Z';
  }
  return { vw: W, vh: H, body: `<path d="${d}" fill="${C.blue}" stroke="${C.blue}" stroke-width="0.22"/>` };
}

/** 3. image14.png：雪花分形.(1+pt·φ+1÷φ,192) —— 轻盈六臂松针枝晶雪花 */
export function dendriteSnowflake() {
  const segs = [];
  const rad = d => d * Math.PI / 180;
  const walk = (x, y, ang, len, depth) => {
    if (depth <= 0 || len < 0.014) return;
    const x2 = x + len * Math.cos(ang), y2 = y + len * Math.sin(ang);
    segs.push([x, y, x2, y2]);
    const subs = depth >= 4
      ? [[0.22, 0.22], [0.40, 0.34], [0.58, 0.28], [0.74, 0.18], [0.88, 0.10]]
      : [[0.34, 0.40], [0.64, 0.30], [0.86, 0.16]];
    for (const [t, k] of subs) {
      const nx = x + (x2 - x) * t, ny = y + (y2 - y) * t;
      walk(nx, ny, ang + rad(56), len * k, depth - 1);
      walk(nx, ny, ang - rad(56), len * k, depth - 1);
    }
  };
  for (let k = 0; k < 6; k++) walk(0, 0, rad(-90 + k * 60), 1.0, 4);
  return packSegs(segs, 150, 172, 3, C.blue, 0.30);
}

/** 4. image24.png：珊瑚分形.(0,54) —— 非对称黄金螺线卷曲二叉树 */
export function coralFractal() {
  const segs = [];
  const rad = d => d * Math.PI / 180;
  const walk = (x, y, ang, len, depth) => {
    if (depth <= 0 || len < 0.010) return;
    const x2 = x + len * Math.cos(ang), y2 = y + len * Math.sin(ang);
    segs.push([x, y, x2, y2]);
    walk(x2, y2, ang - rad(36), len * 0.62, depth - 1);
    walk(x2, y2, ang + rad(16), len * 0.85, depth - 1);
  };
  segs.push([0, 0, -0.24, -0.68]);
  segs.push([0, 0, 0.56, -0.54]);
  walk(-0.24, -0.68, rad(-112), 0.64, 11);
  walk(0.56, -0.54, rad(-66), 0.94, 12);
  return packSegs(segs, 190, 146, 3, C.orange, 0.28);
}

/** 5. image25.png：水杉树分形 —— 笔直中轴与对称羽状尖塔轮廓 */
export function metasequoiaFractal() {
  const segs = [];
  const rad = d => d * Math.PI / 180;
  const frond = (x, y, ang, len, depth) => {
    if (depth <= 0 || len < 0.014) return;
    const x2 = x + len * Math.cos(ang), y2 = y + len * Math.sin(ang);
    segs.push([x, y, x2, y2]);
    const n = depth >= 2 ? 7 : 4;
    for (let i = 1; i < n; i++) {
      const t = i / n;
      const nx = x + (x2 - x) * t, ny = y + (y2 - y) * t;
      const subLen = len * (1 - t * 0.82) * 0.44;
      frond(nx, ny, ang - rad(38), subLen, depth - 1);
      frond(nx, ny, ang + rad(38), subLen, depth - 1);
    }
  };
  // 底部树干 + 向上收尖的 22 对对称羽枝
  segs.push([0, 1.0, 0, -1.0]);
  const baseY = 0.74, topY = -0.96;
  const pairs = 22;
  for (let i = 0; i < pairs; i++) {
    const t = i / (pairs - 1);
    const y = baseY + (topY - baseY) * t;
    // 下宽上尖的自然水杉包络线
    const span = (0.46 * Math.sin(Math.pow(1 - t, 0.78) * Math.PI * 0.55) + 0.04) * (1 - t * 0.75);
    const angUp = rad(44 + t * 14);
    frond(0, y, -Math.PI / 2 - angUp, span, 3);
    frond(0, y, -Math.PI / 2 + angUp, span, 3);
  }
  return packSegs(segs, 112, 210, 3, C.ink, 0.32);
}

/** 6. image26.jpeg：Φ——树叶分形（沿中轴按 1/φ 逐级退缩的密簇羽叶） */
export function phiLeafFractal() {
  const segs = [];
  const rad = d => d * Math.PI / 180;
  const lobe = (x, y, ang, len, depth) => {
    if (depth <= 0 || len < 0.016) return;
    const x2 = x + len * Math.cos(ang), y2 = y + len * Math.sin(ang);
    segs.push([x, y, x2, y2]);
    lobe(x2, y2, ang, len * (1 / PHI), depth - 1);
    for (const [t, k, a] of [[0.32, 0.44, 52], [0.64, 0.54, 48]]) {
      const px = x + (x2 - x) * t, py = y + (y2 - y) * t;
      lobe(px, py, ang + rad(a), len * k, depth - 1);
      lobe(px, py, ang - rad(a), len * k, depth - 1);
    }
  };
  lobe(0, 1.0, -Math.PI / 2, 0.86, 6);
  // 底部三叠小叶芽沿中轴向下收敛
  lobe(0, 1.30, -Math.PI / 2, 0.36, 5);
  lobe(0, 1.48, -Math.PI / 2, 0.16, 4);
  return packSegs(segs, 120, 204, 3, C.orange, 0.28);
}

/** 7. image27.jpeg：侧卷柏分形 —— 非对称蕨叶主轴与交错茂密羽枝 */
export function selaginellaFractal() {
  const segs = [];
  const rad = d => d * Math.PI / 180;
  const walk = (x, y, ang, len, depth, side) => {
    if (depth <= 0 || len < 0.008) return;
    const x2 = x + len * Math.cos(ang), y2 = y + len * Math.sin(ang);
    segs.push([x, y, x2, y2]);
    walk(x2, y2, ang + rad(side * 1.8), len * 0.80, depth - 1, -side);
    const p1x = x + (x2 - x) * 0.32, p1y = y + (y2 - y) * 0.32;
    const p2x = x + (x2 - x) * 0.68, p2y = y + (y2 - y) * 0.68;
    walk(p1x, p1y, ang - rad(54), len * (side > 0 ? 0.62 : 0.36), depth - 2, -side);
    walk(p2x, p2y, ang + rad(50), len * (side < 0 ? 0.50 : 0.34), depth - 2, side);
    if (depth >= 5) {
      walk(p1x, p1y, ang + rad(44), len * 0.28, depth - 3, side);
      walk(p2x, p2y, ang - rad(46), len * 0.28, depth - 3, -side);
    }
  };
  walk(0, 1.0, rad(-91), 0.58, 11, 1);
  return packSegs(segs, 118, 204, 3, C.chem, 0.28);
}

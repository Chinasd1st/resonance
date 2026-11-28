// 篇目跨页的底图与矢量装饰（DESIGN-TOKENS §7.8）。
// artSheets 只产出「哪一页放什么」的 HTML 片段 + 待渲染的位图 spec；
// renderArt 把 spec 交给 scripts/art/*.py 出 JPEG（300 dpi，不透明，文字留给矢量层）。
// 满版的底色/照片在 merge.py 里垫到正文**下面**（build/under.json 列的那些页）。
import fs from 'node:fs';
import { B, at } from '../lib/path.mjs';
import { runPy } from '../lib/run.mjs';
import { ART, ART_PHOTO, RGB, NIGHT_BEAM } from '../config/photos.mjs';

/**
 * @param {object} map  pagemap（dests 是「锚点 → 真实页序」）
 * @param {object} pos  只能在排版后量到的位置（如 pos.fog = [页, 行顶距页面上缘 pt]）
 * @returns {{out: Record<number,{html,dark?,noRh?,swiss?}>, specs: [string, object][]}}
 */
export function artSheets(map, pos) {
  const out = {};
  const specs = [];
  const pagesOf = id => {
    const p0 = map.dests[`a-${id}`];
    const nexts = Object.values(map.dests).filter(p => p > p0);
    const p1 = (nexts.length ? Math.min(...nexts) : map.pages + 1) - 1;
    return Array.from({ length: p1 - p0 + 1 }, (_, i) => p0 + i);
  };
  const img = (name, spec) => { specs.push([name, spec]); return name; };
  const imgTag = (name, r) => `<img class="artimg" src="art/${name}.jpg" style="left:${r[0]}mm;top:${r[1]}mm;width:${r[2]}mm;height:${r[3]}mm" alt="">`;
  const full = [0, 0, 216, 303];
  for (const id of Object.keys(ART)) {
    if (!map.dests[`a-${id}`]) continue;
    const pages = pagesOf(id);
    const photo = ART_PHOTO[id] ? at(ART_PHOTO[id].src) : null;
    if (id === '1-1') {
      const [p0, ...rest] = pages;
      // 墨 + 车灯黄双色网：暖色版取「warm」通道（车灯），暗版做骨架
      const n = img('1-1-photo', { seed: 21, photos: [{ photo, focus: [0.6, 0.5], rect: full, mode: 'inks', exposure: 1.5, contrast: 1.2, lpi: 38, absorb: 0.3, density: 1,
        inks: [{ rgb: RGB.news, src: 'warm', gain: 1.6, angle: 15, shift: [2, -1] }, { rgb: RGB.ink, src: 'dark', gain: 1.08, gamma: 0.75, angle: 45 }] }] });
      const beam = off => `<svg class="beam" viewBox="${off} 0 216 303"><line x1="${NIGHT_BEAM[0][0]}" y1="${NIGHT_BEAM[0][1]}" x2="${NIGHT_BEAM[1][0]}" y2="${NIGHT_BEAM[1][1]}"/></svg>`;
      out[p0] = { html: imgTag(n, full) + beam(0), dark: true };
      rest.forEach((p, i) => { out[p] = { html: `<div class="night"></div>` + (i === 0 ? beam(210) : ''), dark: true, noRh: i === 0 }; });
    }
    if (id === '1-2') {
      // 照片收到 154 mm：正文首行在 164 mm，图源行(159–161 mm)必须整行落在照片下沿之外，
      // 否则蓝底网点会穿过这一行字（原来 166 mm 时正好压在图边）
      const r = [0, 0, 216, 154];
      const n = img('1-2-photo', { seed: 22, paper: RGB.tint, texture: false, out_rect: r, photos: [{ photo, focus: [0.5, 0.42], rect: r, mode: 'inks', contrast: 1.35, lift: 0.02, lpi: 42,
        inks: [{ rgb: RGB.blue, src: 'dark', gain: 1.0, gamma: 1.15, angle: 45 }] }] });
      // 雾蓝底色：从开篇一直铺到反转那一行之前（pos.fog = [页, 该行字顶距页面上缘 pt]），之后回到白纸
      const [fp, fy] = pos.fog || [pages[pages.length - 1] + 1, 0];
      for (const p of pages) {
        let fog = '';
        if (p < fp) fog = `<div class="fog" style="height:303mm"></div>`;
        else if (p === fp) fog = `<div class="fog" style="height:calc(${fy}pt - 11pt)"></div>`;
        out[p] = { html: fog + (p === pages[0] ? imgTag(n, r) : '') };
      }
    }
    if (id === '1-3') {
      const [p0, ...rest] = pages;
      // 墨 + 灯火橙双色网；上端网点渐稀化进纸色成雾；水面叠一层细网
      const n = img('1-3-photo', { seed: 23, photos: [{ photo, focus: [0.5, 0.6], rect: full, mode: 'inks', exposure: 1.15, contrast: 1.15, lpi: 40, fade: [45, 165], absorb: 0.6,
        inks: [{ rgb: RGB.orange, src: 'warm', gain: 1.2, gamma: 1.7, angle: 15, shift: [2, -2] }, { rgb: RGB.ink, src: 'dark', gain: 1.0, gamma: 0.8, angle: 45 }] }],
        net: { rect: [0, 205, 216, 98], pitch: 4.2, rgb: [238, 233, 222], fade: [210, 290], width: 0.09, strength: 0.6 } });
      out[p0] = { html: imgTag(n, full), dark: true };
      // 正文页：同一张暖白纸（只有纸纹，150 dpi 足够）
      rest.forEach((p, i) => { out[p] = { html: imgTag(img(`1-3-paper-${i + 1}`, { seed: 30 + i, dpi: 150, quality: 82 }), full) }; });
    }
    if (id === '1-4') {
      const [p0, ...rest] = pages;
      // p14：暖白纸底 + 右上开篇区双色错位裂圆半调（橙 + 墨，下方双栏正文区保持干净）
      const n0 = img('1-4-p1', {
        kind: 'halftone', paper: RGB.paperWarm, seed: 41, dpi: 300,
        plates: [
          { rgb: RGB.orange, angle: 15, lpi: 40, shift: [2, -2], absorb: 0.7, density: 0.9,
            shapes: [
              { kind: 'radial', cx: 164, cy: 68, r0: 22, r1: 44, peak: 0.92, half_plane: [0.55, 0.84, 138, 4] },
              { kind: 'radial', cx: 170, cy: 58, r0: 8, r1: 20, peak: 0.65, op: 'mul_inv' },
              { kind: 'band', x0: 120, y0: 108, x1: 216, y1: 120, fade_t: 10, peak: 1.0, op: 'mul_inv' },
            ] },
          { rgb: RGB.ink, angle: 45, lpi: 40, shift: [0, 0], absorb: 0.7, density: 0.92,
            shapes: [
              { kind: 'radial', cx: 156, cy: 64, r0: 18, r1: 40, peak: 0.82, half_plane: [-0.55, -0.84, -149, 4] },
              { kind: 'band', x0: 120, y0: 108, x1: 216, y1: 120, fade_t: 10, peak: 1.0, op: 'mul_inv' },
            ] },
        ],
      });
      out[p0] = { html: imgTag(n0, full) };
      rest.forEach((p, i) => {
        const n = img(`1-4-p${i + 2}`, {
          kind: 'halftone', paper: RGB.paperWarm, seed: 42 + i, dpi: 150, quality: 84,
          plates: [
            { rgb: RGB.orange, angle: 15, lpi: 40, shift: [2, -1], absorb: 0.7, density: 0.85,
              shapes: [{ kind: 'radial', cx: 204, cy: 252, r0: 4, r1: 28, peak: 0.82 }] },
            { rgb: RGB.ink, angle: 45, lpi: 40, shift: [0, 0], absorb: 0.7, density: 0.88,
              shapes: [{ kind: 'radial', cx: 196, cy: 256, r0: 3, r1: 20, peak: 0.58 }] },
          ],
        });
        out[p] = { html: imgTag(n, full) };
      });
    }
    if (id === '1-5') {
      const [p0, ...rest] = pages;
      const railL = `<svg class="shaft-rail" viewBox="0 0 216 303"><line x1="11" y1="110" x2="11" y2="294"/><circle cx="11" cy="110" r="1.1"/>${[118, 154, 190, 226, 262].map(y => `<line x1="9" y1="${y}" x2="15" y2="${y}"/>`).join('')}</svg>`;
      const railR = `<svg class="shaft-rail" viewBox="0 0 216 303"><line x1="204" y1="26" x2="204" y2="274"/><circle cx="204" cy="274" r="1.2"/>${[64, 134, 204].map(y => `<line x1="200" y1="${y}" x2="206" y2="${y}"/>`).join('')}</svg>`;
      const n0 = img('1-5-p1', {
        kind: 'halftone', paper: RGB.tint, seed: 51, dpi: 300,
        plates: [
          { rgb: RGB.blue, angle: 15, lpi: 40, shift: [1, -1], absorb: 0.7, density: 0.9,
            shapes: [
              { kind: 'band', x0: 126, y0: 28, x1: 216, y1: 108, fade_l: 36, fade_t: 14, fade_b: 24, peak: 0.85 },
              { kind: 'band', x0: 0, y0: 112, x1: 36, y1: 303, fade_r: 20, fade_t: 18, peak: 0.65 },
            ] },
          { rgb: RGB.ink, angle: 45, lpi: 40, shift: [0, 0], absorb: 0.7, density: 0.92,
            shapes: [
              { kind: 'band', x0: 148, y0: 34, x1: 216, y1: 88, fade_l: 28, fade_t: 14, fade_b: 20, peak: 0.76 },
              { kind: 'band', x0: 0, y0: 140, x1: 24, y1: 303, fade_r: 14, fade_t: 22, peak: 0.52 },
            ] },
          { rgb: RGB.chem, angle: 75, lpi: 42, shift: [2, 1], absorb: 0.65, density: 0.85,
            shapes: [{ kind: 'radial', cx: 190, cy: 58, r0: 6, r1: 22, peak: 0.75 }] },
        ],
      });
      out[p0] = { html: imgTag(n0, full) + railL };
      rest.forEach((p, i) => {
        const n = img(`1-5-p${i + 2}`, {
          kind: 'halftone', paper: RGB.tint, seed: 52 + i, dpi: 200, quality: 85,
          plates: [
            { rgb: RGB.blue, angle: 15, lpi: 40, shift: [1, -1], absorb: 0.7, density: 0.88,
              shapes: [{ kind: 'band', x0: 176, y0: 0, x1: 216, y1: 303, fade_l: 22, peak: 0.72 }] },
            { rgb: RGB.ink, angle: 45, lpi: 40, shift: [0, 0], absorb: 0.7, density: 0.92,
              shapes: [{ kind: 'band', x0: 192, y0: 90, x1: 216, y1: 303, fade_l: 14, fade_t: 120, peak: 0.85 }] },
          ],
        });
        out[p] = { html: imgTag(n, full) + railR };
      });
    }
    if (id === '1-7') {
      const [p0] = pages;
      const n0 = img('1-7-p1', {
        kind: 'halftone', paper: RGB.paperWarm, seed: 71, dpi: 300,
        plates: [
          { rgb: RGB.news, angle: 15, lpi: 38, shift: [2, -1], absorb: 0.7, density: 0.9,
            shapes: [{ kind: 'radial', cx: 168, cy: 56, r0: 14, r1: 36, peak: 0.85 }] },
          { rgb: RGB.blueDeep, angle: 45, lpi: 42, shift: [0, 0], absorb: 0.7, density: 0.88,
            shapes: [
              { kind: 'slats', x0: 116, y0: 26, x1: 216, y1: 106, angle: -24, pitch: 11, duty: 0.34, fade_l: 36, fade_t: 14, fade_b: 24, peak: 0.42 },
              { kind: 'radial', cx: 168, cy: 56, r0: 32, r1: 50, peak: 0.36, op: 'add' },
              { kind: 'radial', cx: 168, cy: 56, r0: 20, r1: 32, peak: 0.85, op: 'mul_inv' },
            ] },
        ],
      });
      out[p0] = { html: imgTag(n0, full) };
    }
    if (id === '1-8') {
      const [p0, ...rest] = pages;
      const n0 = img('1-8-p1', {
        kind: 'halftone', paper: RGB.paperWarm, seed: 81, dpi: 300,
        plates: [
          { rgb: RGB.orange, angle: 15, lpi: 40, shift: [2, -1], absorb: 0.7, density: 0.9,
            shapes: [{ kind: 'radial', cx: 174, cy: 70, r0: 12, r1: 42, peak: 0.9, half_plane: [0, -1, -84, 5] }] },
          { rgb: RGB.ink, angle: 45, lpi: 40, shift: [0, 0], absorb: 0.7, density: 0.92,
            shapes: [{ kind: 'ridge', pts: [[112, 88], [138, 78], [162, 83], [186, 68], [216, 75]],
              feather_top: 2.5, fade_bottom: [88, 96], x0: 112, fade_l: 20, peak: 0.86 }] },
        ],
      });
      out[p0] = { html: imgTag(n0, full) };
      rest.forEach((p, i) => {
        const n = img(`1-8-p${i + 2}`, {
          kind: 'halftone', paper: RGB.ink, tex_strength: 0.4, seed: 82 + i, dpi: 300,
          plates: [
            { rgb: RGB.blue, angle: 15, lpi: 40, shift: [2, -1], absorb: 0.5, density: 0.92, blend: 'over',
              shapes: [{ kind: 'radial', cx: 162, cy: 215, r0: 18, r1: 68, peak: 0.58 }] },
            { rgb: RGB.tint, angle: 45, lpi: 42, shift: [0, 0], absorb: 0.4, density: 0.96, blend: 'over',
              shapes: [{ kind: 'radial', cx: 162, cy: 215, r0: 12, r1: 30, peak: 0.92 }] },
          ],
        });
        out[p] = { html: imgTag(n, full), dark: true };
      });
    }
    if (id === '1-6') {
      const [p0, ...rest] = pages;
      // 满版：全页 216 × 303 mm 统一渲染银盐黑底与 35mm 颗粒，花卉羽化嵌入下三分之二，
      // 消除图片与纯色背景之间的颗粒/明暗接缝；文字栅格在正文层贴齐版心
      const n = img('1-6-photo', {
        kind: 'swiss-photo', photo,
        out_w_mm: 216, out_h_mm: 303,
        fit: 'place_dark', place_y_mm: 112, place_h_mm: 136, feather_mm: 14,
        dpi: 300, lum_weights: [0.58, 0.34, 0.08],
        shadow_crush: 0.05, contrast: 1.52, gamma: 0.76,
        black_floor: 0.098, white_ceil: 0.95, vignette: 0.16, grain: 0.032, seed: 16,
      });
      out[p0] = { html: imgTag(n, full), swiss: true };
      rest.forEach(p => { out[p] = { html: `<div class="swiss-bg"></div>`, noRh: true, swiss: true }; });
    }
  }
  return { out, specs };
}

const SCRIPT_OF = { 'swiss-photo': 'art/swiss-photo.py', orb: 'art/orb-art.py', halftone: 'art/halftone-art.py' };

export function renderArt(specs) {
  fs.mkdirSync(B('art'), { recursive: true });
  for (const [name, spec] of specs) {
    fs.writeFileSync(B(`art/${name}.json`), JSON.stringify(spec));
    runPy(SCRIPT_OF[spec.kind] || 'art/chapter-art.py', B(`art/${name}.json`), B(`art/${name}.jpg`));
  }
}

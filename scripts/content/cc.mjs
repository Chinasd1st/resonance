// CC 授权标识：assets/cc/*.svg（Creative Commons 官方 presskit 图标），构建时内联进 HTML。
//
// 为什么不写 <img src="assets/cc/by.svg">：
//   1. 全书走 file:// 打印，外链 SVG 在打印管线里偶发丢图（<img> 的 SVG 解码是异步的）；
//   2. 内联后填色由 CSS 决定，图标能跟着 --c-blue 走，不必为每种颜色存一份文件。
// 图标自带圆形轮廓与字母字形，所以白色纸面上直接上蓝色即可，
// 不要再垫一层圆底，否则会出现「圆套圆」。
//
// viewBox 各文件不同（cc/by/nc/sa 是 64 格，zero 偏半格，pd 是 384 格），
// 所以按文件读，不要写死——写死会把 pd 放大 6 倍、切掉一半。
import fs from 'node:fs';
import { at } from '../lib/path.mjs';

const LABEL = { cc: 'CC', by: 'BY', nc: 'NC', sa: 'SA', zero: 'CC0', pd: 'PUBLIC DOMAIN' };

/** 许可串 → 图标顺序 + 版本号。许可串同时是 photos.mjs 里的数据契约 */
const LIC = {
  'by-sa-4.0': { marks: ['cc', 'by', 'sa'], ver: '4.0' },
  'by-2.0': { marks: ['cc', 'by'], ver: '2.0' },
  'cc0': { marks: ['cc', 'zero'], ver: '1.0' },
  'pd': { marks: ['pd'], ver: '' },
};

const cache = new Map();

/** 取 svg 的 viewBox 与内部内容（去掉 XML 声明，内联只认 <svg> 里的东西） */
function glyph(name) {
  if (!cache.has(name)) {
    const raw = fs.readFileSync(at('assets', 'cc', `${name}.svg`), 'utf8');
    const m = raw.match(/<svg([^>]*)>([\s\S]*?)<\/svg>/);
    if (!m) throw new Error(`assets/cc/${name}.svg 里找不到 <svg>`);
    const vb = (m[1].match(/viewBox="([^"]*)"/) || [])[1];
    if (!vb) throw new Error(`assets/cc/${name}.svg 缺 viewBox`);
    cache.set(name, { vb, inner: m[2].replace(/<\?xml[\s\S]*?\?>/g, '').trim() });
  }
  return cache.get(name);
}

/** 一行标识，默认 CC BY-NC-SA；names 顺序即显示顺序 */
export function ccMarks(names = ['cc', 'by', 'nc', 'sa'], cls = 'ccm') {
  return names.map(n => {
    const g = glyph(n);
    return `<span class="${cls}" role="img" aria-label="${LABEL[n]}" title="${LABEL[n]}">` +
      `<svg viewBox="${g.vb}" xmlns="http://www.w3.org/2000/svg">${g.inner}</svg></span>`;
  }).join('');
}

/** 图片来源行里的许可：小图标 + 版本号（4.0 / 2.0 / 1.0）。版本号是许可名的一部分，不能省 */
export function ccLine(lic) {
  const d = LIC[lic];
  if (!d) throw new Error(`未知许可 "${lic}"，见 cc.mjs 的 LIC 表`);
  return `<span class="cc-lic">${ccMarks(d.marks, 'ccm sm')}${d.ver ? `<i>${d.ver}</i>` : ''}</span>`;
}

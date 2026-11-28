// CC 授权标识：assets/cc/*.svg（Creative Commons 官方 presskit 图标），构建时内联进 HTML。
//
// 为什么不写 <img src="assets/cc/by.svg">：
//   1. 全书走 file:// 打印，外链 SVG 在打印管线里偶发丢图（<img> 的 SVG 解码是异步的）；
//   2. 内联后填色由 CSS 决定，图标能跟着 --c-blue 走，不必为每种颜色存一份文件。
// 图标自带圆形轮廓与字母字形（共 4 条 path 变体），所以白色纸面上直接上蓝色即可，
// 不要再垫一层圆底，否则会出现「圆套圆」。
import fs from 'node:fs';
import { at } from '../lib/path.mjs';

const LABEL = { cc: 'CC', by: 'BY', nc: 'NC', sa: 'SA' };
const VIEWBOX = '5.5 -3.5 64 64';   // 四个文件一致；换来源时需重新核对
const cache = new Map();

/** 取 svg 的内部内容（去掉 XML 声明与 doctype，内联只认 <svg> 里的东西） */
function glyph(name) {
  if (!cache.has(name)) {
    const raw = fs.readFileSync(at('assets', 'cc', `${name}.svg`), 'utf8');
    const m = raw.match(/<svg[^>]*>([\s\S]*?)<\/svg>/);
    if (!m) throw new Error(`assets/cc/${name}.svg 里找不到 <svg>`);
    cache.set(name, m[1].replace(/<\?xml[\s\S]*?\?>/g, '').trim());
  }
  return cache.get(name);
}

/** 一行标识，默认 CC BY-NC-SA；names 顺序即显示顺序 */
export function ccMarks(names = ['cc', 'by', 'nc', 'sa']) {
  return names.map(n =>
    `<span class="ccm" role="img" aria-label="${LABEL[n]}" title="${LABEL[n]}">` +
    `<svg viewBox="${VIEWBOX}" xmlns="http://www.w3.org/2000/svg">${glyph(n)}</svg></span>`
  ).join('');
}

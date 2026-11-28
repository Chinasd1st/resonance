// 2-3《分形》里的生僻字处理，独立成模块：
// 原稿把字形截成五张百度百科的图，这里换成真实字形（矢量、可检索），排法与全书一致——
// 字在下、带调拼音在上（ruby）；字格下方另起一行标 Unicode 码位，便于检索或录入。
//
// 改字表、改码位写法、改排法都只动这个文件，不必碰 build.mjs 的装配流程。

/** 字表：图片文件名 → 字形 / 带调拼音。码位由字形直接算，不手写，避免抄错 */
export const GLYPHS = [
  { file: 'image6.jpeg', ch: '𰻝', py: 'biáng' },
  { file: 'image7.jpeg', ch: '龘', py: 'dá' },
  { file: 'image8.jpeg', ch: '𪚥', py: 'léi' },
  { file: 'image9.jpeg', ch: '靐', py: 'bìng' },
  { file: 'image10.jpeg', ch: '𱁬', py: 'tái' },
];

/** 正文里本来写成「（qiang）」的注音，一并改成 ruby；音节照原稿，只补声调 */
const PRON = [
  ['<p>羻（qiang）</p>', '<p><ruby>羻<rt>qiāng</rt></ruby></p>'],
  ['<p>鱜（xiang）</p>', '<p><ruby>鱜<rt>xiāng</rt></ruby></p>'],
  ['<p>鱺（li）</p>', '<p><ruby>鱺<rt>lí</rt></ruby></p>'],
];

/** U+9F98 这种写法：至少四位；扩展 B 之后的五位、六位照实给 */
export const codePoint = ch => 'U+' + ch.codePointAt(0).toString(16).toUpperCase().padStart(4, '0');

/** 一个字格：拼音在上、字形居中、码位在下 */
function cell(g) {
  return `<p class="glyph-cell"><ruby><span class="rare">${g.ch}</span><rt>${g.py}</rt></ruby>`
    + `<span class="glyph-note">（${codePoint(g.ch)}）</span></p>`;
}

/**
 * 把 2-3 片段里的生僻字图换成字形 + ruby + 码位。
 * 原段落形如 `<p><img …/>biangbiang面的biang</p>`，图片后那串「XX的XX」是给读者认字用的
 * 口语说明，整段替换时一并去掉，不再出现在版面上。
 */
export function applyRareGlyphs(html) {
  let out = html;
  for (const [find, rep] of PRON) out = out.split(find).join(rep);
  for (const g of GLYPHS) {
    const esc = g.file.replace(/\./g, '\\.');
    const re = new RegExp(`<p>\\s*<img[^>]*media/${esc}[^>]*>[\\s\\S]*?</p>`);
    out = out.replace(re, () => cell(g));
  }
  return out;
}

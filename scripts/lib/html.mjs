// HTML 拼装的小工具：转义、补零、按清单注入样式与脚本。
import path from 'node:path';

export const esc = s => (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;')
  .replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export const pad = n => String(n).padStart(2, '0');

/** 破折号接合（静态文本用，overlay 层没有运行时排版，拿不到 text.js 的 joinDashes）。
    只把**第二个** U+2014 包进 <i> 并用负边距回压，第一个保持纯文字：
    这样 Chrome 的「行首禁则」仍然生效（不会把「——」整体挤到下一行当行首），
    两个 <i> 也不会被当成一个不可断开的整体。
    回压量按字表实测：思源黑 500 字身 0.900 em、墨迹 0.805 em、两侧空 47/48 → 白口 0.095 em；
    Google Sans W 两侧空各 0.092 em → 白口 0.184 em。    注意 justify：`.cho .quote` 是 text-align: justify，Chrome 对 CJK 按「字间」分配剩余空间，
    会把这 0.095 em 的白口重新撑开，所以回压量要覆盖「字身空 + 均摊余量」，取 -.32 em
    （与正文 figures.css 里 .em.nj 同一个值，那个也是在被 justify 的段落里验证过的）。
    署名那行是短行、不参与 justify，按 Google Sans 的 0.184 em 白口给 -.19 em 即可。 */
export const dashJoin = (s, gap = '-.32em') => String(s).replace(/——/g,
  `—<i class="dsh" style="--dj:${gap}">—</i>`);

/** build/*.html 到 src/css 的相对前缀（两个页面都在 build/ 下） */
const SRC_PREFIX = { css: '../src/css/', js: '../src/js/' };

export const cssLinks = list => list
  .map(f => `<link rel="stylesheet" href="${f.startsWith('~') ? f.slice(1) : SRC_PREFIX.css + f}">`)
  .join('\n');

export const jsTags = list => list
  .map(f => `<script src="${f.startsWith('~') ? f.slice(1) : SRC_PREFIX.js + f}"></script>`)
  .join('\n');

/** 相对构建根（build/）的路径，用于 overlay 里的 <img src="chapters/…"> 之类 */
export const rel = (fromDir, p) => path.relative(fromDir, p).replace(/\\/g, '/');

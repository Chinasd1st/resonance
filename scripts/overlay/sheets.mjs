// overlay 层：与正文同尺寸（216 × 303 mm）的满版页面，每页一张 .sheet。
// 书眉、页码、色标、章扉页叠层、篇目跨页底图都在这里；正文层不含任何越出版心的元素。
// 页面样式在 src/css/overlay.css（原先内联在这段 HTML 里），art 相关在 src/css/art/。
import { cssLinks } from '../lib/html.mjs';
import { OVERLAY_CSS } from '../../src/assets.mjs';
import { ISSUE, CHAPTERS, CLUB_ORDER, FORM_EN, clubVar } from '../config/issue.mjs';
import { esc, pad } from '../lib/html.mjs';
import { chapterSheet } from '../content/chapter.mjs';

const ROMAN = ['', 'i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii', 'viii'];

export function overlayHtml(map, frontPages, arts, articles) {
  const FRONT = frontPages;
  const starts = [];
  for (const ch of new Set(articles.map(a => a.ch))) starts.push({ p: map.dests[`ch-${ch}`], kind: 'chapter', ch });
  for (const a of articles) starts.push({ p: map.dests[`a-${a.id}`], kind: 'article', a });
  starts.sort((x, y) => x.p - y.p);
  const owner = p => { let o = null; for (const s of starts) if (s.p <= p) o = s; return o; };
  let pages = '';
  for (let p = 1; p <= map.pages; p++) {
    const right = p % 2 === 1;
    const o = owner(p);
    const isStart = o && o.p === p;
    const art = arts[p];
    let inner = art ? art.html : '';
    // folio
    let folio = '';
    if (p <= FRONT) folio = p >= 4 ? ROMAN[p] : '';
    else folio = String(p - FRONT);
    const chStart = p > FRONT && o && o.kind === 'chapter' && isStart;
    if (chStart) {
      inner += chapterSheet(o.ch, right, articles);
      // 章扉页页脚带：通栏细线，切口侧页码、订口侧「# 章名」（纸面上，墨色）
      inner += `<div class="strip ${right ? 'r' : 'l'}"><span class="tagc"># ${CHAPTERS[o.ch].cn}　${CHAPTERS[o.ch].en}</span><span>${folio}</span></div>`;
    } else if (folio) inner += `<div class="folio ${right ? 'r' : 'l'}${art && art.dark ? ' inv' : ''}${art && art.swiss ? ' swiss' : ''}">${folio}</div>`;
    // running head
    if (p > FRONT && o && !isStart && o.kind === 'article' && !(art && art.noRh)) {
      // 书眉：CHAPTER 02 ESSAY 05　标题
      const txt = right ? `CHAPTER ${pad(o.a.ch)} ${FORM_EN[o.a.form] || ''} ${pad(o.a.seq)}　${esc(o.a.title)}` : `RESONANCE　共鸣　${ISSUE.cn}`;
      inner += `<div class="rh ${right ? 'r' : 'l'}${art && art.dark ? ' inv' : ''}">${txt}</div>`;
    }
    // thumb tab (right pages of articles)
    if (p > FRONT && o && o.kind === 'article' && right) {
      const idx = CLUB_ORDER.indexOf(o.a.clubs[0]);
      inner += `<div class="tab" style="top:calc(23mm + ${idx} * 34pt);background:${art && art.swiss ? '#111111' : clubVar(o.a.clubs[0])}"></div>`;
    }
    // page ii 的社团色条改由 .fm-bars .legend 在正文层绘制，overlay 不再重复
    pages += `<div class="sheet">${inner}</div>`;
  }
  return `<!doctype html><html><head><meta charset="utf-8">
${cssLinks(OVERLAY_CSS)}
</head><body>${pages}</body></html>`;
}

// 章扉页（DESIGN-TOKENS §7.2）：真实风光照片做成「印刷品」——CMYK 四色网点 + 轻微套印错位 + 纸纹，
// 底图由 scripts/art/chapter-art.py 生成整张出血位图；文字、圆点里的字母都由 overlay 用矢量叠在上面。
// 版式参照两张参考图：上部纸面排章名、引语与篇目；下部照片块从订口侧偏进两栏、向切口出血；
// 照片上压 4 × 5 个实色蓝圆，章名英文按行逐字落在圆里。
import fs from 'node:fs';
import { B, at } from '../lib/path.mjs';
import { runPy } from '../lib/run.mjs';
import { dashJoin, esc, pad } from '../lib/html.mjs';
import { CHAPTERS } from '../config/issue.mjs';
import { CH_PHOTO, CH_QUOTE } from '../config/photos.mjs';
import { chapterGeom } from '../config/geometry.mjs';

// 正文层只留一张空页和锚点（目录链接、页码回填都靠 #ch-N）。
// 满版内容画在 overlay 层：正文层里任何超出版心的元素都会让 Chrome 把整份文档等比缩小，
// 往上溢出的底色还会画到前一页底部
export function chapterOpener(ch) {
  return `
  <section class="page chapter-opener" id="ch-${ch}" data-ch="${ch}"></section>`;
}

// overlay 里的章扉页：底图 + 与正文版心同位的 .blk（右页订口在左 23 mm，左页 18 mm）+ 圆里的字母
export function chapterSheet(ch, right, articles) {
  const list = articles.filter(a => a.ch === ch).map(a => `<div><b>${pad(a.seq)}</b><span>${esc(a.title)}</span></div>`).join('');
  const q = CH_QUOTE[ch];
  const { circles } = chapterGeom(right);
  const letters = [...CHAPTERS[ch].en].map((L, i) => circles[i]
    ? `<i style="left:${circles[i][0]}mm;top:${circles[i][1]}mm">${esc(L)}</i>` : '').join('');
  return `<div class="cho" data-ch="${ch}"><img class="art" src="chapters/ch-${ch}.jpg" alt="">
    <div class="blk" style="left:${right ? 23 : 18}mm">
      <div class="k">CHAPTER ${pad(ch)}</div>
      <div class="cn">${CHAPTERS[ch].cn}</div>
      <div class="en">${CHAPTERS[ch].en[0]}${CHAPTERS[ch].en.slice(1).toLowerCase()}</div>
      ${q ? `<div class="quote">${dashJoin(esc(q.text))}<span>${dashJoin(`——《${esc(q.from)}》`, '-.19em')}</span></div>` : ''}
      <div class="list">${list}</div>
    </div>
    <div class="letters">${letters}</div></div>`;
}

// 生成章扉页底图（overlay 之前调用；章首页的左右由实际页序决定，所以要先拿到 pagemap）
export function renderChapterArt(map, articles) {
  fs.mkdirSync(B('chapters'), { recursive: true });
  for (const ch of new Set(articles.map(a => a.ch))) {
    const right = map.dests[`ch-${ch}`] % 2 === 1;
    const { rect, circles } = chapterGeom(right);
    const spec = { photo: at(CH_PHOTO[ch].src), focus: CH_PHOTO[ch].focus, zoom: CH_PHOTO[ch].zoom || 1,
      rect, circles, circle_rgb: [0x45, 0x8C, 0xEE], seed: 10 + ch };
    fs.writeFileSync(B(`chapters/ch-${ch}.json`), JSON.stringify(spec));
    runPy('art/chapter-art.py', B(`chapters/ch-${ch}.json`), B(`chapters/ch-${ch}.jpg`));
  }
}

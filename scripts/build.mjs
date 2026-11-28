// Resonance build：装配 → Chrome 打印两遍 → 分页回填 → 底图/overlay → 合层。
// usage: node scripts/build.mjs [--only 1-1,2-2]
//
// 这一层只编排顺序，细节都在：
//   lib/      路径、子进程、Chrome
//   config/   期号、社团、照片授权、每篇补丁
//   content/  manifest → 各页 HTML
//   overlay/  书眉页脚与满版底图
//   figures/  重绘插图（内联 SVG）
import fs from 'node:fs';
import { B, DIST } from './lib/path.mjs';
import { runPy } from './lib/run.mjs';
import { onlyIds } from './lib/cli.mjs';
import { launchChrome, openBook, printHtml, BOOK_PDF } from './lib/browser.mjs';
import { loadArticles } from './content/articles.mjs';
import { bookHtml } from './content/book.mjs';
import { renderChapterArt } from './content/chapter.mjs';
import { overlayHtml } from './overlay/sheets.mjs';
import { artSheets, renderArt } from './overlay/art.mjs';
import { TITLE_ORB } from './config/photos.mjs';

const { all, rendered } = loadArticles({ only: onlyIds() });

// ---------- 1. 装配 ----------
fs.mkdirSync(DIST(), { recursive: true });
fs.writeFileSync(B('book.html'), bookHtml(rendered, all));

// ---------- 2. 打印第一遍（只为拿页序）----------
const browser = await launchChrome();
const { page, report } = await openBook(browser, B('book.html'));
console.log('transform', JSON.stringify(report));
await page.pdf({ ...BOOK_PDF, path: B('body.pass1.pdf') });

// ---------- 3. 量页 ----------
// 前置页数由实际排版推出（第一章章首页之前的所有页），目录若自然续到第二页也不会算错页码。
// 用「最早的章首页」而不是写死 ch-1：--only 只排第二章时也能算出正确的页码基准。
let map = JSON.parse(runPy('pdf/pagemap.py', B('body.pass1.pdf')));
const firstCh = Math.min(...Object.entries(map.dests)
  .filter(([k]) => k.startsWith('ch-')).map(([, p]) => p));
const front = firstCh - 1;

// ---------- 4. 回填目录页码，打印第二遍 ----------
await page.evaluate(({ m, front }) => {
  document.querySelectorAll('.pn[data-target]').forEach(s => {
    const p = m.dests[s.dataset.target]; s.textContent = p ? String(p - front).padStart(2, '0') : '—';
  });
}, { m: map, front });
await page.pdf({ ...BOOK_PDF, path: B('body.pdf') });
map = JSON.parse(runPy('pdf/pagemap.py', B('body.pdf')));
fs.writeFileSync(B('pagemap.json'), JSON.stringify(map, null, 1));
console.log('pages', map.pages, 'front', front, JSON.stringify(map.dests));

// ---------- 5. 章扉页底图（左右由真实页序决定）----------
renderChapterArt(map, rendered);

// ---------- 6. 篇目跨页：先量出只有排版后才知道的位置 ----------
// 1-2 的雾蓝底收在哪一行，由 findtext.py 在 body.pdf 里查字的坐标得到
const pos = JSON.parse(runPy('pdf/findtext.py', B('body.pdf'), JSON.stringify({ fog: '白色的天花板' })));
console.log('art pos', JSON.stringify(pos));
const { out: arts, specs: artSpecs } = artSheets(map, pos);
// 正扉页（第 iii 页）：光球底图垫在正文下面
artSpecs.push(['title-orb', TITLE_ORB]);
arts[map.dests['fm-3'] || 3] = { html: '<img class="artimg" src="art/title-orb.jpg" style="left:0;top:0;width:216mm;height:303mm" alt="">' };
renderArt(artSpecs);

// ---------- 7. overlay 层 ----------
// 有底图的页：overlay 垫在正文下面（merge.py 的 under 页）
fs.writeFileSync(B('under.json'), JSON.stringify(Object.keys(arts).map(Number)));
fs.writeFileSync(B('overlay.html'), overlayHtml(map, front, arts, rendered));
await printHtml(browser, B('overlay.html'), B('overlay.pdf'));
await browser.close();

// ---------- 8. 合层：screen / print-rgb ----------
console.log(runPy('pdf/merge.py', B('body.pdf'), B('overlay.pdf'), DIST(), B('under.json')));

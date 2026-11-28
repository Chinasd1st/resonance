// Resonance build：装配 → Chrome 打印两遍 → 分页回填 → 底图/overlay → 合层。
// usage: node scripts/build.mjs [--only 1-1,2-2] [--reuse=body|overlay] [--no-art] [--no-merge]
//
// 这一层只编排顺序，细节都在：
//   lib/      路径、子进程、Chrome
//   config/   期号、社团、照片授权、每篇补丁
//   content/  manifest → 各页 HTML
//   overlay/  书眉页脚与满版底图
//   figures/  重绘插图（内联 SVG）
//
// 增量开关（只在检查时用，别拿它出交付件）：
//   --reuse=body     复用 build/body.pdf 与 pagemap.json，只重做底图/overlay/合层
//                    （改了页码、书眉、overlay 层 CSS 时用；正文一个字没动才成立）
//   --reuse=overlay  复用 build/overlay.pdf，只重做正文层与合层
//                    （改了正文 CSS / 文案 / 补丁表时用）
//   --reuse=all      两层都复用，只重算底图清单并合层（改了 overlay.css 里不涉及排版的东西）
//   --no-art         复用 build/art 下已有的底图 jpg（改版式没改底图参数时用）
//   --no-merge       只出 body.pdf / overlay.pdf，不调 merge.py
import fs from 'node:fs';
import { B, DIST } from './lib/path.mjs';
import { runPy } from './lib/run.mjs';
import { onlyIds, opt, flag } from './lib/cli.mjs';
import { launchChrome, openBook, printHtml, BOOK_PDF } from './lib/browser.mjs';
import { loadArticles } from './content/articles.mjs';
import { bookHtml } from './content/book.mjs';
import { renderChapterArt } from './content/chapter.mjs';
import { overlayHtml } from './overlay/sheets.mjs';
import { artSheets, renderArt } from './overlay/art.mjs';
import { TITLE_ORB } from './config/photos.mjs';

const only = onlyIds();
const reuse = opt('reuse', '');
const noArt = flag('no-art');
const noMerge = flag('no-merge');

if (reuse && !['body', 'overlay', 'all'].includes(reuse)) {
  throw new Error(`--reuse 只认 body / overlay / all，收到 "${reuse}"`);
}
const keepBody = reuse === 'body' || reuse === 'all';
const keepOverlay = reuse === 'overlay' || reuse === 'all';
if (keepBody && only) {
  throw new Error('--reuse=body 与 --only 冲突：--only 会改变整本书的页序，不能复用旧的 body.pdf');
}
if (keepBody && !fs.existsSync(B('pagemap.json'))) {
  throw new Error('--reuse=body|all 需要 build/pagemap.json，先跑一次完整构建');
}
if (keepOverlay && !fs.existsSync(B('overlay.pdf'))) {
  throw new Error('--reuse=overlay 需要 build/overlay.pdf，先跑一次完整构建');
}

const { all, rendered } = loadArticles({ only });

// 前置页数由真实页序推出（第一章章首页之前的所有页）。--only 只排第二章时也算得对。
const frontOf = m => Math.min(...Object.entries(m.dests)
  .filter(([k]) => k.startsWith('ch-')).map(([, p]) => p)) - 1;

let map;
let front;
let browser = null;

if (keepBody) {
  // ---------- 复用正文层：跳过装配与两遍打印 ----------
  map = JSON.parse(fs.readFileSync(B('pagemap.json'), 'utf8'));
  front = frontOf(map);
  console.log('reuse body.pdf:', map.pages, 'pages, front', front);
} else {
  // ---------- 1. 装配 ----------
  fs.mkdirSync(DIST(), { recursive: true });
  fs.writeFileSync(B('book.html'), bookHtml(rendered, all));

  // ---------- 2. 打印第一遍（只为拿页序）----------
  browser = await launchChrome();
  const { page, report } = await openBook(browser, B('book.html'));
  console.log('transform', JSON.stringify(report));
  await page.pdf({ ...BOOK_PDF, path: B('body.pass1.pdf') });

  // ---------- 3. 量页 ----------
  map = JSON.parse(runPy('pdf/pagemap.py', B('body.pass1.pdf')));
  front = frontOf(map);

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
}

// ---------- 5. 篇目跨页：先量出只有排版后才知道的位置 ----------
// 1-2 的雾蓝底收在哪一行，由 findtext.py 在 body.pdf 里查字的坐标得到
const pos = JSON.parse(runPy('pdf/findtext.py', B('body.pdf'), JSON.stringify({ fog: '白色的天花板' })));
console.log('art pos', JSON.stringify(pos));
const { out: arts, specs: artSpecs } = artSheets(map, pos);
// 正扉页（第 iii 页）：光球底图垫在正文下面
artSpecs.push(['title-orb', TITLE_ORB]);
arts[map.dests['fm-3'] || 3] = { html: '<img class="artimg" src="art/title-orb.jpg" style="left:0;top:0;width:216mm;height:303mm" alt="">' };

if (noArt) {
  console.log('skip art:', artSpecs.length, 'specs 复用 build/art 下的 jpg');
} else {
  // ---------- 6. 章扉页底图（左右由真实页序决定）----------
  renderChapterArt(map, rendered);
  renderArt(artSpecs);
}

// ---------- 7. overlay 层 ----------
// 有底图的页：overlay 垫在正文下面（merge.py 的 under 页）
fs.writeFileSync(B('under.json'), JSON.stringify(Object.keys(arts).map(Number)));
fs.writeFileSync(B('overlay.html'), overlayHtml(map, front, arts, rendered));
if (keepOverlay) {
  console.log('reuse overlay.pdf');
} else {
  browser = browser || await launchChrome();
  await printHtml(browser, B('overlay.html'), B('overlay.pdf'));
}
if (browser) await browser.close();

// ---------- 8. 合层：screen / print-rgb ----------
if (noMerge) {
  console.log('skip merge（--no-merge）');
} else {
  console.log(runPy('pdf/merge.py', B('body.pdf'), B('overlay.pdf'), DIST(), B('under.json')));
}

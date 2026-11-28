// 单篇装配：pandoc 片段 → 6 张补丁表 → 公式卡 / SVG 重绘 → 开篇骨架。
// 补丁表本身在 config/patches.mjs（每期重写），这里只负责「按什么顺序套」。
import fs from 'node:fs';
import { B } from '../lib/path.mjs';
import { esc, pad } from '../lib/html.mjs';
import { CLUBS, CHAPTERS, FORM_EN, clubVar } from '../config/issue.mjs';
import { ART, ART_PHOTO } from '../config/photos.mjs';
import { SWAP_IMG, FIG_W, FIG_FLOAT, FIG_MOVE, TEXT_FIX, FIG_REF, FIG_WRAP, TRIG_CARD } from '../config/patches.mjs';
import { FIGURES } from '../figures/index.mjs';
import { applyRareGlyphs } from './rare-glyphs.mjs';

// 开篇（正文层）。kicker = 「CH 01 — 01 / 10」，tags = 社团 / 体裁
function artOpener(a, kicker, tags, who) {
  const ph = ART_PHOTO[a.id];
  if (a.id === '1-1') return `
    <header class="opener aop">
      <div class="k"><span>${kicker}</span><span class="tags">${tags}</span></div>
      <h1 class="title">${esc(a.title)}</h1>
      <div class="who">${who}</div>
      <div class="credit">图　${esc(ph.short)}</div>
    </header>`;
  if (a.id === '1-2') return `
    <header class="opener aop">
      <div class="k"><span>${kicker}</span><span class="tags">${tags}</span></div>
      <h1 class="title">${esc(a.title)}</h1>
      <div class="who">${who}</div>
      <div class="credit">图　${esc(ph.short)}</div>
    </header>`;
  if (a.id === '1-3') return `
    <header class="opener aop">
      <h1 class="title"><span>半片水，</span><span>半城雾</span></h1>
      <div class="k">${kicker}　${tags}</div>
      <div class="credit">图　${esc(ph.short)}</div>
    </header>`;
  if (a.id === '1-4') return `
    <header class="opener aop">
      <div class="k"><span>${kicker}</span><span class="tags">${tags}</span></div>
      <div class="num">${pad(a.seq)}</div>
      <h1 class="title">${esc(a.title)}</h1>
      ${a.subtitle ? `<p class="subtitle">——${esc(a.subtitle)}</p>` : ''}
      <div class="foot"><span class="who">${who}</span><span class="en">BREAK THE RULE · 1791 × 2002</span></div>
    </header>`;
  if (a.id === '1-5') return `
    <header class="opener aop">
      <div class="k"><span>${kicker}</span><span class="tags">${tags}</span></div>
      <div class="num">159″</div>
      <h1 class="title">${esc(a.title)}</h1>
      <div class="foot"><span class="log">00:02:39 · ELEVATOR SHAFT</span><span>1F — 26F — B1</span></div>
    </header>`;
  if (a.id === '1-6') return `
    <header class="opener aop">
      <div class="sw-top"><span>${kicker} // ${FORM_EN[a.form] || ''}</span><span>RESONANCE · VOL. 02</span></div>
      <div class="sw-poster">
        <div class="sw-band top">
          <div class="sw-cell">ALMOST EVERYWHERE<br>MEASURE ZERO<br>LEBESGUE<br>POETRY 06<br>OPEN CALL<span class="gap"></span>// 06</div>
          <div class="sw-cell c">RESONANCE 02</div>
          <div class="sw-cell r">CH 01 LITERATURE<br>XUAN DU<br>10:00 — 06:00<br>SWISS GRID<br>MONOCHROME<span class="gap"></span>26</div>
        </div>
        <div class="sw-band mid">
          <div class="sw-cell">EXISTENCE<br>WITHOUT THICKNESS<br>REALITY<br>WITHOUT WEIGHT<br>CONTINUUM<span class="gap"></span>// AE</div>
          <div class="sw-cell c"><span class="cn-title">几乎处处</span><span class="en-sub">ALMOST EVERYWHERE · 泫渡</span></div>
          <div class="sw-cell r">HEIDEGGER<br>NIETZSCHE<br>RATIONALS IN R<br>DENSE SET<br>ARCHIVE<span class="gap"></span>06</div>
        </div>
        <div class="sw-band bot">
          <div class="sw-cell">TONGXIANG HIGH<br>STUDENT JOURNAL<br>WINTER 2026<br>OPEN CALL<br>MONOCHROME<span class="gap"></span>// 01</div>
          <div class="sw-cell c">POETRY 06</div>
          <div class="sw-cell r">DESIGN REF<br>X@AarzooAly<br>TULIP STUDY<br>CC BY 2.0<br>SWISS GRID<span class="gap"></span>26</div>
        </div>
      </div>
      <div class="sw-bot">
        <span class="ref"><b>DESIGN REF:</b> X@AarzooAly · SWISS INTERNATIONAL STYLE</span>
        <span><b>PHOTO:</b> ${esc(ph.short)}</span>
      </div>
    </header>`;
  return '';
}

// 文字层面的改动（不改字，只加结构）
function artFrag(a, frag) {
  if (a.id === '1-1') {
    // 跨页右页上部：引语（原文句子）；车灯光线从它的右上方斜过去
    frag = `<div class="pull"><p>记忆的胶片从来没有损坏，<br>只不过是我们的读取器早已迭代了。</p></div>\n` + frag;
  }
  if (a.id === '1-2') {
    // 反转处：雾蓝底色在这里收住（位置在排版后量出，见 overlay/art.mjs 的 pos.fog），通栏断开前后两半
    const t = '<p>白色的天花板。';
    if (!frag.includes(t)) console.warn('ART miss 1-2 fog');
    frag = frag.replace(t, `<div class="fogline"></div>\n${t}`);
    frag = frag.replace('<p>“明天见。”</p>', '<p class="bigline">“明天见。”</p>');
    // 交班记录按普通正文排（不再做成带框的记录单）；末句是护士补的一笔
    frag = frag.replace('<p>“他们看上去，都很高兴。”</p>', '<p class="addendum">“他们看上去，都很高兴。”</p>');
  }
  if (a.id === '1-6') {
    // 标头单独放在 .text 之前（通过 coda/preText 结构，避免被 structure.js 的 stripHead 误当成原稿标题删掉）
    return frag;
  }
  return frag;
}

// 1-3 / 1-4 收尾段落：从正文取出排在栏尾
function artCoda(a, frag) {
  if (a.id === '1-3') {
    const m = frag.match(/<p>(故乡，水的故乡[\s\S]*?)<\/p>\s*$/);
    if (!m) { console.warn('ART miss 1-3 coda'); return { frag, coda: '' }; }
    return { frag: frag.slice(0, m.index), coda: `<div class="coda"><p>${m[1]}</p></div>` };
  }
  if (a.id === '1-4') {
    const m = frag.match(/<div data-custom-style="Normal">\s*<p>([\s\u00a0]*《讨厌红楼梦》其实是欣赏《红楼梦》[\s\S]*?)<\/p>\s*<\/div>\s*$/);
    if (m) {
      const line = m[1].trim().replace(/“红楼梦”/g, '<span class="hl">“红楼梦”</span>');
      return { frag: frag.slice(0, m.index), coda: `<div class="coda"><p>${line}</p><span class="bopo">ㄅㄆㄇㄈㄉㄊㄋㄌ</span></div>` };
    }
    const mp = frag.match(/<p>([\s\u00a0]*《讨厌红楼梦》其实是欣赏《红楼梦》[\s\S]*?)<\/p>\s*$/);
    if (!mp) { console.warn('ART miss 1-4 coda'); return { frag, coda: '' }; }
    const line = mp[1].trim().replace(/“红楼梦”/g, '<span class="hl">“红楼梦”</span>');
    return { frag: frag.slice(0, mp.index), coda: `<div class="coda"><p>${line}</p><span class="bopo">ㄅㄆㄇㄈㄉㄊㄋㄌ</span></div>` };
  }
  return { frag, coda: '' };
}

/**
 * 按固定顺序给 pandoc 片段打补丁。顺序有语义：
 * 换图 → 改宽（英寸）→ 绕排开关 → 挪锚 → 改字 → 图号引用 → 公式卡 → SVG 重绘。
 * 重绘必须最后：它要读 FIG_W 改过后的宽度，再按 viewBox 比例重算高度。
 */
function applyPatches(a, raw) {
  // pandoc 把图片指到 build/media/…，而 book.html 就在 build/ 下，去掉多余的 build/
  let frag = raw.replace(/src="build\//g, 'src="');

  for (const [file, rep] of Object.entries(SWAP_IMG[a.id] || {})) {
    const re = new RegExp(`<img[^>]*media/${file.replace('.', '\\.')}[^>]*>`);
    frag = frag.replace(re, `<img src="${rep.src}" alt="${esc(rep.alt)}" style="width:2.05in" />`);
  }

  for (const [file, spec] of Object.entries(FIG_W[a.id] || {})) {
    const [w, h] = Array.isArray(spec) ? spec : [spec, null];
    const re = new RegExp(`(<img[^>]*media/${file.replace('.', '\\.')}[^>]*style=")width:[\\d.]+in(;height:[\\d.]+in)?`);
    frag = frag.replace(re, (m, p1, p2, p3) => `${p1}width:${w}in` + (h ? `;height:${h}in` : (p2 || '')));
  }
  for (const [key, on] of Object.entries(FIG_FLOAT)) {
    const [id, file] = key.split('/');
    if (id !== a.id) continue;
    const re = new RegExp(`<img(?=[^>]*media/${file.replace('.', '\\.')})([^>]*)>`);
    if (!re.test(frag)) console.warn('FIG_FLOAT miss', key);
    frag = frag.replace(re, (m, attrs) => `<img${attrs} data-float="${on}">`);
  }
  for (const [file, before] of (FIG_MOVE[a.id] || [])) {
    const re = new RegExp(`<img[^>]*media/${file.replace('.', '\\.')}[^>]*>`);
    const tag = (frag.match(re) || [])[0];
    if (!tag || frag.split(before).length !== 2) { console.warn('FIG_MOVE miss', a.id, file); continue; }
    // 原位置只删图，段落文字留着；图单独成段插到目标段之前（figures.js 会把单图段换成 figure）
    frag = frag.replace(tag, '').replace(before, `<p>${tag}</p>\n${before}`);
  }
  for (const [find, rep] of (TEXT_FIX[a.id] || [])) {
    if (!frag.includes(find)) console.warn('TEXT_FIX miss', a.id, find.slice(0, 20));
    frag = frag.split(find).join(rep);
  }
  // 注意：这里必须是数组（[[找, 换], …]），不能套 Object.entries ——
  // 那会把下标 "0" 当成待替换的字符串，全书每个 0 都会被替换掉
  for (const [find, rep] of (FIG_REF[a.id] || [])) {
    if (!frag.includes(find)) console.warn('FIG_REF miss', a.id, find.slice(0, 20));
    frag = frag.split(find).join(rep);
  }
  // 2-8 的手写笔记原图挂在段首（图后紧接着正文），换公式卡时要把整段拆开：
  // 卡片自成一格，原来的那段正文退回普通段落
  if (a.id === '2-8') {
    frag = frag.replace(/<p>\s*<img[^>]*media\/2-8\/media\/image1\.png[^>]*>([\s\S]*?)<\/p>/,
      (m, rest) => `${TRIG_CARD}<p class="noindent">${rest}</p>`);
  }
  // 重绘插图：位图换成内联 SVG，交给 figures.js 走与 <img> 相同的布置逻辑
  // （figure 包裹、图注、单栏绕排），尺寸沿用原 <img> 的行内 style —— 见 scripts/figures/
  for (const [key, fn] of Object.entries(FIGURES)) {
    const [id, file] = key.split('/');
    if (id !== a.id) continue;
    const f = fn();
    const inFile = `media/${id}/media/${file}`;
    frag = frag.replace(/<img[^>]*>/g, tag => {
      if (!tag.includes(inFile)) return tag;
      const st = (tag.match(/style="([^"]*)"/) || [, ''])[1];
      const alt = (tag.match(/alt="([^"]*)"/) || [, ''])[1];
      // 宽度沿用原稿（FIG_W 已改过的），高度必须按 SVG 自身比例重算：
      // 原稿 <img> 的 height 是位图的比例，直接照搬会把矢量图纵向拉扁
      const wIn = +((st.match(/width:\s*([\d.]+)in/) || [, 0])[1]) || f.vw / 72;
      const size = `width:${+wIn.toFixed(4)}in;height:${+(wIn * f.vh / f.vw).toFixed(4)}in`;
      const nof = FIG_WRAP[key] ? ` data-fw="${FIG_WRAP[key]}"` : '';
      return `<svg class="dfig" width="${f.vw}pt" height="${f.vh}pt" viewBox="0 0 ${f.vw} ${f.vh}"`
        + ` preserveAspectRatio="xMidYMid meet" style="${size}" data-cap="${alt}" data-ref="${file}"${nof}>${f.body}</svg>`;
    });
  }
  return frag;
}

export function article(a, articles) {
  let frag = applyPatches(a, fs.readFileSync(B(`html/${a.id}.html`), 'utf8'));
  // 公式密集的篇目改为单栏：独立公式不再通栏切断双栏正文；
  // 2-1 的插图比一栏还宽、塞进双栏会留出大块空白，也按单栏排
  const single = !a.verse && ((frag.match(/class="math display"/g) || []).length >= 8 || a.id === '2-1');
  if (a.id === '2-3') frag = applyRareGlyphs(frag);

  const art = ART[a.id];
  let coda = '';
  if (art) { frag = artFrag(a, frag); ({ frag, coda } = artCoda(a, frag)); }

  const bar = a.clubs.map(c => `<i style="background:${clubVar(c)}"></i>`).join('');
  const tags = [...a.clubs.map(c => `<b style="color:${clubVar(c === 'news' ? 'open' : c)}">${CLUBS[c].en}</b>`), `<b>${FORM_EN[a.form] || ''}</b>`].join('');
  const total = articles.filter(x => x.ch === a.ch).length;
  const longT = [...a.title].length > 12;
  const who = a.author ? `${esc(a.author)}${a.author_note ? `<span>${esc(a.author_note)}</span>` : ''}` : '';
  const preText = a.id === '1-6'
    ? `<div class="swiss-rh-head"><span><b class="red">06 //</b> 几乎处处</span><span class="sub">ALMOST EVERYWHERE · 泫渡</span></div>`
    : '';
  return `
  <section class="article ${a.serif ? 'serif' : 'sans'} ${a.verse ? 'verse' : ''}${single ? ' single' : ''}${art ? ` art ${art.cls}${art.full ? ' full' : ''}` : ''}" id="a-${a.id}" data-id="${a.id}" data-form="${a.form}"
     data-strip='${esc(JSON.stringify(a.strip_lines))}' style="--club:${clubVar(a.clubs[0])}">
    ${art ? artOpener(a, `CH ${pad(a.ch)} — ${pad(a.seq)} / ${pad(total)}`, tags, who) : `<header class="opener">
      <div class="clubbar">${bar}</div>
      <div class="meta-top">CH ${pad(a.ch)} — ${pad(a.seq)} / ${pad(total)}</div>
      <div class="mega">${pad(a.seq)}</div>
      <div class="head">
        <h1 class="title ${longT ? 'long' : ''}">${esc(a.title)}</h1>
        ${a.subtitle ? `<p class="subtitle">——${esc(a.subtitle)}</p>` : ''}
      </div>
      <div class="rule"></div>
      <div class="byline"><div class="who">${who}</div><div class="tags">${tags}</div></div>
    </header>`}
    ${preText}<div class="text"></div>${coda}
    <template class="raw">${frag}</template>
  </section>`;
}

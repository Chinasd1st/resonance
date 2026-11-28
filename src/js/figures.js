// 图：把「含图段落」换成 <figure>，编号 + 图注，决定通栏 / 绕排 / 小图。
// 编号在这里登记进 state.map（原稿文件名 → 图号），refs.js 再把正文里的 [[fig:]] 换成号。
(function (RS) {
  const COL_IN = 3.32;    // 双栏篇目的单栏宽度（175mm 版心 → 84mm 栏）
  const BLOCK_IN = 6.85;  // 版心宽 175mm

  function inches(img) {
    const m = (img.getAttribute('style') || '').match(/width:\s*([\d.]+)in/);
    return m ? parseFloat(m[1]) : 3;
  }
  function aspect(img) {
    const m = (img.getAttribute('style') || '').match(/height:\s*([\d.]+)in/);
    return m ? parseFloat(m[1]) / inches(img) : 1;
  }
  function captionOf(img) {
    let a = (img.getAttribute('alt') || img.getAttribute('data-cap') || '').trim();
    a = a.replace(/^.*\.(jpe?g|png|gif|bmp)/i, '').trim();
    if (!a || /^截图|^image\d*$|^图片\d*$|^\d+$/i.test(a)) return '';
    if (/^[a-z]+$/i.test(a)) return '';   // romanised file names like "biang"
    // 图片网站的抓取名（查询串 / 长十六进制哈希）没有中文时一律不作图注
    if (!/[\u4e00-\u9fff]/.test(a) && /[=&]|[0-9a-f]{16,}/i.test(a)) return '';
    return a;
  }

  // 图注：编号 + 说明（说明可能为空，编号不能省）
  function caption(fig, n, cap) {
    const fc = document.createElement('figcaption');
    const b = document.createElement('b'); b.textContent = '图 ' + n;
    fc.appendChild(b);
    if (cap) fc.appendChild(document.createTextNode(cap));
    fig.appendChild(fc);
    return fc;
  }

  // 图的身份：重绘的 SVG 带 data-ref（原稿文件名），位图取 src 的文件名。
  // 正文里的 \ref 用它把「图 X」的 X 算出来，不写死
  function figId(el) {
    return (el.dataset && el.dataset.ref) || ((el.getAttribute('src') || '').split('/').pop() || '');
  }

  function figures(text, state, single) {
    const wrapLimit = 110 / 25.4;   // 超过 110mm 的图更像整幅图表，铺满栏宽而不绕排
    // paragraphs that contain images
    [...text.querySelectorAll('p')].forEach(p => {
      const imgs = [...p.querySelectorAll('img, svg.dfig')];
      if (!imgs.length) return;
      const rest = p.cloneNode(true); rest.querySelectorAll('img, svg.dfig').forEach(i => i.remove());
      const hasText = rest.textContent.trim().length > 0;
      const fig = document.createElement('figure');
      if (imgs.length >= 2) {
        // 一组图：原稿宽度超过栏宽的通栏排、按自然比例出图；小组图（字形表）保持一排缩略
        const wmax = Math.max(...imgs.map(inches));
        const wideRow = wmax > (single ? BLOCK_IN : COL_IN);
        fig.className = 'row' + (wideRow ? ' wide' : '');
        fig.style.setProperty('--n', Math.min(imgs.length, 5));
        imgs.forEach(img => {
          const cell = document.createElement('div'); cell.className = 'cell';
          const cap = captionOf(img);
          img.removeAttribute('style');   // 通栏行由 CSS 定宽，缩略行固定高度
          img.removeAttribute('alt');
          cell.appendChild(img);
          const cn = ++state.fig, cid = figId(img);
          if (cid) state.map[cid] = cn;
          cell.appendChild(caption(cell, cn, cap));
          fig.appendChild(cell);
        });
      } else {
        const img = imgs[0], w = inches(img), cap = captionOf(img);
        const inCell = !!p.closest('td,th');
        // 表格单元格里图注就是同一段里的文字（「图」的说明另起一行会重复），
        // 把它接进 figcaption，段内文字清空
        const cellCap = inCell && hasText ? rest.textContent.trim() : '';
        // 比一栏还宽的图放不进栏里，硬塞会被缩到栏宽而下缘留出空白 → 让它通栏居中
        const wide = w > (single ? BLOCK_IN : COL_IN);
        fig.className = wide ? 'wide' : (w < 1.6 ? 'small' : 'col');
        // 单栏篇目里的小图改为图文绕排，不再居中占掉整行、留下两侧空白。
        // 默认只绕横幅（aspect ≤ 1.02）：竖图绕排会把行宽挤窄，被推到页顶时还会留出空洞；
        // 单张竖幅确实值得绕时，在原稿侧用 data-float 点名（如 2-5 的洛必达肖像）。
        // 表格里的图不参与绕排（百分比宽度在单元格里会缩到几毫米）
        // data-float="0"：在 config/patches.mjs 的 FIG_FLOAT 里点名不绕排的图
        const forceFloat = img.dataset.float === '1';
        if (img.dataset.float !== '0' && !wide && single && !p.closest('td,th')
            && (forceFloat || (w <= wrapLimit && aspect(img) <= 1.02))) {
          fig.classList.add('float');
          if (img.dataset.fw) fig.style.maxWidth = img.dataset.fw + '%';
        }
        // 按原稿标注的宽度出图，不再拉满栏宽：低分辨率截图被放大两三倍后既糊又占版，
        // 还会把整块图挤到下一页、留下半页空白。max-width:100% 兜住超宽的情况。
        // 重绘的 SVG 例外：它的行内 width/height 是按自身 viewBox 比例算好的，
        // 删掉就只剩 CSS 的 auto，尺寸会退化成浏览器的默认视口（图被压成一小块）
        const isSvg = img.classList && img.classList.contains('dfig');
        if (!isSvg) img.removeAttribute('style');
        // 绕排图由 CSS 定宽（按原始比例缩到栏侧），其余按原稿宽度出图
        if (!isSvg && !wide && !fig.classList.contains('float')) img.style.width = (w * 72).toFixed(1) + 'pt';
        if (!isSvg) img.style.height = 'auto';
        img.removeAttribute('alt');
        fig.appendChild(img);
        const n = ++state.fig, id = figId(img);
        if (id) state.map[id] = n;
        caption(fig, n, cellCap || cap);
        if (cellCap) { [...p.childNodes].forEach(n => n.nodeType === 3 && n.remove()); p.querySelectorAll('img, svg.dfig').forEach(i => i.remove()); }
      }
      RS.report.images += imgs.length;
      if (hasText) { p.before(fig); } else { p.replaceWith(fig); }
    });
    // runs of consecutive single small figures -> one row
    let run = [];
    const flush = () => {
      if (run.length >= 2) {
        const row = document.createElement('figure'); row.className = 'row'; row.style.setProperty('--n', Math.min(run.length, 5));
        run[0].before(row);
        run.forEach(f => { const c = document.createElement('div'); c.className = 'cell'; while (f.firstChild) c.appendChild(f.firstChild); row.appendChild(c); f.remove(); });
      }
      run = [];
    };
    [...text.children].forEach(el => { if (el.matches('figure.small')) run.push(el); else flush(); }); flush();
  }

  RS.figures = { figures };
})(window.RS = window.RS || {});

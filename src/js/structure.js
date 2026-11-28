// 结构判定：正文里的标题层级、分节句、步骤行、注释块，以及剥掉原稿标题行。
(function (RS) {
  /** 剥掉 docx 自带的标题/作者行（manifest 的 strip_lines），最多看前 6 个块 */
  function stripHead(raw, lines) {
    const targets = (lines || []).map(RS.norm).filter(Boolean);
    let i = 0;
    for (const el of [...raw.children].slice(0, 6)) {
      if (i >= targets.length) break;
      const t = RS.norm(el.textContent);
      if (t && t === targets[i]) { el.remove(); i++; }
      else if (t && targets[i] && (t.includes(targets[i]) || targets[i].includes(t)) && t.length < 80) { el.remove(); i++; }
    }
    if (i < targets.length) RS.report.warnings.push('strip incomplete: ' + raw.dataset.id + ' ' + i + '/' + targets.length);
  }

  // trailing 注释 block → .notes (small type, hanging numbers), never verse styling
  function endnotes(text) {
    const tops = [...text.querySelectorAll(':scope > p')];
    const at = tops.findIndex(p => /^注\s*释?\s*[:：]/.test(p.textContent.trim()));
    if (at < 0) return;
    const head = tops[at];
    const raw = head.textContent.trim();
    const label = /^注\s*释/.test(raw) ? '注释' : '注';
    const mHead = raw.match(/^注\s*释?\s*[:：]\s*/);
    const carried = mHead ? raw.slice(mHead[0].length).trim() : raw.replace(/^注\s*释?\s*[:：]?/, '').trim();

    const box = document.createElement('div'); box.className = 'notes';
    head.before(box);

    const lab = document.createElement('p'); lab.className = 'notes-label'; lab.textContent = label;
    box.appendChild(lab);

    // strip the leading "1－" marker from a paragraph's text nodes and prepend a number span
    const markItem = p => {
      const t = p.textContent.trim();
      const m = t.match(/^(\d{1,2})\s*[－—–\-、.．]\s*/);
      p.classList.add('note-item');
      if (!m) return;
      let remain = m[0].length;
      const w = document.createTreeWalker(p, NodeFilter.SHOW_TEXT);
      let nd;
      while (remain > 0 && (nd = w.nextNode())) {
        const s = nd.nodeValue;
        const take = Math.min(remain, s.length);
        nd.nodeValue = s.slice(take);
        remain -= take;
      }
      const n = document.createElement('span'); n.className = 'n'; n.textContent = m[1];
      p.insertBefore(n, p.firstChild);
    };

    if (carried) {
      const p = document.createElement('p'); p.textContent = carried;
      box.appendChild(p); markItem(p);
    }
    head.remove();
    tops.slice(at + 1).forEach(p => { box.appendChild(p); markItem(p); });
    // paragraphs without a number are continuations of the item above
    box.querySelectorAll('p.note-item').forEach(p => { if (!p.querySelector('.n')) p.className = 'note-cont'; });
  }

  function structure(text, form) {
    // headings: demote one level
    text.querySelectorAll('h1,h2,h3,h4,h5,h6').forEach(h => {
      const lvl = +h.tagName[1];
      RS.dom.renameEl(h, lvl <= 1 ? 'h2' : 'h3');
    });
    [...text.querySelectorAll('p')].forEach(p => {
      const t = p.textContent.trim();
      if (!t && !p.querySelector('img,.math')) { p.remove(); return; }
      const inCell = !!p.closest('td,th');
      // section numbers: "1", "1.", "一", "Part 1" — never inside a table cell ("一", "五" are data there)
      if (!inCell && /^(\d{1,2}[\.．、]?|[一二三四五六七八九十]{1,3})$/.test(t)) { const h = RS.dom.renameEl(p, 'h3'); h.classList.add('num'); h.textContent = t.replace(/[\.．、]$/, ''); return; }
      // 「Part 1 怪物与精灵之争」这类分段标题：源稿只是斜体正文，按二级标题排
      const part = t.match(/^(?:PART|Part|part)\s*(\d{1,2})\s*[：:.、]?\s*([^。！？]{2,26})$/);
      if (!inCell && part && t.length <= 30) {
        const h = document.createElement('h2');
        h.className = 'part';
        const pn = document.createElement('span'); pn.className = 'pn'; pn.textContent = 'PART ' + part[1];
        const pt = document.createElement('span'); pt.className = 'pt'; pt.textContent = part[2].trim();
        h.append(pn, pt);
        p.replaceWith(h);
        return;
      }
      // 「一、认知：…」「二、真相：…」这类分节句：源稿是正文，按二级标题排
      if (!inCell && /^[一二三四五六七八九十]{1,2}[、．.]/.test(t) && t.length <= 30) {
        RS.dom.renameEl(p, 'h2');
        return;
      }
      // 整段加粗（可带行内公式）且短 -> 标题：含公式的是小节(h3)，纯文字的是节(h2)
      const kids = [...p.children].filter(el => el.tagName !== 'IMG');
      const boldish = kids.length > 0
        && kids.every(el => /^(STRONG|B|SPAN)$/.test(el.tagName))
        && kids.some(el => /^(STRONG|B)$/.test(el.tagName));
      if (!inCell && boldish && t.length <= 34) {
        const isSub = !!p.querySelector('.math');
        p.querySelectorAll('span.math.display').forEach(s => { s.classList.remove('display'); s.classList.add('inline'); });
        const h = RS.dom.renameEl(p, isSub ? 'h3' : 'h2');
        h.querySelectorAll('strong, b').forEach(s => s.replaceWith(...s.childNodes));
        return;
      }
      // ①—⑩ 步骤行：按悬挂缩进的列表排，不再并入注释块。
      // 序号单独包一层，才能上色/加字距（否则圆圈数字和正文粘在一起）
      if (/^[①②③④⑤⑥⑦⑧⑨⑩]/.test(t)) {
        const f = p.firstChild;
        if (f && f.nodeType === 3 && /^[\s\u3000]*[①②③④⑤⑥⑦⑧⑨⑩]/.test(f.nodeValue)) {
          const m = f.nodeValue.match(/^[\s\u3000]*([①②③④⑤⑥⑦⑧⑨⑩])/);
          const s = document.createElement('span');
          s.className = 'num';
          s.textContent = m[1];
          f.nodeValue = f.nodeValue.slice(m[0].length);
          p.insertBefore(s, f);
        }
        p.classList.add('item');
        return;
      }
    });
    // endnotes block: "注释：1－…" plus following "2－…" items -> set as notes, not as verse
    endnotes(text);
    if (form === 'poem' || form === 'lyrics') {
      text.querySelectorAll('p').forEach(p => { if (/^[ \t]*$/.test(p.textContent)) p.remove(); });
    }
  }

  RS.structure = { stripHead, structure };
})(window.RS = window.RS || {});

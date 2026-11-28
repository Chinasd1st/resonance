// 文本层的清理与标点整形：全角化、去多余空格、破折号接合。
(function (RS) {
  function cleanText(root) {
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: n => n.parentElement.closest('.math, .katex, code') ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT
    });
    const nodes = []; while (w.nextNode()) nodes.push(w.currentNode);
    for (const n of nodes) {
      let t = n.nodeValue;
      t = t.replace(/\u00a0/g, ' ');
      t = t.replace(/(?<!-)--(?!-)/g, '——').replace(/—(?!—)(?<!—)/g, '——');
      t = t.replace(/\.{3,}|。{3,}/g, '……');
      t = t.replace(new RegExp('([' + RS.CJK + '])[ \\t]+(?=[A-Za-z0-9])', 'g'), '$1');
      t = t.replace(new RegExp('([A-Za-z0-9%])[ \\t]+(?=[' + RS.CJK + '])', 'g'), '$1');
      n.nodeValue = t;
    }
    // leading indent junk at paragraph start
    root.querySelectorAll('p').forEach(p => {
      let f = p.firstChild;
      while (f && f.nodeType === 3 && /^[\s\u3000]*$/.test(f.nodeValue)) { const nx = f.nextSibling; f.remove(); f = nx; }
      if (f && f.nodeType === 3) f.nodeValue = f.nodeValue.replace(/^[\s\u3000]+/, '');
    });
  }

  // 破折号：思源黑体的 U+2014 字身只有 0.894 em，两个并排时中间会露出一道白口，
  // 看上去像「两根短横」而不是一条一字线。字体 GSUB 的 ccmp 里有 emdash_emdash
  // 连字，但 Chrome 在含汉字的 run 里不应用它（实测只有整段全是破折号时才吃），
  // 所以在字体就绪后量一次：没吃到连字就把第二个破折号往回压 0.32 em，
  // 两段墨迹叠合成一条实线（叠合部位本来就是一整条黑线，看不出接缝）。
  let dashLig = null;
  function hasDashLigature() {
    const s = document.createElement('span');
    s.textContent = '——';
    s.style.cssText = 'position:absolute;left:-9999px;top:0;white-space:pre';
    document.body.appendChild(s);
    const w = s.getBoundingClientRect().width / parseFloat(getComputedStyle(s).fontSize || 12);
    s.remove();
    return w < 1.85;            // 连字生效约 1.68 em；不生效则是 2 em
  }

  function joinDashes(root) {
    if (dashLig === null) dashLig = hasDashLigature();
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: n => n.parentElement.closest('.math, .katex, code, script, style, .spark')
        ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT
    });
    const nodes = []; while (w.nextNode()) nodes.push(w.currentNode);
    for (const n of nodes) {
      const v = n.nodeValue;
      const at = v.indexOf('——');
      if (at < 0) continue;
      const frag = document.createDocumentFragment();
      let last = 0, i;
      while ((i = v.indexOf('——', last)) >= 0) {
        if (i > last) frag.appendChild(document.createTextNode(v.slice(last, i)));
        const s = document.createElement('span');
        s.className = dashLig ? 'em' : 'em nj';
        s.append('—');
        const t = document.createElement('i');
        t.textContent = '—';
        s.appendChild(t);
        frag.appendChild(s);
        last = i + 2;
      }
      if (last < v.length) frag.appendChild(document.createTextNode(v.slice(last)));
      n.parentNode.replaceChild(frag, n);
    }
  }

  RS.text = { cleanText, joinDashes };
})(window.RS = window.RS || {});

// 图号引用：正文里的 [[fig:image3.png]] 排成蓝色的「图 3」。
// 编号来自本篇实际的出图顺序（figures.js 生成 figure 时登记进 state.map），
// 增删插图后引用自动跟着变。找不到就排「图 ?」并记一条 warning。
(function (RS) {
  function figrefs(text, state) {
    const w = document.createTreeWalker(text, NodeFilter.SHOW_TEXT, {
      acceptNode: n => /\[\[fig:/.test(n.nodeValue) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT
    });
    const nodes = []; while (w.nextNode()) nodes.push(w.currentNode);
    for (const n of nodes) {
      const frag = document.createDocumentFragment();
      let last = 0, m;
      const re = /\[\[fig:([^\]]+)\]\]/g;
      while ((m = re.exec(n.nodeValue))) {
        if (m.index > last) frag.appendChild(document.createTextNode(n.nodeValue.slice(last, m.index)));
        const id = m[1].trim();
        const num = state.map[id];
        const s = document.createElement('span');
        s.className = 'figref';
        s.textContent = num ? '图\u2009' + num : '图\u2009?';
        if (!num) RS.report.warnings.push('missing fig: ' + id + ' in ' + (n.parentElement.closest('[data-id]') || {}).dataset?.id);
        frag.appendChild(s);
        last = m.index + m[0].length;
      }
      if (last < n.nodeValue.length) frag.appendChild(document.createTextNode(n.nodeValue.slice(last)));
      n.parentNode.replaceChild(frag, n);
    }
  }

  RS.refs = { figrefs };
})(window.RS = window.RS || {});

// 列表拆解：Word 的有序列表常把后续整篇正文吞进同一个 <li>。
(function (RS) {
  // 「1. 韦伯——费希纳对数定律」这类短标题：编号单独成列、标题按黑体小标题排，
  // 而不是和正文一样只把数字染蓝。判定只看「去编号后是否一整句短语」，
  // 不带句读、不含公式、且能一行放下，避免把普通列表项误判成标题
  const isHeading = p => {
    const t = p.textContent.replace(/^\s*\d{1,2}\s*[.．]\s*/, '').trim();
    return t.length > 0 && t.length <= 32 && !/[，。；：、,;:]$/.test(t) && !p.querySelector('.math');
  };

  /** 拆平列表：序号做成悬挂缩进，否则「2．」会独占一行、标题和表格被裹进列表项里 */
  function unwrapLists(root) {
    root.querySelectorAll('ol,ul').forEach(list => {
      const start = parseInt(list.getAttribute('start') || '1', 10) || 1;
      const host = list.parentNode;
      [...list.children].filter(el => el.tagName === 'LI').forEach((li, i) => {
        const ps = [...li.children].filter(el => el.tagName === 'P');
        ps.forEach((p, k) => {
          if (k === 0) {
            p.classList.add('li-p');
            const m = document.createElement('span');
            m.className = 'li-n';
            m.textContent = (start + i) + '.';
            p.insertBefore(m, p.firstChild);
            // Word 的自动编号后面常跟一个「：」，与手工写的前缀重复
            const nx = m.nextSibling;
            if (nx && nx.nodeType === 3) nx.nodeValue = nx.nodeValue.replace(/^[\s\u3000]*[:：]\s*/, '');
            if (isHeading(p)) p.classList.add('fn-h');
          } else {
            p.classList.add('li-c');
          }
        });
        while (li.firstChild) host.insertBefore(li.firstChild, list);
        li.remove();
      });
      list.remove();
    });
    // 「[1]：标题」统一成「1. 标题」
    root.querySelectorAll('p').forEach(p => {
      const f = p.firstChild;
      if (!f || f.nodeType !== 3) return;
      const m = f.nodeValue.match(/^\s*[\[［]\s*(\d{1,2})\s*[\]］]\s*[:：]\s*/);
      if (!m) return;
      f.nodeValue = f.nodeValue.slice(m[0].length);
      const s = document.createElement('span');
      s.className = 'li-n';
      s.textContent = m[1] + '.';
      p.insertBefore(s, f);
      p.classList.add('li-p');
      if (isHeading(p)) p.classList.add('fn-h');
    });
  }

  RS.lists = { unwrapLists };
})(window.RS = window.RS || {});

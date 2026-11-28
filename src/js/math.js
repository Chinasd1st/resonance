// 公式：文本公式转 TeX、推导标签合并、中文说明从公式里拆出来、
// 行内分式升级、单位正体，最后交给 KaTeX。
(function (RS) {
  const CONNECTOR = /^[∵∴即则故]\s*$/;
  // 「∴式子：」「∵分子：」这类「符号 + 名词 + 冒号」也算标签，否则它会被当成正文，
  // 和旁边 ∵ / 分子： 的蓝标签长得不一样。
  // 直线：／圆：／函数：是 2-10 给公式起的名字——同样只剩标签的段落会被分页挤到栏底，
  // 并进公式行（.led）后整块带 break-inside: avoid，不会再与公式分处两栏
  const LABELS = /^(?:[∵∴即则故]\s*)?(分子|分母|式子|原式|左边|右边|由|得|所以|因此|于是|直线|圆|函数|曲线)\s*[:：]\s*$/;

  // 「∵」「∴」「即」「分子：」独占一段时，并进下一段的公式里，避免公式失去归属
  function joinConnectors(text) {
    [...text.querySelectorAll('p')].forEach(p => {
      if (p.closest('td,th')) return;
      const t = p.textContent.trim();
      if (!(CONNECTOR.test(t) || LABELS.test(t))) return;
      const nx = p.nextElementSibling;
      if (!nx || nx.tagName !== 'P' || !nx.querySelector('.math')) return;
      const lead = document.createElement('span');
      lead.className = 'lead';
      lead.textContent = t.replace(/\s+/g, '');
      nx.insertBefore(lead, nx.firstChild);
      nx.classList.add('led');
      p.remove();
    });
    // 「∵△ABH∽△HBC」这种符号与公式写在同一段里的，也拆成「符号 + 公式行」，
    // 否则符号留在页边、公式另起一段居中，和下面 ∴ / 即 的行对不齐
    [...text.querySelectorAll('p')].forEach(p => {
      if (p.closest('td,th') || p.classList.contains('led')) return;
      const first = p.firstChild;
      if (!first || first.nodeType !== 3) return;
      const m = first.nodeValue.match(/^\s*([∵∴即])\s*/);
      if (!m) return;
      const math = p.querySelector('.math');
      if (!math) return;
      const clone = p.cloneNode(true);
      clone.querySelectorAll('.math').forEach(x => x.remove());
      if (clone.textContent.replace(/^\s*[∵∴即]\s*/, '').trim()) return;   // 符号后还有别的话就不动
      first.nodeValue = first.nodeValue.replace(/^\s*[∵∴即]\s*/, '');
      const lead = document.createElement('span');
      lead.className = 'lead';
      lead.textContent = m[1];
      p.insertBefore(lead, p.firstChild);
      p.classList.add('led');
    });
    // 段首的 ∵ / ∴ 出现在纯文字句子里时（「∴将 p=0 代入极限式，得：」），
    // 也点成同一套蓝色，让整段推理的标记看起来是一个体系
    [...text.querySelectorAll('p')].forEach(p => {
      if (p.closest('td,th,figure') || p.classList.contains('led') || p.querySelector('.lead, .conn')) return;
      const first = p.firstChild;
      if (!first || first.nodeType !== 3) return;
      const m = first.nodeValue.match(/^[\s\u3000]*([∵∴])/);
      if (!m) return;
      if (!p.textContent.replace(/[∵∴]/g, '').trim()) return;   // 整段只有一个符号，留给 joinConnectors
      const s = document.createElement('span');
      s.className = 'conn';
      s.textContent = m[1];
      first.nodeValue = first.nodeValue.slice(m[0].length);
      p.insertBefore(s, first);
    });
  }

  // 源文档常把「当且仅当…」这类说明写进公式里：把中文说明从公式中拆出来，
  // 否则整句会被 KaTeX 按数学排版，字距怪异、又像是浮在版面中间的孤立公式。
  const PROSE_PUNCT = /[\u3001\u3002\uFF0C\uFF1B\uFF1A\uFF1F\uFF01]/;
  const PROSE_CH = /[\u4E00-\u9FFF\u3400-\u4DBF\uFF08\uFF09]/;
  function splitMathProse(text) {
    text.querySelectorAll('span.math').forEach(s => {
      let tex = s.textContent;
      if (!PROSE_PUNCT.test(tex)) return;          // 没中文标点 → 视为纯公式（含 x_{总} 之类）
      const cmd = tex.search(/[\\^_{}]/);
      if (cmd > 0) {                                // 前导说明文字（只取到最后一个中文标点为止）
        const head = tex.slice(0, cmd);
        let cut = 0;
        for (let i = 0; i < head.length; i++) if (/[\u3001\u3002\uFF0C\uFF1B\uFF1A\uFF08\uFF09\u4E00-\u9FFF]/.test(head[i])) cut = i + 1;
        if (cut > 0) { s.before(document.createTextNode(head.slice(0, cut))); tex = tex.slice(cut); }
        // 前面没有中文时（如 H(a,b)\leq…当且仅当…）继续往下走，按后段中文说明拆分
      }
      const m = tex.search(PROSE_CH);
      if (m === 0) { if (!/[\\{}^_]/.test(tex)) s.replaceWith(document.createTextNode(tex.trim())); return; }
      if (m > 0) {
        const head = tex.slice(0, m).trim(), tail = tex.slice(m).trim();
        s.textContent = head;
        if (tail) s.after(document.createTextNode(tail));
      }
    });
  }

  // 段内既有文字又有离心公式时，公式降为行内，整句连读。
  // 例外：公式在段首、后面只跟一句短说明（「当且仅当…时取等，其中…」）时，
  // 保留成「公式行」——整行居中、公式按 displaystyle 排，与 a=b 那条不等式链同一版式。
  function demote(text) {
    text.querySelectorAll('p').forEach(p => {
      if (p.closest('td,th')) return;
      const ms = [...p.querySelectorAll('span.math.display')];
      if (!ms.length) return;
      const probe = p.cloneNode(true);
      probe.querySelectorAll('.math').forEach(m => m.remove());
      const rest = probe.textContent.replace(/\s/g, '');
      if (rest.length < 4) return;                  // 纯公式：保持 display，独立成行
      const lead = [...p.childNodes].find(n => n.nodeType !== 3 || n.nodeValue.trim());
      if (lead === ms[0] && ms.length === 1 && rest.length <= 44) {
        p.classList.add('eq', 'fline');
        ms[0].classList.remove('display');
        ms[0].classList.add('inline', 'ds');
        // 公式行：原稿常在公式后直接跟「当且仅当…」，公式与说明之间要有一个逗号
        let nx = ms[0].nextSibling;
        while (nx && nx.nodeType !== 3) nx = nx.nextSibling;
        if (nx && /^(当|若|且|则|即|故|其中|由此|从而|于是)/.test(nx.nodeValue.trimStart())) {
          nx.nodeValue = '，' + nx.nodeValue.trimStart();
        }
        return;
      }
      ms.forEach(m => { m.classList.remove('display'); m.classList.add('inline'); });
    });
  }

  // 行内（textstyle）分式在 Chrome 打印时分子会被压到横线上：文字版的 a+b/2 里
  // 横线几乎穿过加号。把顶层的 \frac 升级为 \dfrac（分子分母回到整字号、留出空隙），
  // 嵌在括号或上下标里的分式保持原样，免得字号层层放大。
  function inlineFrac(tex) {
    let out = '', depth = 0;
    for (let i = 0; i < tex.length; i++) {
      const c = tex[i];
      if (c === '\\') {
        if (depth === 0 && tex.startsWith('\\frac', i) && !/[A-Za-z]/.test(tex[i + 5] || '')) {
          out += '\\dfrac'; i += 4; continue;
        }
        out += c + (tex[i + 1] || ''); i++; continue;
      }
      if (c === '{') depth++;
      else if (c === '}') depth = Math.max(0, depth - 1);
      out += c;
    }
    return out;
  }

  // 源稿里手打的「p＝m/(M+m)」这类纯文本公式：转成 TeX 交给 KaTeX，
  // 否则字距、斜体、分式全是错的。只处理不含中文、形态明确的串，避免误伤散文。
  function plainToTex(s, frac = true) {
    let t = s.replace(/＝/g, '=').replace(/′/g, "'").replace(/²/g, '^2').replace(/³/g, '^3');
    // 行文中的「1/x」保留斜杠更紧凑；独立公式才排成上下两层的分式
    if (frac) t = t.replace(/([A-Za-z0-9()^']+)\s*\/\s*(\([^()]*\)(?:\^?\d)?|[A-Za-z0-9^']+)/g, '\\frac{$1}{$2}');
    return t;
  }
  function plainMath(text) {
    const onlyFormula = /^[A-Za-z0-9'′()=＝/().+\-²³\s]+$/;
    [...text.querySelectorAll('p')].forEach(p => {
      if (p.closest('td,th') || p.querySelector('.math, img, .katex')) return;
      const t = p.textContent.trim();
      if (!t || t.length > 42 || /[\u4e00-\u9fff]/.test(t)) return;
      if (!/[=＝]/.test(t) || !/[A-Za-z]/.test(t) || !onlyFormula.test(t)) return;
      const s = document.createElement('span');
      s.className = 'math display';
      s.textContent = plainToTex(t);
      p.textContent = '';
      p.appendChild(s);
      p.classList.add('eq', 'noindent');
    });
    // 正文里夹着的「f(x)＝1/x」：只认「字母(参数)＝…」这种带函数记号的形状
    const inline = /([A-Za-z][A-Za-z0-9'′]*\([A-Za-z0-9,\s]*\)\s*[=＝]\s*[A-Za-z0-9/().+\-²³]+)/g;
    const w = document.createTreeWalker(text, NodeFilter.SHOW_TEXT, {
      acceptNode: n => n.parentElement.closest('.math, .katex, code, td, th') ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT
    });
    const nodes = []; while (w.nextNode()) nodes.push(w.currentNode);
    for (const n of nodes) {
      const v = n.nodeValue;
      if (!/[=＝]/.test(v) || !/[A-Za-z]/.test(v)) continue;
      let last = 0, m, out = null;
      inline.lastIndex = 0;
      while ((m = inline.exec(v))) {
        out = out || document.createDocumentFragment();
        if (m.index > last) out.appendChild(document.createTextNode(v.slice(last, m.index)));
        const s = document.createElement('span');
        s.className = 'math inline';
        s.dataset.plain = '1';        // 行文中的小分式，保持 textstyle，不要升成 \dfrac
        s.textContent = plainToTex(m[1], false);
        out.appendChild(s);
        last = m.index + m[0].length;
      }
      if (out) {
        if (last < v.length) out.appendChild(document.createTextNode(v.slice(last)));
        n.parentNode.replaceChild(out, n);
      }
    }
  }

  // 单位必须正体：源稿写成 \ m/s、\ m，KaTeX 会按变量排成斜体
  const UNITS = /(\\[ ,;]|\\quad\s*)((?:km|dm|cm|mm|nm|kg|mg|mol|mL|kHz|MHz|kPa|MPa|kJ|kW|Hz|Pa|J|W|N|K|V|A|m|s|h|g|L)(?:\s*\/\s*(?:s|h|min|m|mol|L|kg))?(?:\^[23])?)(?![A-Za-z0-9])/g;
  function uprightUnits(tex) {
    return tex.replace(UNITS, (all, sp, u) => sp + '\\mathrm{' + u.replace(/\s+/g, '') + '}');
  }

  function math(text) {
    plainMath(text);
    joinConnectors(text);
    splitMathProse(text);
    demote(text);
    text.querySelectorAll('span.math').forEach(s => {
      const tex = s.textContent;
      // 表格里的裸数字是数据，不是公式：留作文本，跟表内字体一致。
      // 正文里的则必须交给 KaTeX——否则「−1、1、2」这种会掉回正文字体，
      // 跟前后 p = -1 的字形对不上
      if (s.closest('td,th') && /^[-+]?\d+(?:\.\d+)?$/.test(tex.trim())) { s.replaceWith(document.createTextNode(tex.trim())); return; }
      const inCell = !!s.closest('td,th');
      const display = s.classList.contains('display') && !inCell;
      // ds：公式行里的公式——行内排但按 displaystyle 取大号分式
      const source = display ? tex : (s.classList.contains('ds') ? '\\displaystyle ' + inlineFrac(tex) : (s.dataset.plain ? tex : inlineFrac(tex)));
      try {
        katex.render(uprightUnits(source), s, { displayMode: display, throwOnError: false, strict: 'ignore', output: 'html' });
        RS.report.math++;
      } catch (e) { RS.report.mathErrors.push(tex); }
      if (s.querySelector('.katex-error')) RS.report.mathErrors.push(tex);
    });
    text.querySelectorAll('p').forEach(p => {
      const clone = p.cloneNode(true); clone.querySelectorAll('.math').forEach(m => m.remove());
      if (p.querySelector('.math.display') && !p.closest('td,th') && !p.classList.contains('led') && clone.textContent.trim().length < 40) p.classList.add('eq');
    });
    // 紧跟在「∴ / 即」行后面的那条无标签公式（推导的收尾），跟着公式列走，不单独居中；
    // 连续几条公式（一列推导链）也统一左对齐，避免每条各自居中、等号来回跳
    text.querySelectorAll('p.eq').forEach(p => {
      const pv = p.previousElementSibling;
      if (pv && pv.tagName === 'P' && pv.classList.contains('led')) p.classList.add('cont');
      // 「∴式子：」「分子：」这类以冒号收尾的引出句，后面那条公式跟着它缩进
      if (pv && pv.tagName === 'P' && !pv.classList.contains('eq')
          && /[：:]\s*$/.test(pv.textContent.trim()) && pv.textContent.trim().length <= 14) {
        p.classList.add('cont');
      }
      if (pv && pv.tagName === 'P' && (pv.classList.contains('eq') || pv.classList.contains('led'))) p.classList.add('chain');
    });
  }

  RS.math = { math };
})(window.RS = window.RS || {});

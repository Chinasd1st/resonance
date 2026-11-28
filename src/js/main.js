// 运行时排版的主流程：在 Chrome 里把 <template class="raw"> 里的 pandoc 片段
// 变成排好版的正文，然后置 window.__ready。build.mjs 等这个标记再打印。
//
// 顺序即版式：先结构（列表、标题、注释），再图（编号要给后面的图号引用用），
// 再文本清理与标点，最后公式（KaTeX 量大，放后面让前面的度量先稳定）。
(function (RS) {
  document.querySelectorAll('section.article').forEach(sec => {
    const tpl = sec.querySelector('template.raw');
    const raw = document.createElement('div'); raw.dataset.id = sec.dataset.id;
    raw.appendChild(tpl.content.cloneNode(true));
    RS.dom.unwrapDivs(raw);
    RS.lists.unwrapLists(raw);
    RS.structure.stripHead(raw, JSON.parse(sec.dataset.strip || '[]'));
    const text = sec.querySelector('.text');
    while (raw.firstChild) text.appendChild(raw.firstChild);
    tpl.remove();
    const state = { fig: 0, map: {} };
    RS.figures.figures(text, state, sec.classList.contains('single'));
    RS.refs.figrefs(text, state);
    RS.structure.structure(text, sec.dataset.form);
    RS.text.cleanText(text);
    RS.tables.tables(text);
    RS.math.math(text);
    // endnotes of a poem/lyric must not inherit the verse column: pull them back to the body margin
    if (sec.classList.contains('verse')) {
      const nb = text.querySelector('.notes');
      if (nb) text.after(nb);
    }
  });

  window.__report = RS.report;
  document.fonts.ready.then(() => {
    // 破折号要按真实字体量宽度（连字是否被应用），所以放到字体就绪之后
    RS.text.joinDashes(document.body);
    document.querySelectorAll('section.article .text').forEach(text => RS.equations.fitEq(text));
    RS.report.scrollWidth = document.documentElement.scrollWidth;
    RS.report.clientWidth = document.documentElement.clientWidth;
    window.__ready = true;
  });
})(window.RS = window.RS || {});

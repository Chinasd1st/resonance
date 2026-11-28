// DOM 结构改造的小工具：换标签名、拆掉 Word 的样式包装层。
(function (RS) {
  /** 换成另一个标签，属性与子节点原样保留 */
  function renameEl(el, tag) {
    const n = document.createElement(tag);
    for (const a of el.attributes) n.setAttribute(a.name, a.value);
    while (el.firstChild) n.appendChild(el.firstChild);
    el.replaceWith(n);
    return n;
  }

  /** Word 会给每段套 div/span[data-custom-style]，只剩结构价值，拆掉 */
  function unwrapDivs(root) {
    root.querySelectorAll('div[data-custom-style]').forEach(d => d.replaceWith(...d.childNodes));
    root.querySelectorAll('span[data-custom-style]').forEach(s => s.replaceWith(...s.childNodes));
  }

  RS.dom = { renameEl, unwrapDivs };
})(window.RS = window.RS || {});

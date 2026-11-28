// 表格：去掉 pandoc 带来的宽度样式，外包一层 .tbl；列数 ≥ 5 的按通栏排。
(function (RS) {
  function tables(text) {
    text.querySelectorAll('table').forEach(t => {
      t.removeAttribute('style'); t.querySelectorAll('col').forEach(c => c.removeAttribute('style'));
      const cols = t.querySelector('tr') ? t.querySelector('tr').children.length : 0;
      const wrap = document.createElement('div'); wrap.className = 'tbl' + (cols >= 5 ? ' wide' : '');
      t.before(wrap); wrap.appendChild(t); RS.report.tables++;
    });
  }

  RS.tables = { tables };
})(window.RS = window.RS || {});

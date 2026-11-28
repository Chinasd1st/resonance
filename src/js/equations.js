// 超宽公式收边：独立公式撑破栏宽会让 Chrome 在打印时把整本缩小以「适应页面」。
// 规则：先缩到 0.8 倍；仍放不下就改为通栏（column-span: all）。
(function (RS) {
  function fitEq(text) {
    text.querySelectorAll('p.eq, p.led').forEach(p => {
      // 公式卡（2-8）里的对齐块必须留在栏内：一旦转成通栏，卡片会被拆成两瓣
      if (p.closest('figure.trigcard')) return;
      const k = p.querySelector('.katex-display > .katex') || p.querySelector('.katex');
      if (!k) return;
      // 行间公式的 .katex 是块级、宽度恒等于栏宽，矩形量到的永远“刚好放得下”；
      // 真正的内容宽度要看 scrollWidth，否则超宽公式会被页边直接裁掉
      const width = () => Math.max(k.scrollWidth, Math.round(k.getBoundingClientRect().width));
      const cs = getComputedStyle(p);
      const pad = (parseFloat(cs.paddingLeft) || 0) + (parseFloat(cs.paddingRight) || 0);
      // led 行里标签与公式是一个整体（都居中），宽公式要连标签一起算进去才不会顶出栏外
      const lead = p.querySelector('.lead');
      const gut = p.classList.contains('led') && lead
        ? Math.ceil(lead.getBoundingClientRect().width) + 12 : 0;
      let avail = p.clientWidth - pad - 2 * gut - 1;
      let w = width();
      // 缩进（cont / chain）把可用宽度挤窄了，但整幅放得下：
      // 差得不多（缩 10% 以内）就保留对齐、稍收字号；差太多才退回整幅，别把公式压小
      if (w > avail + 0.5 && (p.classList.contains('cont') || p.classList.contains('chain'))
          && w <= p.clientWidth - 1 && avail / w < 0.9) {
        p.classList.remove('cont', 'chain');
        return;
      }
      if (w <= avail) return;
      const s = Math.max(0.8, avail / w);
      k.style.fontSize = (1.05 * s).toFixed(3) + 'em';
      w = width();
      if (w > avail) {
        p.classList.add('wide');
        avail = p.clientWidth - pad - 2 * gut - 1;
        w = width();
        if (w > avail) k.style.fontSize = (1.05 * avail / w).toFixed(3) + 'em';
        RS.report.warnings.push('wide eq: ' + (p.closest('[data-id]') ? p.closest('[data-id]').dataset.id : ''));
      }
    });
  }

  RS.equations = { fitEq };
})(window.RS = window.RS || {});

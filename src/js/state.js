// 共享状态与常量。页面走 file://，Chrome 不允许 ES module，所以这些模块是
// 顺序加载的经典脚本，各自只往 window.RS 挂一个成员。
//
// RS.report 是 build.mjs 读回去的运行时报告：warnings / math / mathErrors / images / tables。
// 每次构建验收都看它（见 AGENTS.md §7）。
(function (RS) {
  RS.report = { warnings: [], math: 0, mathErrors: [], images: 0, tables: 0 };

  // 汉字与全角标点的码位区间；cleanText 用来吸掉汉字与西文之间的空格
  RS.CJK = '\u2E80-\u2FFF\u3000-\u303F\u3040-\u30FF\u3400-\u4DBF\u4E00-\u9FFF\uF900-\uFAFF\uFF00-\uFFEF';

  /** 归一化标题行，用于和 manifest 的 strip_lines 比对 */
  RS.norm = s => (s || '').replace(/[#*\s\u3000\u00a0《》〈〉]/g, '').replace(/^——/, '');
})(window.RS = window.RS || {});

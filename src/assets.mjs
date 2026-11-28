// src/ 的加载清单：book.html 与 overlay.html 都从这里取，顺序即依赖顺序。
//
// CSS 靠层叠，所以顺序必须等于「基础 → 版块 → 例外」：
//   tokens/fonts → base → 序言页 → 文章 → 公式 → 图 → 表 → 注 → 篇目跨页
// JS 是经典脚本（页面走 file://，Chrome 拒绝加载 ES module），每个文件只往 window.RS 挂一个成员。

export const BOOK_CSS = [
  'tokens.css',
  'fonts.css',
  'base.css',
  'frontmatter.css',
  'article.css',
  'math.css',
  'figures.css',
  'tables.css',
  'notes.css',
  'art/base.css',
  'art/1-1-night.css',
  'art/1-2-fog.css',
  'art/1-3-mist.css',
  'art/1-4-beast.css',
  'art/1-5-shaft.css',
  'art/1-6-swiss.css',
  'art/1-7-moon.css',
  'art/1-8-years.css',
];

export const OVERLAY_CSS = [
  'tokens.css',
  'fonts.css',
  'chapter.css',
  'overlay.css',
  'art/base.css',
  'art/1-1-night.css',
  'art/1-2-fog.css',
  'art/1-3-mist.css',
  'art/1-4-beast.css',
  'art/1-5-shaft.css',
  'art/1-6-swiss.css',
  'art/1-7-moon.css',
  'art/1-8-years.css',
];

/** 运行时排版的执行顺序：state 最先，main 最后 */
export const TRANSFORM_JS = [
  'state.js',
  'dom.js',
  'text.js',
  'lists.js',
  'structure.js',
  'figures.js',
  'refs.js',
  'tables.js',
  'math.js',
  'equations.js',
  'main.js',
];

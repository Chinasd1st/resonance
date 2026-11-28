// 把序言页、章扉页、各篇正文装订成 book.html。
// 样式与运行时脚本的清单在 src/assets.mjs —— 加一个 CSS 分区或 JS 模块，只改那一处。
import { cssLinks, jsTags } from '../lib/html.mjs';
import { BOOK_CSS, TRANSFORM_JS } from '../../src/assets.mjs';
import { frontMatter } from './frontmatter.mjs';
import { chapterOpener } from './chapter.mjs';
import { article } from './article.mjs';

export function bookHtml(rendered, all) {
  const chs = [...new Set(rendered.map(a => a.ch))];
  let body = frontMatter(all);
  for (const ch of chs) {
    body += chapterOpener(ch);
    for (const a of rendered.filter(x => x.ch === ch)) body += article(a, all);
  }
  return `<!doctype html><html lang="zh-Hans"><head><meta charset="utf-8">
${cssLinks(['~../node_modules/katex/dist/katex.min.css', ...BOOK_CSS])}
<script src="../node_modules/katex/dist/katex.min.js"></script>
</head><body>${body}
${jsTags(TRANSFORM_JS)}</body></html>`;
}

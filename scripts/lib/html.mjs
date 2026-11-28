// HTML 拼装的小工具：转义、补零、按清单注入样式与脚本。
import path from 'node:path';

export const esc = s => (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;')
  .replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export const pad = n => String(n).padStart(2, '0');

/** build/*.html 到 src/css 的相对前缀（两个页面都在 build/ 下） */
const SRC_PREFIX = { css: '../src/css/', js: '../src/js/' };

export const cssLinks = list => list
  .map(f => `<link rel="stylesheet" href="${f.startsWith('~') ? f.slice(1) : SRC_PREFIX.css + f}">`)
  .join('\n');

export const jsTags = list => list
  .map(f => `<script src="${f.startsWith('~') ? f.slice(1) : SRC_PREFIX.js + f}"></script>`)
  .join('\n');

/** 相对构建根（build/）的路径，用于 overlay 里的 <img src="chapters/…"> 之类 */
export const rel = (fromDir, p) => path.relative(fromDir, p).replace(/\\/g, '/');

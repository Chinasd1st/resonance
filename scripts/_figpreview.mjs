// 仅用于目检：逐张渲染 figures.mjs 的 SVG，输出 build/_fig-<key>.png
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright-core';
import { FIGURES } from './figures.mjs';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..');
const B = p => path.join(ROOT, 'build', p);
const CHROME = process.env.CHROME || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const entries = Object.entries(FIGURES);
const cells = entries.map(([k, fn], i) => {
  const f = fn();
  return `<figure id="f${i}"><figcaption>${k}　${f.vw}×${f.vh}pt</figcaption>
  <svg viewBox="0 0 ${f.vw} ${f.vh}" style="width:${f.vw * 2}pt;height:${f.vh * 2}pt">${f.body}</svg></figure>`;
}).join('\n');

const html = `<!doctype html><meta charset="utf-8">
<style>
  @font-face { font-family: "SHS"; src: url("../fonts/SourceHanSansSC-Regular.otf"); font-weight: 400; }
  @font-face { font-family: "SHS"; src: url("../fonts/SourceHanSansSC-Bold.otf"); font-weight: 700; }
  body { margin: 0; padding: 10pt; background: #fff; font: 400 8pt/1.4 sans-serif; color: #1D1D1B; width: 900pt; }
  figure { margin: 0 0 10pt; }
  figcaption { font-size: 6pt; color: #56657F; margin-bottom: 2pt; }
  svg { display: block; }
</style>
${cells}`;

fs.writeFileSync(B('_figpreview.html'), html);
const browser = await chromium.launch({ executablePath: CHROME });
const page = await browser.newPage({ viewport: { width: 1200, height: 1000 }, deviceScaleFactor: 3 });
await page.goto('file://' + B('_figpreview.html').replace(/\\/g, '/'));
await page.waitForTimeout(700);
for (let i = 0; i < entries.length; i++) {
  const name = entries[i][0].replace(/[\/.]/g, '-');
  await page.locator('#f' + i).screenshot({ path: B(`_fig-${name}.png`) });
}
await browser.close();
console.log('ok', entries.length);

import { chromium } from 'playwright-core';
const CHROME = 'C://Program Files\\Google\\Chrome\\Application\\chrome.exe';
const b = await chromium.launch({ executablePath: CHROME });
const p = await b.newPage();
await p.goto('file:///C:/Users/omen/Desktop/Documents/Printing/Resonance/build/book.html');
await p.waitForFunction(() => window.__ready === true, null, { timeout: 120000 });
const out = await p.evaluate(() => {
  const pt = v => +(v * 72 / 96).toFixed(2);
  const rows = [];
  for (const it of document.querySelectorAll('.toc-item')) {
    const n = it.querySelector('.n'), t = it.querySelector('.t');
    const ir = it.getBoundingClientRect(), nr = n.getBoundingClientRect(), tr = t.getBoundingClientRect();
    rows.push({
      s: n.textContent.trim(),
      by: t.querySelector('small') ? 1 : 0,
      iMid: pt((ir.top + ir.bottom) / 2), nMid: pt((nr.top + nr.bottom) / 2),
      tMid: pt((tr.top + tr.bottom) / 2),
      h: pt(ir.height),
    });
  }
  return rows;
});
console.log('seq by itemH  itemMid  numMid  titleMid   num-item  num-title');
for (const r of out)
  console.log(`${r.s}   ${r.by}  ${r.h}  ${r.iMid}  ${r.nMid}  ${r.tMid}   ${(r.nMid - r.iMid).toFixed(2)}   ${(r.nMid - r.tMid).toFixed(2)}`);
await b.close();

// Chrome 打印。整条链路的分页、字体光栅、preferCSSPageSize 都由系统 Chrome 决定，
// 所以这里只负责「起浏览器 / 打开页面 / 等排版完成 / 出 PDF」，不掺业务。
import { chromium } from 'playwright-core';
import { CHROME, fileUrl } from './path.mjs';

/** 正文层的打印参数：带书签（outline）与 tagged，交付版 PDF 要能导航 */
export const BOOK_PDF = { preferCSSPageSize: true, printBackground: true, outline: true, tagged: true };

export async function launchChrome() {
  const browser = await chromium.launch({ executablePath: CHROME, headless: true });
  console.log('chrome', browser.version());
  return browser;
}

/**
 * 打开 book.html 并等到运行时排版结束（src/js/main.js 在字体就绪后置 window.__ready）。
 * 返回 page 与运行时报告（warnings / math / mathErrors / images / tables / 文档宽）。
 */
export async function openBook(browser, htmlPath) {
  const page = await browser.newPage();
  page.on('console', m => { if (m.type() === 'error') console.log('[page]', m.text()); });
  await page.goto(fileUrl(htmlPath));
  await page.waitForFunction(() => window.__ready === true, null, { timeout: 120000 });
  return { page, report: await page.evaluate(() => window.__report) };
}

/** 不含运行时排版的页面（overlay、水印）：等到字体就绪即可 */
export async function printHtml(browser, htmlPath, pdfPath, opts = {}) {
  const page = await browser.newPage();
  await page.goto(fileUrl(htmlPath));
  await page.evaluate(() => document.fonts.ready);
  await page.pdf({ preferCSSPageSize: true, printBackground: true, ...opts, path: pdfPath });
  await page.close();
}

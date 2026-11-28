// 只看不建：把**已有**的 dist PDF 里的指定页渲成 PNG，供目检。
//
// usage: npm run shot -- 4 14 18 [--pdf=cmyk] [--scale=3]
//   --pdf   默认 screen；也可写 print / cmyk / demo，或给任意 pdf 路径
//   --scale 渲染倍率，默认 3（≈ 216 dpi，够看版式；要查 0.25 pt 的线用 6）
//
// 输出的 PNG 落在 build/shots/p<页码>.png，脚本会把绝对路径打出来。
// 这一步不碰构建：不打印、不合层、不重算底图，秒级返回。
import fs from 'node:fs';
import { B, DIST, ROOT } from '../lib/path.mjs';
import { py } from '../lib/run.mjs';
import { argv, opt } from '../lib/cli.mjs';

const ALIAS = {
  screen: 'resonance-screen.pdf',
  print: 'resonance-print-rgb.pdf',
  cmyk: 'resonance-print-cmyk.pdf',
  demo: 'resonance-demo.pdf',
};

const pages = argv.filter(a => /^\d+$/.test(a)).map(Number);
if (!pages.length) {
  console.error('用法：npm run shot -- 4 14 18 [--pdf=cmyk] [--scale=3]');
  process.exit(1);
}

const want = opt('pdf', 'screen');
const pdf = ALIAS[want] ? DIST(ALIAS[want]) : (want.includes('/') || want.includes('\\') ? want : DIST(want));
if (!fs.existsSync(pdf)) {
  console.error(`找不到 ${pdf}，先构建一次`);
  process.exit(1);
}

const scale = Number(opt('scale', '3'));
const out = B('shots');
fs.mkdirSync(out, { recursive: true });

const CODE = `
import sys, os
import pypdfium2 as pdfium
pdf, out, scale, *pages = sys.argv[1:]
doc = pdfium.PdfDocument(pdf)
n = len(doc)
bad = [p for p in map(int, pages) if p < 1 or p > n]
if bad:
    sys.exit(f'页码越界：{bad}（共 {n} 页）')
for p in map(int, pages):
    path = os.path.join(out, f'p{p:02d}.png')
    doc[p-1].render(scale=float(scale)).to_pil().save(path)
    print(os.path.abspath(path))
print(f'{os.path.basename(pdf)} · {n} 页', file=sys.stderr)
`;

process.stdout.write(py(['-c', CODE, pdf, out, String(scale), ...pages.map(String)], { cwd: ROOT }));

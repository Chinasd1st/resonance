// 付印版：把 RGB 印刷稿转成 DeviceCMYK，并挂上 OutputIntent（印厂据此还原颜色）
// 输出 dist/resonance-print-cmyk.pdf
//
// usage:
//   node scripts/build-cmyk.mjs                 转换并写 OutputIntent
//   node scripts/build-cmyk.mjs --open          完成后打开
//   node scripts/build-cmyk.mjs --icc=icc/xxx.icc   指定目标 ICC
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { ROOT, DIST, GS } from './lib/path.mjs';
import { py } from './lib/run.mjs';
import { flag, opt } from './lib/cli.mjs';

const SRC = DIST('resonance-print-rgb.pdf');
const OUT = DIST('resonance-print-cmyk.pdf');
const ICC = path.resolve(ROOT, opt('icc', 'icc/gs_default_cmyk.icc'));

if (!fs.existsSync(SRC)) {
  console.error(`缺少 ${path.relative(ROOT, SRC)}：先运行 node scripts/build.mjs`);
  process.exit(1);
}
if (!fs.existsSync(ICC)) {
  console.error(`找不到 ICC：${ICC}`);
  process.exit(1);
}

// ---------- 1. Ghostscript：RGB → DeviceCMYK ----------
// 必须 -dNOSAFER：SAFER 下 pdfwrite 读不到自身临时目录，最后一页会以
// "/undefined in --runpdf--" 失败（Skia 生成的 PDF 里有个别不规范对象）
console.log('转换 CMYK…');
execFileSync(GS, [
  '-dNOSAFER', '-dNOPAUSE', '-dBATCH', '-dQUIET',
  '-sDEVICE=pdfwrite',
  '-dPDFSETTINGS=/prepress',
  '-sColorConversionStrategy=CMYK',
  '-sProcessColorModel=DeviceCMYK',
  `-sOutputICCProfile=${ICC.replace(/\\/g, '/')}`,
  '-dEmbedAllFonts=true',
  '-dSubsetFonts=true',
  '-dAutoRotatePages=/None',
  `-sOutputFile=${OUT.replace(/\\/g, '/')}`,
  SRC.replace(/\\/g, '/'),
], { cwd: ROOT, stdio: 'inherit' });

// ---------- 2. 挂 OutputIntent（嵌入同一份 ICC）----------
const ATTACH = `
import sys
from pypdf import PdfReader, PdfWriter
from pypdf.generic import (ArrayObject, DictionaryObject, NameObject, NumberObject,
                           RectangleObject, StreamObject, TextStringObject)

pdf, icc, out, cond = sys.argv[1:5]
w = PdfWriter(clone_from=pdf)

raw = open(icc, 'rb').read()
prof = StreamObject()
prof.set_data(raw)
prof[NameObject('/N')] = NumberObject(4)
prof[NameObject('/Alternate')] = NameObject('/DeviceCMYK')
prof.flate_encode()
prof_ref = w._add_object(prof)

intent = DictionaryObject({
    NameObject('/Type'): NameObject('/OutputIntent'),
    NameObject('/S'): NameObject('/GTS_PDFX'),
    NameObject('/OutputCondition'): TextStringObject(cond),
    NameObject('/OutputConditionIdentifier'): TextStringObject(cond),
    NameObject('/RegistryName'): TextStringObject('http://www.color.org'),
    NameObject('/Info'): TextStringObject('Resonance print master'),
    NameObject('/DestOutputProfile'): prof_ref,
})
w._root_object[NameObject('/OutputIntents')] = ArrayObject([w._add_object(intent)])

# 出血 3mm：TrimBox 从页面内缩，BleedBox = 页面
for pg in w.pages:
    box = [float(v) for v in pg.mediabox]
    bleed = 3 / 25.4 * 72
    pg.trimbox = RectangleObject([box[0] + bleed, box[1] + bleed, box[2] - bleed, box[3] - bleed])
    pg.bleedbox = RectangleObject(box)
    pg.cropbox = RectangleObject(box)

with open(out, 'wb') as f:
    w.write(f)
print(len(w.pages))
`;

const condName = path.basename(ICC, '.icc').replace(/_/g, ' ');
const pages = py(['-c', ATTACH, OUT, ICC, OUT, condName]).trim();
console.log(`写好 ${path.relative(ROOT, OUT)}（${pages} 页，${(fs.statSync(OUT).size / 1048576).toFixed(1)} MB，ICC=${path.relative(ROOT, ICC)}）`);

if (flag('open')) {
  try { execFileSync('cmd', ['/c', 'start', '', OUT], { cwd: ROOT }); } catch { /* ignore */ }
}

// pandoc 的 docx 读取器只搬段落文本与行内样式，**丢掉了段落对齐（jc）、首行缩进（ind）
// 与段前/段后距**。1-9 的原稿把诗行、书信落款都设成居中/右缩进，段距还标了 12 pt；
// 这些在 HTML 里一点痕迹都没有，于是诗和散文一样首行缩进两字、左对齐。
// 这里直接从 docx 的 word/document.xml 把这几类属性取回来，按「去掉全部空白的正文」
// 作键，装配时打到对应的 <p> 上。
//
// 认三类：
//   jc=center            → data-jc="center"（诗行、题记、信尾）
//   jc=right/end         → data-jc="right"
//   首行缩进 ≥10 字       → data-jc="right"（落款与阶梯行：原稿靠大缩进排到右侧）
//   连续 ≥4 段无 w:ind    → data-ind="flush"（整段齐左的书信，不套正文两字缩进）
//   段前/段后 ≥12 pt      → data-gap（装配时按 15 pt 基线取整）
import fs from 'node:fs';
import zlib from 'node:zlib';

/** 读 zip 里单个条目：走中央目录，只为取 document.xml，不引第三方依赖 */
function entry(buf, name) {
  let eocd = -1;
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 65558); i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd < 0) throw new Error('不是 zip 包');
  const count = buf.readUInt16LE(eocd + 10);
  let off = buf.readUInt32LE(eocd + 16);
  for (let i = 0; i < count; i++) {
    if (buf.readUInt32LE(off) !== 0x02014b50) throw new Error('中央目录损坏');
    const method = buf.readUInt16LE(off + 10);
    const csize = buf.readUInt32LE(off + 20);
    const nlen = buf.readUInt16LE(off + 28);
    const xlen = buf.readUInt16LE(off + 30);
    const clen = buf.readUInt32LE(off + 32);
    const lho = buf.readUInt32LE(off + 42);
    const fname = buf.toString('utf8', off + 46, off + 46 + nlen);
    if (fname === name) {
      if (buf.readUInt32LE(lho) !== 0x04034b50) throw new Error('本地头损坏');
      const lnlen = buf.readUInt16LE(lho + 26);
      const lxlen = buf.readUInt16LE(lho + 28);
      const start = lho + 30 + lnlen + lxlen;
      const data = buf.subarray(start, start + csize);
      return method === 0 ? data : zlib.inflateRawSync(data);
    }
    off += 46 + nlen + xlen + clen;
  }
  throw new Error('包里没有 ' + name);
}

const norm = s => s.replace(/[\s\u3000\u00a0]+/g, '');

/**
 * docx 段落 → { jc: Map<正文, 'center'|'right'>, gap: Map<正文, pt>, ind: Map<正文, 'flush'> }
 * 正文完全相同的段落在 1-9 里没有格式冲突（重复的都是同一组诗行），所以按文本作键够用。
 */
export function paraTags(docPath) {
  const xml = entry(fs.readFileSync(docPath), 'word/document.xml').toString('utf8');
  const jc = new Map();
  const gap = new Map();
  const ind = new Map();
  const items = [];
  for (const m of xml.matchAll(/<w:p\s[\s\S]*?<\/w:p>/g)) {
    const chunk = m[0];
    const text = norm([...chunk.matchAll(/<w:t[^>]*>([\s\S]*?)<\/w:t>/g)].map(x => x[1]).join(''));
    if (!text) continue;
    const ppr = (chunk.match(/<w:pPr>[\s\S]*?<\/w:pPr>/) || [''])[0];
    const j = (ppr.match(/<w:jc w:val="([^"]+)"/) || [])[1];
    const before = (ppr.match(/w:before="(\d+)"/) || [])[1] | 0;
    const after = (ppr.match(/w:after="(\d+)"/) || [])[1] | 0;
    const pt = Math.round(Math.max(before, after) / 20);
    if (pt >= 12) gap.set(text, pt);

    const ind0 = (ppr.match(/<w:ind [^>]*\/>/) || [''])[0];
    const fc = (ind0.match(/w:firstLineChars="(\d+)"/) || [])[1] | 0;
    const fl = (ind0.match(/w:firstLine="(\d+)"/) || [])[1] | 0;
    // 首行缩进 ≥10 字 ≈ 96 pt：Word 里这是把短行（落款、「——当我再次…」）推到右侧的手法
    if (j === 'right' || j === 'end' || fc >= 1000 || fl >= 5000) jc.set(text, 'right');
    else if (j === 'center') jc.set(text, 'center');
    items.push({ text, hasInd: !!ind0, tagged: jc.has(text) });
  }

  // 整段齐左的书信：连续 ≥4 段都没有 <w:ind>，原稿本就不缩进（正文段都显式写了 2 字）
  for (let i = 0; i < items.length;) {
    if (items[i].hasInd || items[i].tagged) { i++; continue; }
    let k = i;
    while (k < items.length && !items[k].hasInd && !items[k].tagged) k++;
    if (k - i >= 4) for (let n = i; n < k; n++) ind.set(items[n].text, 'flush');
    i = k;
  }
  // 「番外一：」这类短标签：原稿不缩进，即便只有一段也齐左（与上面的书信块同一条边）
  for (const it of items) {
    if (!it.hasInd && !it.tagged && it.text.length <= 10 && /[：:]$/.test(it.text)) ind.set(it.text, 'flush');
  }
  return { jc, gap, ind };
}

// HTML 一侧的同一把尺子：去标签、还原实体、去空白
const plain = s => norm(s.replace(/<[^>]+>/g, '')
  .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<')
  .replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'"));

/**
 * 在装配出的 HTML 片段上打标记：data-jc="center|right"、data-gap="12|24"、data-ind="flush"
 * 找不到对应段落的（含公式的段、被补丁改写过的段）原样放过，不影响现有版式。
 */
export function tagParagraphs(frag, docPath) {
  if (!docPath || !fs.existsSync(docPath)) return frag;
  const { jc, gap, ind } = paraTags(docPath);
  if (!jc.size && !gap.size && !ind.size) return frag;
  return frag.replace(/<p(\s[^>]*)?>([\s\S]*?)<\/p>/g, (all, attrs = '', inner) => {
    const t = plain(inner);
    const a = jc.get(t);
    const g = gap.get(t);
    const f = ind.get(t);
    if (!a && !g && !f) return all;
    const extra = (a ? ` data-jc="${a}"` : '')
      + (g ? ` data-gap="${g}"` : '')
      + (f ? ` data-ind="${f}"` : '');
    return `<p${attrs}${extra}>${inner}</p>`;
  });
}

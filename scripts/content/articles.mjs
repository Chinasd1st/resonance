// 稿件簿：content/manifest.json（人工维护的元数据）+ docs/ 里的 docx 文件名。
// 输出的 articles[] 是后续所有装配的唯一数据源：章、序、社团、字体族、是否诗体。
import fs from 'node:fs';
import path from 'node:path';
import { at } from '../lib/path.mjs';
import { OVERRIDE } from '../config/issue.mjs';

/** docx 文件名里的「（征稿 数音）」→ 社团列表；认不出就归入校外征稿 */
export function clubsFromTag(tag) {
  const t = tag.replace('征稿', '').trim();
  const out = [];
  if (/歌词/.test(t)) out.push('music');
  for (const ch of t.replace('歌词', '')) {
    if (ch === '数') out.push('math'); else if (ch === '化') out.push('chem');
    else if (ch === '音') out.push('music'); else if (ch === '哲') out.push('philo');
    else if (ch === '新' || ch === '闻') { if (!out.includes('news')) out.push('news'); }
  }
  return out.length ? out : ['open'];
}

/**
 * @param {{only?: string[]|null}} opts  only = --only 的篇号，只排这几篇（页序会变）
 * @returns {{all: object[], rendered: object[]}}
 */
export function loadArticles({ only = null } = {}) {
  const manifest = JSON.parse(fs.readFileSync(at('content', 'manifest.json'), 'utf8'));
  const docx = fs.readdirSync(at('docs')).filter(f => f.endsWith('.docx'));

  const all = manifest.map(m => {
    const f = docx.find(d => d.startsWith(m.id + '_'));
    if (!f) throw new Error(`docs/ 里找不到 ${m.id}_ 开头的 docx（manifest 有这条，稿子不在）`);
    const tag = (f.match(/_（(.+?)）/) || [, '征稿'])[1];
    const [ch, seq] = m.id.split('-').map(Number);
    const ov = OVERRIDE[m.id] || {};
    const clubs = ov.clubs || clubsFromTag(tag);
    const serif = ov.font ? ov.font === 'serif' : m.form !== 'essay';
    return { ...m, ch, seq, tag, clubs, serif, verse: m.form === 'poem' || m.form === 'lyrics', docx: at('docs', f) };
  }).sort((a, b) => a.ch - b.ch || a.seq - b.seq);

  return { all, rendered: only ? all.filter(a => only.includes(a.id)) : all };
}

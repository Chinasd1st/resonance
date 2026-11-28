// 序言页 i–v：半扉、宣言、正扉页、版权页、目录。
// 页码不在正文层写死——目录页码由 build.mjs 第二遍打印前回填（.pn[data-target]）。
import { CHAPTERS, CLUBS, ISSUE, COPY, clubVar } from '../config/issue.mjs';
import { TITLE_GRID } from '../config/geometry.mjs';
import { ART_PHOTO, CH_PHOTO } from '../config/photos.mjs';
import { ccLine, ccMarks } from './cc.mjs';
import { esc, pad } from '../lib/html.mjs';

const CLUB_LIST = ['music', 'chem', 'philo', 'news', 'math'];

export function frontMatter(articles) {
  const legend = [...CLUB_LIST, 'open'].map(c =>
    `<div><i style="background:${clubVar(c)}"></i><b>${CLUBS[c].en}</b><span>${CLUBS[c].cn}</span></div>`).join('');
  const clubsList = CLUB_LIST.map(c => `<li>${CLUBS[c].cn}</li>`).join('');   // 正扉页底边：纯白字，× 分隔
  const tocCh = ch => {
    const items = articles.filter(a => a.ch === ch).map(a => `
      <a class="toc-item" href="#a-${a.id}">
        <span class="n">${pad(a.seq)}</span>
        <span class="t">${esc(a.title)}${a.author ? `<small>${esc(a.author)}${a.author_note && a.author_note !== '化名' ? ' · ' + esc(a.author_note) : ''}</small>` : ''}</span>
        <span class="c">${a.clubs.map(c => `<i style="background:${clubVar(c)}"></i>`).join('')}</span>
        <span class="pn" data-target="a-${a.id}">—</span>
      </a>`).join('');
    return `<div class="toc-chapter"><a class="ch" href="#ch-${ch}" style="color:inherit;text-decoration:none"><span class="n">${pad(ch)}</span><span class="nm">${CHAPTERS[ch].cn}<span>${CHAPTERS[ch].en}</span></span></a>${items}</div>`;
  };
  return `
  <div class="page fm fm-half" id="fm-1">
    <div class="mark">
      <div class="w">RESONANCE<sup>.</sup><i class="spark"></i></div>
      <div class="cn">共鸣</div>
    </div>
  </div>
  <div class="page fm fm-bars" id="fm-2">
    <div class="quote">
      <div class="en">${COPY.manifesto.en}<i class="spark blue"></i></div>
      <div class="cn">${COPY.manifesto.cn}</div>
    </div>
    <div class="legend">${legend}</div>
  </div>
  <div class="page fm fm-title" id="fm-3">
    <div class="wm" aria-label="RESONANCE">${TITLE_GRID.map(([ch, c, r]) => `<i class="${ch === 'O' ? 'o' : ''}" style="left:calc(${c} * var(--wm-step));top:calc(${r} * var(--wm-row))">${ch}</i>`).join('')}</div>
    <div class="cn">共鸣</div>
    <div class="tl">${COPY.tagline}</div>
    <div class="issue"><b>${ISSUE.en.split(' ')[1]}</b><i></i><span>${ISSUE.en.split(' ')[0]}</span></div>
    <div class="vr">浙江省桐乡市高级中学　${CLUB_LIST.map(c => CLUBS[c].cn).join(' · ')}　联袂出品</div>
    <div class="vl">STUDENT JOURNAL　·　${COPY.manifesto.cn}</div>
    <ul class="clubs">${clubsList}</ul>
  </div>
  <div class="page fm fm-colophon" id="fm-4">
    <div class="block">
      <h4>COLOPHON / 版权信息</h4>
      <!-- 著录与图片来源共用一张 dl：同一个 56 pt 标签列、同一套字号行距。
           许可不再写成「CC BY-SA 4.0」文字，改为官方图标 + 版本号（cc.mjs 的 ccLine）。 -->
      <dl>
        <dt>刊名</dt><dd>共鸣（RESONANCE）</dd>
        <dt>出品</dt><dd>浙江省桐乡市高级中学<br>音乐社 × 化学社 × 哲学社 × 新闻社 × 数学社</dd>
        <dt>主编</dt><dd>许恺颉</dd>
        <dt>指导老师</dt><dd>陆佳瑜</dd>
        <dt>编者</dt><dd>陈安浙　钱成昊　钱东成　夏宁　章茹涵</dd>
        <dt>美术</dt><dd>宋静弘</dd>
        <dt>排版</dt><dd>赵奕辉</dd>
        <dt>版式参考</dt><dd>章节页排版 X@_madebygray</dd>
        <dt>印务</dt><dd>章茹涵</dd>
        <dt>开本</dt><dd>A4（210 × 297 mm）</dd>
        <dt class="grp">篇目配图</dt>
        ${Object.keys(ART_PHOTO).map(id => `<dt>${id}</dt><dd>${esc(ART_PHOTO[id].credit)}，${ccLine(ART_PHOTO[id].lic)}${ART_PHOTO[id].note ? `<em>；${esc(ART_PHOTO[id].note)}</em>` : ''}</dd>`).join('')}
        <dt class="grp">章扉页照片</dt>
        ${Object.keys(CH_PHOTO).map(ch => `<dt>${pad(ch)}</dt><dd>${esc(CH_PHOTO[ch].credit)}，${ccLine(CH_PHOTO[ch].lic)}</dd>`).join('')}
      </dl>

      <div class="lic">
        <div class="lic-marks">${ccMarks()}</div>
        <div class="lic-text">
          <b>本刊文字与版式以 CC BY-NC-SA 4.0 授权</b>
          <span>署名—非商业性使用—相同方式共享 4.0 国际</span>
          <span class="lic-url">creativecommons.org/licenses/by-nc-sa/4.0</span>
        </div>
      </div>
      <p class="lic-note">篇目配图与章扉页照片按各自原始许可单独授权，不受本条约束。</p>
    </div>
  </div>
  <div class="page fm fm-toc" id="fm-5">
    <div class="toc-head"><h2>CONTENTS</h2><div class="cn">目录</div><i class="spark"></i></div>
    <div class="toc-rule"></div>
    ${tocCh(1)}
    ${tocCh(2)}
  </div>`;
}

// 刊物的身份与词表：期号、章名、社团、体裁。
// 每期只改这里；装配逻辑（content/*）不需要动。

export const ISSUE = { cn: '2026 冬', en: 'WINTER 2026', no: 'VOL. 02' };   // TODO 期号待确认

export const CHAPTERS = {
  1: { cn: '文学', en: 'LITERATURE' },
  2: { cn: '交叉', en: 'INTERSECTIONS' },
};

/** v 是 tokens.css 里的色变量；书眉、色标、目录圆点都取它 */
export const CLUBS = {
  music: { cn: '音乐社', en: 'MUSIC', v: '--c-music' },
  chem: { cn: '化学社', en: 'CHEMISTRY', v: '--c-chem' },
  philo: { cn: '哲学社', en: 'PHILOSOPHY', v: '--c-philo' },
  news: { cn: '新闻社', en: 'JOURNALISM', v: '--c-news' },
  math: { cn: '数学社', en: 'MATH', v: '--c-math' },
  open: { cn: '校外征稿', en: 'OPEN CALL', v: '--c-orange' },
};

/** 右侧页边色标的上下顺序（索引 × 34pt） */
export const CLUB_ORDER = ['music', 'chem', 'philo', 'news', 'math', 'open'];

export const FORM_EN = { prose: 'PROSE', fiction: 'FICTION', poem: 'POETRY', lyrics: 'LYRICS', essay: 'ESSAY' };

/** DESIGN-TOKENS §3.3 / §6.3 的假设（待确认）：字体族与社团归属的个别覆盖 */
export const OVERRIDE = {
  '1-4': { font: 'serif' },
  '2-4': { clubs: ['math'] },
  '2-5': { clubs: ['math'] },
};

export const COPY = {
  manifesto: { en: 'EVERY VOICE<br>FINDS ITS ECHO', cn: '每一个声音，都值得一次回响。' },
  tagline: 'resonate w/ you!',
};

export const clubVar = c => `var(${CLUBS[c].v})`;

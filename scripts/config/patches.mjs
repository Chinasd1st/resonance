// 每篇稿件的补丁表。这一层是**内容校对**，每期都会重写；
// 装配机制（content/article.mjs）跨期不变，两者刻意分开。
//
// 顺序有语义，见 content/article.mjs 的 applyPatches：
//   换图 → 改宽 → 绕排开关 → 挪锚 → 改字 → 图号引用 → 公式卡 → SVG 重绘
// 所有键都写作 "<篇号>/<图片文件名>"，与 build/media/<篇号>/media/<文件名> 对齐。

// 另行替换的插图：{ 篇号: { 原文件名: { src, alt(图注) } } }
// 原图是带「百度百科」水印的截图，换成 Google Art Project 的斯米尔伯特原作
export const SWAP_IMG = {
  '2-4': {
    'image1.png': { src: '../assets/berkeley.jpg', alt: '乔治·贝克莱主教（绘于1720年代末）' },
  },
};

// 个别插图按需重设原稿宽度（英寸）。值为 [宽, 高]，必须成对比缩放：
// 只改 width 会把图纵向拉长（原稿的 height 写在行内样式里）
export const FIG_W = {
  '2-2': { 'image1.png': [5.5, 3.924] },
  // 2-3：三张右绕排图收窄让正文回宽；四联图限高 76pt 使整篇回到三页
  '2-3': {
    'image1.jpeg': [1.85, 1.407],
    'image2.png': [2.15, 1.397],
    'image3.png': [2.05, 0.55],
    'image2.jpeg': [1.3868, 1.0556],
    'image4.jpeg': [1.077, 1.0556],
    'image5.jpeg': [1.0556, 1.0556],
  },
};

// pandoc 转换丢段的地方在这里补回来：docx 里那段正文前面挂着一个「图注文本框」，
// 转换器只把文本框里的字（谢尔宾斯基三角形）单独提成一段，整段正文被吞掉了
export const TEXT_FIX = {
  // 插图重绘后配色改为全刊的蓝／橙，正文里的颜色描述随之同步
  '2-1': [
    [
      '红线表示自然对数函数，紫线是它的导数',
      '蓝线表示自然对数函数，橙线是它的导数',
    ],
    // 正文里的单变量原本是普通正文字体，与相邻的 KaTeX 公式不同源；
    // 统一改为行内公式，斜体、字距跟后面的 p＝m/(M+m) 一致
    [
      '称为厚度（p），新记忆数（m），已有记忆数（M）则有',
      '称为厚度（<span class="math inline">p</span>），新记忆数（<span class="math inline">m</span>），'
      + '已有记忆数（<span class="math inline">M</span>）则有',
    ],
  ],
  '2-3': [[
    '<p>谢尔宾斯基三角形</p>',
    '<p>分形（fractal），意为“破碎的图形”。如果一个图形在放大后得到的部分与图形整体相似（即自相似性），'
    + '那么这个图形即为狭义上的分形。[[fig:image1.jpeg]]为谢尔宾斯基三角形，蓝色边框圈出的部分与整体相似，'
    + '因此谢尔宾斯基三角形为分形。分形不仅有一种独特的美感，还有一些神奇的性质。'
    + '维度便是我们将探讨的，分形具有的神奇特性之一。</p>',
  ]],
};

// 正文里对插图的指代（「上图」「右图」「这幅图」）一律改成带编号的「图 X」。
// 编号不写死：[[fig:文件名]] 交给 src/js/refs.js 按该篇实际的出图顺序解析
// （类似 LaTeX 的 \ref），增删、调序插图后引用自动跟着变，且排成蓝色强调
export const FIG_REF = {
  '2-1': [['在这幅图中，', '在[[fig:image1.jpeg]]中，']],
  '2-2': [['（上图最左、最右侧的直线）', '（[[fig:image1.png]]最左、最右侧的直线）']],
  '2-3': [['如上图可得：', '由[[fig:image3.png]]可得：']],
  '2-5': [
    ['（见右图）', '（见[[fig:image1.jpeg]]）'],
    // 肖像在版面上居中、正文另起，说「右边」既不对也不是坐标；改指图号
    ['认识右边这个人吗？', '认识[[fig:image2.png]]里的这个人吗？'],
  ],
};

// 竖幅肖像默认不绕排（绕排会把行宽挤窄，Chrome 把浮动图推到页顶时还会留空洞），
// 但单栏篇目里 60 mm 宽的肖像绕排后仍有 100 mm 行宽，值得省下近 80 mm 版面。
// 这里逐张点名，覆盖 src/js/figures.js「只绕横幅」的默认判断：1 = 强制绕排，0 = 不绕排
//   2-5 图3（四种平均数的星形示意）：方图默认会绕排，缩到 44% 栏宽后图里的 H/G/A/Q 标注认不出，
//   紧跟的 M_p 公式又放不进图侧、被推到图下，左边空出一块 → 改为按原稿尺寸居中出图
export const FIG_FLOAT = { '2-5/image2.png': 1, '2-5/image2.jpeg': 0 };

// 插图挪锚点：{ 篇号: [[图文件, 挪到哪一段之前（该段开头的原文片段）], …] }
// 浮动图挂在哪一段，就从哪一段的位置起排；挂点离页底太近时，整张图连同图注会被推到下一页顶，
// 而紧随其后的独立公式比图侧剩余行宽还宽、排不进图侧，只能落到图下，留下一个空洞。
//   2-5 洛必达肖像：原稿挂在「小明：0 啊……」，离页底只剩约 174 pt，放不下 208 pt 的图块，
//   跳页后第 43 页左上空出约 190 pt × 330 pt。改挂到公式之后「其中 f(x)、g(x) 均为函数」那段：
//   这段说明有十来行，正好贴着肖像排满，公式本身留在上一页底/本页顶通栏
//   2-5 图3：挪到 M_p 公式之后、结尾「初开天元……」之前，作为整篇的收束图
export const FIG_MOVE = {
  '2-5': [
    ['image2.png', '<p>其中<span class="math inline">f(x)'],
    ['image2.jpeg', '<p><strong>初开天元'],
  ],
};

// 重绘的矢量图本身画得很小（正方形四等分 155 pt、线段 148 pt），
// 绕排图默认按 44% 栏宽出图会再压到 105 pt，图内 6.8 pt 的 a / ½a 只剩 4.6 pt。
// 按篇指定绕排宽度上限：2-1 的宽函数图 56%，2-3 的两张几何图放到 70%
export const FIG_WRAP = {
  '2-1/image1.jpeg': 56,
  '2-3/image2.png': 70,
  '2-3/image3.png': 70,
  '2-8/image1.png': 70,
};

// 2-8 原稿那张手写笔记（三角恒等变换）不再画成 SVG 文字：SVG 里没有分式、根号，
// 只能写成「(tan α + tan β) / (1 − tan α tan β)」「(√3/2)」这种伪记号，字号一缩就成糊点。
// 改为直接排 HTML，公式交给 KaTeX（与正文同源），序号 ①–④ 做成带引线的小标题，推导按等号对齐。
export const TRIG_CARD = String.raw`<figure class="trigcard">
<div class="tc-head"><b>三角恒等变换</b><i>TRIG IDENTITIES</i><em>这不是英语吗？！</em></div>
<h4 class="tc-h"><span>①</span>和差公式</h4>
<p class="eq"><span class="math display">\begin{aligned}
\cos(\alpha-\beta)&amp;=\cos\alpha\cos\beta+\sin\alpha\sin\beta\\
\cos(\alpha+\beta)&amp;=\cos[\alpha-(-\beta)]\\
&amp;=\cos\alpha\cos(-\beta)+\sin\alpha\sin(-\beta)\\
&amp;=\cos\alpha\cos\beta-\sin\alpha\sin\beta\\
\sin(\alpha+\beta)&amp;=\sin\alpha\cos\beta+\cos\alpha\sin\beta\\
\sin(\alpha-\beta)&amp;=\sin\alpha\cos\beta-\cos\alpha\sin\beta
\end{aligned}</span></p>
<p class="tc-note">※ 余弦：正正，符号相反　　正弦：正余，符号相同</p>
<h4 class="tc-h"><span>②</span>用诱导公式推 sin(α+β)</h4>
<p class="eq"><span class="math display">\begin{aligned}
\cos\left(\tfrac{\pi}{2}-(\alpha+\beta)\right)&amp;=\cos\left[\left(\tfrac{\pi}{2}-\alpha\right)-\beta\right]\\
&amp;=\cos\left(\tfrac{\pi}{2}-\alpha\right)\cos\beta+\sin\left(\tfrac{\pi}{2}-\alpha\right)\sin\beta\\
&amp;=\sin\alpha\cos\beta+\cos\alpha\sin\beta
\end{aligned}</span></p>
<h4 class="tc-h"><span>③</span>和差化积</h4>
<p class="eq"><span class="math display">\begin{aligned}
\tan(\alpha+\beta)&amp;=\dfrac{\tan\alpha+\tan\beta}{1-\tan\alpha\tan\beta}\\[4pt]
\tan(\alpha-\beta)&amp;=\dfrac{\tan\alpha-\tan\beta}{1+\tan\alpha\tan\beta}
\end{aligned}</span></p>
<p class="tc-note">※ 由 <span class="math inline">\tan={\sin}/{\cos}</span>，上下同除 <span class="math inline">\cos\alpha\cos\beta</span> 即得</p>
<h4 class="tc-h"><span>④</span>相位特例</h4>
<p class="eq"><span class="math display">\begin{aligned}
\sin\left(x+\tfrac{\pi}{3}\right)&amp;=\sin x\cos\tfrac{\pi}{3}+\cos x\sin\tfrac{\pi}{3}\\
&amp;=\tfrac{1}{2}\sin x+\tfrac{\sqrt{3}}{2}\cos x\\
\sin\left(x+\tfrac{\pi}{2}\right)&amp;=\sin x\cos\tfrac{\pi}{2}+\cos x\sin\tfrac{\pi}{2}\\
&amp;=0+\cos x=\cos x
\end{aligned}</span></p>
</figure>`;

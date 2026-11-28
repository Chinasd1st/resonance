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
  // 2-10：八张自然分形归位至「我们先来欣赏下面一组图片：」之后排成 2×4 图版；
  // 还原雪花 / 油滴 / 树木 / 群山各组图与「程序模拟：」「图片来源：」的真实先后顺序
  '2-10': [
    [
      '<p><strong>雨花石</strong></p>\n<p><strong>雪花</strong></p>\n<p><strong>水晶</strong></p>'
      + '\n<p><strong>铋晶体</strong></p>\n<p><strong>星云</strong></p>'
      + '\n<p><img src="media/2-10/media/image1.jpeg" style="width:1.57569in;height:1.82778in" alt="mn" />'
      + '<img src="media/2-10/media/image2.jpeg" style="width:1.29792in;height:1.69792in" alt="xy" />'
      + '<img src="media/2-10/media/image3.jpeg" style="width:1.67153in;height:1.85278in" alt="snow" />'
      + '<img src="media/2-10/media/image4.jpeg" style="width:1.45347in;height:1.75972in" alt="bi" />'
      + '<img src="media/2-10/media/image5.jpeg" style="width:1.45972in;height:1.83472in" alt="crystal" /></p>'
      + '\n<p><strong>萤石</strong></p>\n<p><strong>潮汐树</strong></p>\n<p><strong>罗马花椰菜</strong></p>'
      + '\n<p><img src="media/2-10/media/image6.jpeg" style="width:1.26597in;height:1.68125in" alt="cxs" />'
      + '<img src="media/2-10/media/image7.jpeg" style="width:1.62222in;height:1.64792in" alt="hyc" /></p>'
      + '\n<p>有了非欧几何，我们可以扩展研究的对象，将平直的空间扩展到扭曲的空间。但这还远远不够。自然界的许多物体并非只有平直和弯曲之分。我们先来欣赏下面一组图片：</p>'
      + '\n<p><img src="media/2-10/media/image8.png" style="width:1.32917in;height:1.66597in" alt="ys" /></p>',
      '<p>有了非欧几何，我们可以扩展研究的对象，将平直的空间扩展到扭曲的空间。但这还远远不够。自然界的许多物体并非只有平直和弯曲之分。我们先来欣赏下面一组图片：</p>'
      + '\n<p><img src="media/2-10/media/image8.png" style="width:1.32917in;height:1.66597in" alt="萤石" />'
      + '<img src="media/2-10/media/image7.jpeg" style="width:1.62222in;height:1.64792in" alt="罗马花椰菜" />'
      + '<img src="media/2-10/media/image6.jpeg" style="width:1.26597in;height:1.68125in" alt="潮汐树" />'
      + '<img src="media/2-10/media/image2.jpeg" style="width:1.29792in;height:1.69792in" alt="星云" /></p>'
      + '\n<p><img src="media/2-10/media/image4.jpeg" style="width:1.45347in;height:1.75972in" alt="铋晶体" />'
      + '<img src="media/2-10/media/image5.jpeg" style="width:1.45972in;height:1.83472in" alt="水晶" />'
      + '<img src="media/2-10/media/image3.jpeg" style="width:1.67153in;height:1.85278in" alt="雪花" />'
      + '<img src="media/2-10/media/image1.jpeg" style="width:1.57569in;height:1.82778in" alt="雨花石" /></p>',
    ],
    [
      '<p><strong>图片来源：网络</strong></p>'
      + '\n<p><img src="media/2-10/media/image9.png" style="width:2.57222in;height:2.63056in" alt="u=1267469662,701356925&amp;fm=253&amp;fmt=auto" />'
      + '<img src="media/2-10/media/image10.GIF" style="width:2.62014in;height:2.62014in" alt="u=836691999,2486722495&amp;fm=253&amp;fmt=auto&amp;app=138&amp;f=GIF" />'
      + '<img src="media/2-10/media/image11.png" style="width:2.09306in;height:2.61736in" alt="3bf33a87e950352a13ea5381cca753fdb0118ba0" /></p>'
      + '\n<p><img src="media/2-10/media/image12.jpeg" style="width:2.37986in;height:2.69097in" alt="正六边形——φ雪花" />'
      + '<img src="media/2-10/media/image13.jpeg" style="width:2.6in;height:2.71597in" alt="雪花分形.（2,108）" />'
      + '<img src="media/2-10/media/image14.png" style="width:2.41042in;height:2.79653in" alt="雪花分形.（1+pt·φ+1÷φ,192）" />程序模拟：</p>'
      + '\n<p><strong>图片来源：程序生成</strong></p>',
      '<p><img src="media/2-10/media/image11.png" style="width:2.09306in;height:2.61736in" alt="" />'
      + '<img src="media/2-10/media/image10.GIF" style="width:2.62014in;height:2.62014in" alt="" />'
      + '<img src="media/2-10/media/image9.png" style="width:2.57222in;height:2.63056in" alt="" /></p>'
      + '\n<p class="figsrc">图片来源：网络</p>\n<p>程序模拟：</p>'
      + '\n<p><img src="media/2-10/media/image14.png" style="width:2.41042in;height:2.79653in" alt="雪花分形.（1+pt·φ+1÷φ,192）" />'
      + '<img src="media/2-10/media/image13.jpeg" style="width:2.6in;height:2.71597in" alt="雪花分形.（2,108）" />'
      + '<img src="media/2-10/media/image12.jpeg" style="width:2.37986in;height:2.69097in" alt="正六边形——φ雪花" /></p>'
      + '\n<p class="figsrc">图片来源：程序生成</p>',
    ],
    [
      '<img src="media/2-10/media/image15.png" style="width:2.98333in;height:2.51528in" alt="截图20261121222256" /><img src="media/2-10/media/image16.png" style="width:3.46181in;height:2.44306in" alt="截图20261121222229" />',
      '<img src="media/2-10/media/image16.png" style="width:3.46181in;height:2.44306in" alt="" /><img src="media/2-10/media/image15.png" style="width:2.98333in;height:2.51528in" alt="" />',
    ],
    [
      '<img src="media/2-10/media/image17.jpeg" style="width:2.21042in;height:2.21042in" alt="随机相切圆.填充.主颜色亮度渲染.嵌套.(50,2,0.3,1,1,255 192 0)" />'
      + '<img src="media/2-10/media/image18.jpeg" style="width:2.16181in;height:2.16181in" alt="随机相切圆.填充.坐标渲染.嵌套.(50,2,0.3)" />'
      + '<img src="media/2-10/media/image19.jpeg" style="width:2.19514in;height:2.19514in" alt="随机相切圆.填充.主颜色亮度渲染.(50,0.3,2.3,0,255 192 0)" />'
      + '<img src="media/2-10/media/image20.jpeg" style="width:2.24028in;height:2.24028in" alt="随机相切圆.填充.坐标渲染.(300,0.01)" />'
      + '<img src="media/2-10/media/image21.jpeg" style="width:2.25278in;height:2.25278in" alt="随机相切圆.填充.(150,1)" />',
      '<img src="media/2-10/media/image21.jpeg" style="width:2.25278in;height:2.25278in" alt="随机相切圆.填充.(150,1)" />'
      + '<img src="media/2-10/media/image20.jpeg" style="width:2.24028in;height:2.24028in" alt="随机相切圆.填充.坐标渲染.(300,0.01)" />'
      + '<img src="media/2-10/media/image19.jpeg" style="width:2.19514in;height:2.19514in" alt="随机相切圆.填充.主颜色亮度渲染.(50,0.3,2.3,0,255 192 0)" /></p>'
      + '\n<p><img src="media/2-10/media/image18.jpeg" style="width:2.16181in;height:2.16181in" alt="随机相切圆.填充.坐标渲染.嵌套.(50,2,0.3)" />'
      + '<img src="media/2-10/media/image17.jpeg" style="width:2.21042in;height:2.21042in" alt="随机相切圆.填充.主颜色亮度渲染.嵌套.(50,2,0.3,1,1,255 192 0)" />',
    ],
    [
      '<img src="media/2-10/media/image22.jpeg" style="width:1.31181in;height:1.75in" alt="4af92bdd8d6ec932cef595744018477e301" /><img src="media/2-10/media/image23.png" style="width:2.89653in;height:1.71944in" alt="截图20261122102307" />',
      '<img src="media/2-10/media/image23.png" style="width:2.89653in;height:1.71944in" alt="" /><img src="media/2-10/media/image22.jpeg" style="width:1.31181in;height:1.75in" alt="" />',
    ],
    ['</p>\n<p><img src="media/2-10/media/image27.jpeg"', '<img src="media/2-10/media/image27.jpeg"'],
    [
      '<p><img src="media/2-10/media/image28.png" style="width:1.43403in;height:2.01875in" alt="截图20261122145041" /></p></li>\n</ol>'
      + '\n<p>话不多说，直接看图像：</p>'
      + '\n<p><img src="media/2-10/media/image29.png" style="width:1.99722in;height:1.57917in" alt="截图20261122140729" />'
      + '<img src="media/2-10/media/image30.png" style="width:1.7125in;height:1.58056in" alt="截图20261122140916" /></p>'
      + '\n<p><strong>图片来源：网络</strong></p>\n<p><strong>图片来源：程序生成</strong></p>'
      + '\n<p><img src="media/2-10/media/image31.jpeg" style="width:2.53333in;height:2.53333in" alt="山峰模拟.半山.(10 2 1 0 30 (0 255 0))" />'
      + '<img src="media/2-10/media/image32.jpeg" style="width:2.41111in;height:2.41111in" alt="山峰模拟.半山.(100 1 0.9 π÷2 25 (0 193 92))" />'
      + '<img src="media/2-10/media/image33.png" style="width:2.42639in;height:2.42639in" alt="山峰模拟.半山.(100 1 1 π 50 (0 152 0))" /></p>',
      '</li>\n</ol>'
      + '\n<p>话不多说，直接看图像：</p>'
      + '\n<p><img src="media/2-10/media/image29.png" style="width:1.99722in;height:1.57917in" alt="" />'
      + '<img src="media/2-10/media/image30.png" style="width:1.7125in;height:1.58056in" alt="" />'
      + '<img src="media/2-10/media/image28.png" style="width:1.43403in;height:2.01875in" alt="" /></p>'
      + '\n<p class="figsrc">图片来源：网络</p>'
      + '\n<p><img src="media/2-10/media/image33.png" style="width:2.42639in;height:2.42639in" alt="山峰模拟.半山.(100 1 1 π 50 (0 152 0))" />'
      + '<img src="media/2-10/media/image32.jpeg" style="width:2.41111in;height:2.41111in" alt="山峰模拟.半山.(100 1 0.9 π÷2 25 (0 193 92))" />'
      + '<img src="media/2-10/media/image31.jpeg" style="width:2.53333in;height:2.53333in" alt="山峰模拟.半山.(10 2 1 0 30 (0 255 0))" /></p>'
      + '\n<p class="figsrc">图片来源：程序生成</p>',
    ],
    ['<p><strong>图片来源：网络</strong></p>', '<p class="figsrc">图片来源：网络</p>'],
    ['<p><strong>图片来源：程序生成</strong></p>', '<p class="figsrc">图片来源：程序生成</p>'],
  ],
  '2-11': [
    // 原稿的两节标题只是普通段落，升成 h3，才和 2-10 的小节同一层级
    ['<p>第一章：酸碱指示剂变色实验</p>', '<h3>第一章：酸碱指示剂变色实验</h3>'],
    ['<p>第二章：BZ反应现象模拟</p>', '<h3>第二章：BZ反应现象模拟</h3>'],
    // 开头两张烧杯图（image2 反应前紫、image1 反应后红）原稿浮动在步骤②旁，pandoc 却错吐在开头「注：」里
    ['<p><img src="media/2-11/media/image1.png" style="width:1.28542in;height:1.65069in" alt="截图20261114201547" /><img src="media/2-11/media/image2.png" style="width:1.20278in;height:1.65347in" alt="截图20261114201523" />注：分析软件为Python', '<p class="pnote">注：分析软件为Python'],
    [
      '<p>②用镊子夹取一小块干冰，放入配制好的酸碱指示剂中并观察现象（现象如右图）。</p>',
      '<p>②用镊子夹取一小块干冰，放入配制好的酸碱指示剂中并观察现象（现象如右图）。</p>'
      + '\n<p><img src="media/2-11/media/image2.png" style="width:1.20278in;height:1.65347in" alt="" />'
      + '<img src="media/2-11/media/image1.png" style="width:1.28542in;height:1.65069in" alt="" /></p>'
      + '\n<p class="figlabel">反应前　反应后</p>\n<p class="figsrc">图片来源：网络</p>',
    ],
    // 清除①与②之间错位残留的标注行
    ['<p>①向烧杯中加入蒸馏水，取紫色石蕊试液加入蒸馏水中，用玻璃棒搅拌，配制适当浓度的酸碱指示剂；</p>\n<p><strong>反应前 反应后</strong></p>\n<p><strong>图片来源：网络</strong></p>', '<p>①向烧杯中加入蒸馏水，取紫色石蕊试液加入蒸馏水中，用玻璃棒搅拌，配制适当浓度的酸碱指示剂；</p>'],
    // 番外实拍两图移至文字段之后
    [
      '<p><img src="media/2-11/media/image4.png" style="width:1.55486in;height:1.19444in" alt="截图20261114205627" />'
      + '<img src="media/2-11/media/image5.png" style="width:1.33681in;height:1.19028in" alt="截图20261114205643" /></p>'
      + '\n<p>番外：作者用紫葡萄皮提取了酸碱指示剂并用碱性洗洁精充当碱性物质做了变色实验，现象见右图</p>'
      + '\n<p><strong>反应前 反应后</strong></p>\n<p><strong>图片来源：实拍</strong></p>',
      '<p>番外：作者用紫葡萄皮提取了酸碱指示剂并用碱性洗洁精充当碱性物质做了变色实验，现象见右图</p>'
      + '\n<p><img src="media/2-11/media/image4.png" style="width:1.55486in;height:1.19444in" alt="" />'
      + '<img src="media/2-11/media/image5.png" style="width:1.33681in;height:1.19028in" alt="" /></p>'
      + '\n<p class="figlabel">反应前　反应后</p>\n<p class="figsrc">图片来源：实拍</p>',
    ],
    // BZ 反应两张网络实拍图从段首合并至段后并排
    [
      '<p><img src="media/2-11/media/image8.png" style="width:2.17708in;height:2.27986in" alt="截图20261121205838" />BZ反应是一类著名的化学振荡反应，有许多不同的版本，下面以铈作催化剂时，丙二酸在稀硫酸水溶液中被溴酸盐氧化的反应为例，给出反应现象展示：</p>'
      + '\n<p><img src="media/2-11/media/image9.png" style="width:2.78472in;height:2.27639in" alt="截图20261121205838" /></p>',
      '<p>BZ反应是一类著名的化学振荡反应，有许多不同的版本，下面以铈作催化剂时，丙二酸在稀硫酸水溶液中被溴酸盐氧化的反应为例，给出反应现象展示：</p>'
      + '\n<p><img src="media/2-11/media/image8.png" style="width:2.17708in;height:2.27986in" alt="" />'
      + '<img src="media/2-11/media/image9.png" style="width:2.78472in;height:2.27639in" alt="" /></p>',
    ],
    // 程序② 的「图片来源：程序生成」错排在图前，移到两图之后
    [
      '<p><strong>图片来源：程序生成</strong></p>'
      + '\n<p><img src="media/2-11/media/image12.png" style="width:2.76597in;height:2.41111in" alt="截图20261122151428" />'
      + '<img src="media/2-11/media/image13.png" style="width:2.92153in;height:2.39444in" alt="截图20261122151449" /></p>',
      '<p><img src="media/2-11/media/image12.png" style="width:2.76597in;height:2.41111in" alt="" />'
      + '<img src="media/2-11/media/image13.png" style="width:2.92153in;height:2.39444in" alt="" /></p>'
      + '\n<p class="figsrc">图片来源：程序生成</p>',
    ],
    ['<p><strong>图片来源：网络</strong></p>', '<p class="figsrc">图片来源：网络</p>'],
    ['<p><strong>图片来源：程序生成</strong></p>', '<p class="figsrc">图片来源：程序生成</p>'],
    ['<p><strong>图片来源：实拍</strong></p>', '<p class="figsrc">图片来源：实拍</p>'],
    ['<p><strong>反应前 反应后</strong></p>', '<p class="figlabel">反应前　反应后</p>'],
    // 两处「注：」是图下的小注，不是文末注释块
    ['<p>注：每次渲染都取用一种规则', '<p class="pnote">注：每次渲染都取用一种规则'],
    ['<p>注：由于程序基于正弦函数', '<p class="pnote">注：由于程序基于正弦函数'],
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
export const FIG_FLOAT = { '2-5/image2.png': 1, '2-5/image2.jpeg': 0, '2-11/image3.jpeg': 0 };

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

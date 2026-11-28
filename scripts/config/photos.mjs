// 图片与色标：章扉页、篇目跨页、正扉页光球用到的照片、引语、油墨色。
// 照片只用公有领域 / CC0 / CC BY，授权文字同时印在版权页（frontmatter 会读 credit）。

// 正扉页底图：颗粒渐变光球 + 竖条半透明磨砂层（scripts/art/orb-art.py），
// 色标取刊物色板（橙 → 音乐社橙 → 哲学社紫 → 信号蓝 → 深蓝）
export const TITLE_ORB = { kind: 'orb', bg: [0xE6, 0xF1, 0xFF],
  stops: [[0, [0xED, 0x72, 0x07]], [0.22, [0xF0, 0x8A, 0x24]], [0.5, [0x7A, 0x5B, 0xD6]], [0.78, [0x45, 0x8C, 0xEE]], [1, [0x2F, 0x6F, 0xD6]]],
  center: [96, 156], radius: [114, 132], edge: 0.1, angle: 12,
  strips: [[132, 151], [151, 170], [170, 189]], grain: 0.04, seed: 3 };

// 章扉页引语取自本章稿件原文，一字不改，后缀出处
export const CH_QUOTE = {
  1: { text: '恰巧，夜的幕墙上被打上了一抹白光——一列火车正缓缓驶来。', from: '在铁路口' },
  2: { text: '数学的严格与哲学的反思，正是自然语言自我超越的两种方式。', from: '自然语言：数学与哲学的纽带' },
};

// 章扉页照片：focus 为裁切中心（0–1）
export const CH_PHOTO = {
  1: { src: 'assets/chapters/ch1.jpg', focus: [0.62, 0.62], credit: '“Sea of clouds”，liu qiaojun 摄，CC0' },
  2: { src: 'assets/chapters/ch2.jpg', focus: [0.5, 0.55], credit: '“Chitina River Below the Nizina River and Chakina River Confluences (2)”，美国国家公园管理局阿拉斯加区摄，公有领域' },
};

// 篇目跨页（DESIGN-TOKENS §7.6）：第一章前三篇与 1-6《几乎处处》，
// 满版的东西画在 overlay 层并垫在正文下面（merge.py 的 under 页）
export const ART_PHOTO = {
  '1-1': { src: 'assets/articles/1-1.jpg', short: 'Killarnee · CC BY-SA 4.0',
    credit: 'Killarnee 摄，“Karlsruhe at night – railroad crossing Brunnenstückweg, Karlsruhe-Rüppurr - 3”，CC BY-SA 4.0；本图为改编作品，同以 CC BY-SA 4.0 授权' },
  '1-2': { src: 'assets/articles/1-2.jpg', short: 'W.carter · CC BY-SA 4.0',
    credit: 'W.carter 摄，“Sleet and rain through a bus window on road 162”，CC BY-SA 4.0；本图为改编作品，同以 CC BY-SA 4.0 授权' },
  '1-3': { src: 'assets/articles/1-3.jpg', short: 'Nico le terrible · CC0',
    credit: 'Nico le terrible 摄，“Wuzhen by night 5”，CC0' },
  '1-6': { src: 'assets/articles/1-6.jpg', short: 'STEVE WALKER · CC BY 2.0',
    credit: 'Steve Walker Photography 摄，“IMG_8531（Tulip Bouquet）”，CC BY 2.0（Openverse / Flickr）；经黑白银盐颗粒化处理；版式设计参考 X@AarzooAly（瑞士国际主义风格）' },
};

/** cls 对应 src/css/art/*.css 的类名；full = 开篇独占整页照片 */
export const ART = {
  '1-1': { cls: 'art-night', full: true },
  '1-2': { cls: 'art-fog' },
  '1-3': { cls: 'art-mist', full: true },
  '1-4': { cls: 'art-beast' },
  '1-5': { cls: 'art-shaft' },
  '1-6': { cls: 'art-swiss', full: true },
};

// 油墨色（RGB），与 tokens.css 同值：c.ink / c.blue / c.blueDeep / c.orange / c.news / c.tint / c.chem / 暖纸
export const RGB = {
  ink: [0x1D, 0x1D, 0x1B],
  blue: [0x45, 0x8C, 0xEE],
  blueDeep: [0x2F, 0x6F, 0xD6],
  orange: [0xED, 0x72, 0x07],
  news: [0xF2, 0xB7, 0x05],
  tint: [0xE6, 0xF1, 0xFF],
  chem: [0x1F, 0xA6, 0x7A],
  paperWarm: [0xEE, 0xE9, 0xDE],
};

// 1-1 的车灯光线：跨页坐标（mm，左页出血左上角为原点；右页 x +210，两页成品边在订口相接）
// 起点是左页照片里车头灯的位置，向右上斜穿订口，从右页切口上角出去
export const NIGHT_BEAM = [[114, 151], [426, 3]];

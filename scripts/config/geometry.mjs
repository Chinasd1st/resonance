// 版面几何：字标格位与章扉页的圆阵。
// 单位是 mm，原点 = 出血页左上角；左页按页面中线镜像，所以两页共用一套数字。

// 正扉页字标：RE— / SON / —ANCE 逐字落在格子里（[字, 列, 行]），参照宽字距断词海报
export const TITLE_GRID = [['R', 0, 0], ['E', 1, 0], ['–', 2, 0], ['S', 1, 1], ['O', 2, 1], ['N', 3, 1],
  ['–', 1, 2], ['A', 2, 2], ['N', 3, 2], ['C', 4, 2], ['E', 5, 2]];

// 章扉页（DESIGN-TOKENS §7.2）。右页版心 x 23–198、y 23–277；左页版心 x 18–193，按页面中线镜像
export const CH_GEO = { photoX: 53.1, photoY: 98, photoB: 277, pitch: 35.5, r: 12, cols: 4, rows: 5, blkR: 198 };

/** 照片块与 4 × 5 圆阵的坐标；right 决定镜像方向 */
export function chapterGeom(right) {
  const g = CH_GEO, h = g.photoB - g.photoY;
  const padx = (g.blkR - g.photoX - ((g.cols - 1) * g.pitch + 2 * g.r)) / 2;
  const pady = (h - ((g.rows - 1) * g.pitch + 2 * g.r)) / 2;
  const mx = x => right ? x : 216 - x;                       // 左页镜像
  const circles = [];
  for (let j = 0; j < g.rows; j++) for (let i = 0; i < g.cols; i++)
    circles.push([+mx(g.photoX + padx + g.r + g.pitch * i).toFixed(2), +(g.photoY + pady + g.r + g.pitch * j).toFixed(2), g.r]);
  // 左页按行仍从左往右读：镜像后每行顺序翻转回来
  if (!right) for (let j = 0; j < g.rows; j++) circles.splice(j * g.cols, g.cols, ...circles.slice(j * g.cols, (j + 1) * g.cols).reverse());
  const rect = right ? [g.photoX, g.photoY, 216 - g.photoX, h] : [0, g.photoY, 216 - g.photoX, h];
  return { rect, circles };
}

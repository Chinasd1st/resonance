// 重绘插图的注册表：键与 build/media 下的相对路径一致（"<篇号>/<图片文件名>"）。
// 值为返回 { vw, vh, body } 的函数——单位 pt，与成品 1:1。
// 原稿的解析式、坐标范围、数据点一律照原文，只重做线条、字号、色板与标注。
import { fig21 } from './2-1-ln-x.mjs';
import { fig22 } from './2-2-intensity.mjs';
import { sierpMain } from './2-3-sierpinski.mjs';
import { fig23square } from './2-3-quarter.mjs';
import { fig23seg } from './2-3-segment.mjs';
import { sierpinski, koch, vicsek, hilbert } from './2-3-fractal-set.mjs';
import { fig28 } from './2-8-fourier.mjs';
import {
  phiSnowflake, hexSnowflake, dendriteSnowflake,
  coralFractal, metasequoiaFractal, phiLeafFractal, selaginellaFractal,
} from './2-10-fractals.mjs';

export const FIGURES = {
  '2-1/image1.jpeg': fig21,
  '2-2/image1.png': fig22,
  '2-3/image1.jpeg': sierpMain,
  '2-3/image2.png': fig23square,
  '2-3/image3.png': fig23seg,
  '2-3/image2.jpeg': sierpinski,
  '2-3/image3.jpeg': koch,
  '2-3/image4.jpeg': vicsek,
  '2-3/image5.jpeg': hilbert,
  '2-8/image2.png': fig28,
  '2-10/image12.jpeg': phiSnowflake,
  '2-10/image13.jpeg': hexSnowflake,
  '2-10/image14.png': dendriteSnowflake,
  '2-10/image24.png': coralFractal,
  '2-10/image25.png': metasequoiaFractal,
  '2-10/image26.jpeg': phiLeafFractal,
  '2-10/image27.jpeg': selaginellaFractal,
};

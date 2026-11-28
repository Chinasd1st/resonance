// 路径与外部程序：所有入口（build / demo / cmyk）共用同一套根目录解析，
// 不再各自 `path.resolve(dirname, '..')`。
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

/** 仓库内路径。B('body.pdf') → <root>/build/body.pdf */
export const at = (...p) => path.join(ROOT, ...p);
export const B = (...p) => at('build', ...p);
export const DIST = (...p) => at('dist', ...p);
export const SCRIPT = (...p) => at('scripts', ...p);

export const CHROME = process.env.CHROME || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
export const GS = process.env.GS || 'C:\\Program Files\\gs\\gs10.07.1\\bin\\gswin64c.exe';

/** Chrome 只吃 file:/// 形式；Windows 反斜杠必须换掉 */
export const fileUrl = p => 'file:///' + p.replace(/\\/g, '/');

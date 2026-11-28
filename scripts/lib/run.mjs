// 子进程封装。python 的解释器解析原先散在 build / demo / cmyk 三处，这里统一：
// 依次试 PYTHON 环境变量、PATH 上的 python、py 启动器、本机用户目录里的 3.11–3.13，
// 第一个能跑通（且能 import pypdf）的即被记住，后续调用不再重试。
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { ROOT, SCRIPT } from './path.mjs';

const ALT = ['Python312', 'Python313', 'Python311']
  .map(v => path.join(process.env.LOCALAPPDATA || '', 'Programs', 'Python', v, 'python.exe'))
  .filter(p => p && fs.existsSync(p));

let pyBin = null;

function candidates() {
  if (pyBin) return [pyBin];
  const own = process.env.PYTHON ? [process.env.PYTHON] : [];
  return [...own, 'python', 'py', ...ALT];
}

// 解释器存在但缺包（pypdf / numpy / PIL）时换下一个，而不是整条链崩在合并前
const retryable = e => e.code === 'ENOENT'
  || /ModuleNotFoundError|No module named/.test(String(e.stderr || ''));

export function py(args, opts = {}) {
  let last = null;
  for (const c of candidates()) {
    try {
      // stdio 必须显式写：execFileSync 在子进程非零退出时默认把它的 stderr 打到父进程，
      // 解释器探测阶段（缺包那个会失败）就会在构建日志里留下无意义的 traceback
      const out = execFileSync(c, args, {
        cwd: ROOT, encoding: 'utf8', maxBuffer: 1 << 26, stdio: ['ignore', 'pipe', 'pipe'], ...opts,
      });
      pyBin = c;
      return out;
    } catch (e) {
      if (!retryable(e)) throw e;
      last = e;
    }
  }
  throw new Error('找不到可用的 python（需要 pypdf / pypdfium2 / numpy / Pillow）：'
    + '把 Python 放进 PATH，或用 PYTHON 环境变量指定。最后一次错误：' + (last && last.message));
}

/** python -I scripts/<script> …：-I 隔开用户 site-packages 与 PYTHONPATH，避免版本串味 */
export const runPy = (script, ...args) => py(['-I', SCRIPT(script), ...args]);

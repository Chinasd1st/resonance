// 命令行参数。三个入口共用：--only 1-1,2-2 / --flag / --name=value
export const argv = process.argv.slice(2);

export const flag = name => argv.includes(`--${name}`);

export function opt(name, dflt) {
  const hit = argv.find(a => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : dflt;
}

/** --only 1-1,2-2 → ['1-1','2-2']；未给则 null（全量） */
export function onlyIds() {
  const i = argv.indexOf('--only');
  if (i < 0) return null;
  const v = argv[i + 1];
  if (!v || v.startsWith('--')) throw new Error('--only 后面要跟篇号，如 --only 1-1,2-2');
  return v.split(',').map(s => s.trim()).filter(Boolean);
}

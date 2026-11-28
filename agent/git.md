# 提交标准

> 规范文件。目标只有一句：**任何一次改动都能单独回滚，任何一个 breaking change 都能被一眼认出来。**

## 1. 原子提交

一个提交只做一件事，且必须能独立通过构建：

- 重构与行为变更**分开**：`refactor`（不改产物）与 `fix` / `feat`（改产物）不能混。
- 版式改动按篇/按版块拆：`fix(1-2)`、`feat(1-6)` 各自一个提交，不要「一次改三篇」。
- 规范、文档、依赖各自成提交；不要顺手把文档塞进版式提交。
- 拆不动的大改动（如整目录模块化）也要保证：**提交前 `npm run build` 通过、58 页、`mathErrors` 为空**。

## 2. Conventional Commits

```
<type>(<scope>): <简述，动词开头，不超过 50 字>

<正文：为什么改、改了什么、验证结果>

<footer：BREAKING CHANGE / Refs>
```

`type`：

| type | 用于 |
| --- | --- |
| `feat` | 新增版式、新增篇目跨页、新增工具 |
| `fix` | 修版式缺陷（错位、裁切、缺字、页码错） |
| `refactor` | 不动产物的结构调整（拆模块、移文件） |
| `style` | 只改样式取值，不改结构 |
| `docs` | 规范、README、注释 |
| `build` | 依赖、构建脚本、CI |
| `chore` | 其它杂活 |

`scope` 用**读者能在仓库里找到的东西**：`scripts/content`、`src/css`、`1-2`、`1-6`、`fonts`、`agent`。不要用「update」「misc」。

示例：

```
fix(1-2): 交班记录框改为正文段落，图注不再压图边
feat(1-6): 瑞士跨页改满版出血，正文栅格贴齐版心
refactor!(scripts): build.mjs 拆为入口 + lib/config/content/overlay
```

## 3. Breaking change 必须单独提交

**产生 breaking change 的那一刻就提交，不允许和普通改动混在一起，也不允许留在工作区。**

判定标准——满足任一即是：

- 目录/文件路径变了（引用方要跟着改）。
- 命令、参数、环境变量变了（`npm run *`、`--only`、`CHROME`/`GS`/`PYTHON`）。
- 产物变了形状：页数、页面尺寸、出血、PDF 结构（CMYK、OutputIntent）、文件名。
- 依赖新增或大版本变更（`requirements.txt`、`package.json`）。
- 公共模块的导出签名变化（`window.RS.*`、`scripts/lib/*` 的导出）。

写法：标题带 `!`，正文单独写 `BREAKING CHANGE:` 段落，说明**影响面与迁移动作**。

```
refactor!(scripts): 模块化 build.mjs 与 src

把 745 行的 build.mjs 拆为入口 + lib/config/content/overlay/figures；
src 的 book.css / art.css / transform.js 拆成 src/css/* 与 src/js/*。

BREAKING CHANGE: python 脚本移到 scripts/{art,pdf,setup}，
PDF 后处理命令改为 `python scripts/pdf/merge.py`；
src/transform.js 不再存在，页面按 src/assets.mjs 注入 src/js/*.js。
旧引用需同步更新 AGENTS.md、package.json 与 ps1 脚本。
```

## 4. 提交前检查

> 构建按「一批」算：同一轮改动拆成多个提交时，在**动手写提交信息之前构建一次**、核对完再按序提交，不要每个提交各建一次（见 `setup.md` §5.1）。

1. `npm run build` 通过；页数 58、`mathErrors` 为空、无 `TEXT_FIX miss` / `FIG_REF miss`。
2. 版式改动跑了 `npm run diff -- 旧.pdf 新.pdf`，差异能逐条解释。
3. `git status` 里没有不该进仓库的东西（`build/`、`dist/`、`fonts/`、日志、临时 PNG）。
4. 提交信息里不写「修好了」「优化了一下」这类不可检索的话。

## 5. 纪律

- 不 `--amend` 已推送的提交；不改写他人分支。
- 不 `--force`（确需时用 `--force-with-lease` 并在正文说明原因）。
- 不跳过 hook（`--no-verify`）。
- `main` 上只允许 `docs` / `chore` 直推；版式与结构改动走 `feat/*`、`fix/*` 分支再合并。
- 大改前先打标签或备份分支（本仓库历史上有过一次 `backup/7552be0` 的先例）。

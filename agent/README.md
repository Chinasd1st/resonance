# 规范目录

给接手这个仓库的人（和模型）。`AGENTS.md` 是入口与经验，这里放**可执行的标准**：改什么、按什么规则改、怎么提交。

| 文件 | 管什么 | 什么时候读 |
| --- | --- | --- |
| [`setup.md`](setup.md) | 工具链、Python 依赖（`requirements.txt`）、字体备料、初始化顺序、验收命令 | 新机器第一次跑，或换了 Node / Chrome / GS / Python |
| [`style.md`](style.md) | 字体（Google Sans Flex 只用字重轴）、令牌、颜色、线、分层、图、文件组织 | 动任何版式之前 |
| [`architecture.md`](architecture.md) | 调用链路、隐性契约 C1–C12、模块划分与迁移映射 | 改目录结构、拆模块、加一个构建阶段之前 |
| [`git.md`](git.md) | Conventional Commits、原子提交、breaking change 必须单独提交 | 每次提交之前 |

另有 `DESIGN-TOKENS.md`（版式取值出处）与 `AGENTS.md`（环境与踩过的坑）。

## 优先级

1. `agent/` 里的标准
2. `DESIGN-TOKENS.md` 的取值
3. 现有代码的既有取值

发现三者不一致：**以成品 PDF 的实际渲染为准**，然后把另外两处改齐，不要留三套说法。

## 三条最容易违反的

1. **字体只动字重轴**：不开 `wdth` / `opsz` / `ROND` / `slnt` / `GRAD`，不写 `font-variation-settings`（`style.md` §1）。
2. **满版只画在 overlay 层**：正文层里超出版心的元素会让 Chrome 把整本书等比缩小（`style.md` §5）。
3. **breaking change 单独提交**并带 `!` + `BREAKING CHANGE:` 段（`git.md` §3）。

## 新增一份规范

在 `agent/` 建 `<主题>.md`，开头写清「管什么 / 什么时候读 / 与谁冲突时谁优先」，然后在上表加一行。规范里不要贴大段代码——代码在 `scripts/` 与 `src/`，规范只写约束和理由。

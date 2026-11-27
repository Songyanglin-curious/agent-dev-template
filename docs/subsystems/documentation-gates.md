# 文档门禁

本页说明 `scripts/` 中门禁脚本共同承担的职责：它们检查哪些语料、以什么方式报告失败、由哪些清单驱动，以及新增门禁时契约如何扩展。单条规则的写作依据在 [文档标准](../AGENTS.md)，触发时机在根 [AGENTS.md](../../AGENTS.md)。

## 概念

门禁是把“可以机械判定的结构约束”从评审中移出的机制。它不判断内容是否真实、有价值或归属正确；这些仍由评审、[doc-writing](../../.agents/skills/doc-writing/SKILL.md) 和 [prose-standard](../../.agents/skills/prose-standard/SKILL.md) 负责。

每条门禁由三部分构成：要扫描的语料（glob 或清单）、要验证的结构（元数据、章节、链接、预算、冻结 hash 等），以及失败时的诊断。门禁不修改文件；唯一例外是 `verify-archived-agent-notes --write` 追加新封存 hash。

## 共同契约

- **退出码表达结果。** 通过时退出 0 并打印一行摘要；失败时向 stderr 输出每条违规并以非零退出。
- **诊断可定位。** 每条失败说明文件、行号（可得时）和期望值，使读者不需要复现脚本逻辑。
- **语料只由清单和 glob 决定。** 不硬编码文件列表；语料意外为空时，摘要中的计数会让读者发现。
- **不做隐式修复。** 门禁不重排格式、不补链接、不生成内容；修复是作者的变更。
- **共享解析只实现一次。** Markdown 解析、frontmatter、链接、表格、文件发现和字数口径集中在共享模块，门禁不得各自复制。

## 门禁清单

| 命令 | 扫描语料 | 检查 |
|---|---|---|
| `verify-doc-metadata` | 维护中的 `README.md` | 带 `kind` 的 README 具有合法 `kind` 与 `description`，kind 有对应模板，无禁用字段，标题存在 |
| `verify-module-readmes` | 同上，按 `kind` 过滤 | 模块摘要与 `已知限制与暂缓工作` 章节；模块组不得携带限制类章节；豁免清单有效 |
| `verify-module-groups` | 同上 | 模块组必须含 `## 模块与职责` 表，每行链接真实存在的 module 或 module-group 文档，且不含模块专属章节 |
| `verify-subsystem-pages` | 所有 module-group 文档，加上未被任何模块组列出的 module 文档 | 每个单元至少链接一个存在的 `docs/subsystems/*.md`，否则需要登记豁免；失效豁免会失败 |
| `verify-doc-refs` | `src/`、`app/`、`scripts/` 下的源码（排除 `scripts/tests/` 测试夹具） | 注释中引用的 `docs/...` 与 `.agents/notes/...` 路径必须存在 |
| `verify-persistence-records` | `docs/persistence-changes/**/*.md` | 记录位置、frontmatter、必需章节、唯一 YAML 声明块、digest 语法、前驱记录、伴生 schema |
| `verify-generated-docs` | 维护中的 Markdown（含模块 README） | 生成区域标记成对、不嵌套、不重复，且每个含生成区域的文档在清单中声明生产者 |
| `verify-md-wrap` | 维护中的 Markdown（根、`docs/`、Notes、Skills、模块 README；排除研发输入与归档） | 每个段落只占一个物理行；归档记录除外 |
| `verify-md-links` | 同上 | 相对链接目标存在；指向 Markdown 的锚点存在 |
| `verify-repository-references` | Git 跟踪与未忽略的新维护文件（排除 `vendor/`、归档记录、`研发输入/`） | 维护中的文件不引用可解析为 commit 的十六进制标识；原始资料保留原文，不因门禁改写 |
| `verify-doc-budgets` | `scripts/doc-budgets.manifest.json` 登记的文件 | 每个常驻文档不超过登记上限；缺失文件失败 |
| `verify-agent-note-classification` | `.agents/notes/{proposed,implemented,rejected}/` | 生命周期、类别目录与文件名结构合法，禁止集中索引 |
| `verify-agent-note-format` | 活跃 Agent Note | 头部三行、`Status:` 与目录一致、必需章节、`## Alternatives considered`、implemented 禁用提案标题 |
| `verify-archived-agent-notes` | `archived/{kind}/` 与冻结清单 | 归档元数据、内容 hash、只增不改的 manifest；`--write` 追加新 hash |
| `verify-change-docs` | 相对基线变更的文件 | 按清单输出每个改动对应的文档归属方；`require` 规则只在 `--strict` 下缺失即失败 |

`pnpm run test:docs` 依次运行结构、引用、持久化、生成区域、段落换行、链接、提交号、预算和变更影响检查；`pnpm run test:notes` 运行三条 Agent Note 检查；`pnpm run test:gates` 运行关键门禁的失败路径测试。单独运行某个门禁用于定位问题，交付前仍需跑总入口。

## 共享工具

| 模块 | 职责 |
|---|---|
| `doc-tooling.ts` | frontmatter、标题、H2 章节、链接、表格、仓库 Markdown 发现、仓库根路径 |
| `verify-md-links.ts` | 链接与锚点解析，含同一文件的 `#fragment`；根路径与外部 URL 跳过 |
| `repo-files.ts` | 不复用 Node glob 的确定性目录遍历、glob 段匹配、符号链接去重、行级引用扫描 |
| `markdown.ts` | Markdown AST 解析与遍历，供换行和链接检查使用 |
| `doc-units.ts` | 字数口径：CJK 字符逐个计数，其余按空白分词；模块摘要用两字一词的等量口径 |
| `agent-note-tree.ts` | Agent Note 生命周期与类别的封闭集合、目录遍历 |
| `archived-agent-notes.ts` | 归档记录解析与内容 hash 计算 |

## 清单文件

| 清单 | 作用 |
|---|---|
| `scripts/doc-budgets.manifest.json` | 常驻文档路径到字数上限的映射 |
| `scripts/generated-docs.manifest.json` | 含生成区域的文档到生产者的映射 |
| `scripts/module-readme-limitations.allowlist.json` | 无限制章节的模块文档及理由 |
| `scripts/subsystem-page-exemptions.json` | 不链接子系统页的单元及理由 |
| `scripts/change-doc-rules.json` | 改动 glob 到文档归属方的映射与提示级别 |
| `.agents/notes/archived/manifest.json` | 归档记录的内容 hash，只增不改 |

## 变更影响检查

`verify-change-docs` 读取 Git 中相对基线（默认 `HEAD`）的改动，包括工作区与未跟踪文件，按 `scripts/change-doc-rules.json` 匹配规则并打印归属方。`remind` 规则始终只提示；`require` 规则仅在 `--strict` 下要求归属文档也出现在本次改动中，否则退出非零。`--strict` 不会把 `remind` 提升为强制，因此当前没有 `require` 规则时它没有实际强制效果。CI 用 `node scripts/verify-change-docs.ts --base "origin/${{ github.base_ref }}" --strict` 执行已建立的强制规则。

规则只声明“哪类改动由哪份文档拥有”，不尝试推断改动语义。代码变化不一定意味着文档描述的事实变化，例如修复脚本内部的异常处理通常不需要修改架构页；因此不为了使用严格模式而人为增加 `require` 规则。一条规则覆盖的变动范围过宽会产生噪音，过窄会漏掉影响；按实际归属调整。

## 回归测试与 CI

`pnpm run test:gates` 用 `node:test` 在临时工作区运行关键门禁的失败路径：坏链接（含模块 README）、缺失的预算文档、无效基线、Git 缺失时的跳过、错误的 Agent Note 格式、维护文件中的 commit 标识、模块组与独立模块混合时的子系统关联、模块摘要与三类持久化记录的中文标题，以及 `require` 在默认与 `--strict` 下的差异；同时验证 `研发输入/` 中的原始 commit 标识被排除。正向通过不能证明门禁能发现错误，新增或修改门禁时同时补失败用例。

`.github/workflows/docs.yml` 在 push 和 pull request 上运行 `test:gates`、`test:tools`、`test:docs`、`test:notes`；pull request 额外以 `--strict` 运行变更影响检查。CI 能发现问题，但只有把该工作流设为仓库的必需检查，才会阻止不合规的合并。

## 新增门禁

按 [新增文档门禁](../cookbook/add-a-doc-gate.md) 执行：先确认约束可机械判定且已有唯一归属，再复用共享解析工具实现，登记命令、清单与文档，增加失败路径用例，最后运行 `pnpm run test:docs` 与 `pnpm run test:gates`。

## 已知限制与暂缓工作

- 不检查文档中的 TypeScript 代码、类型与源码等价、Mermaid 图；这些依赖具体技术栈，接入项目的真实代码后再实现。
- 模块文档按 `kind` 发现；未声明元数据的 README 不会进入模块门禁，也不会有失败提示，由评审发现。当前不引入模块清单。
- `verify-change-docs` 在无 Git 或非 Git 仓库时跳过并说明；显式基线无法解析时以非零退出并报告基线。它只按路径匹配，不能判断改动是否真的影响文档语义。
- 回归测试覆盖关键门禁的代表性失败路径，不覆盖每条规则和每个分支；零记录的持久化、模块组、归档和生成区域机制仍只有代码审阅。
- 字数口径是跨语言近似，不按词形还原或分词词典计算。

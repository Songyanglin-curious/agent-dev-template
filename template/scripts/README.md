---
description: "文档与研发门禁脚本的模块说明：各检查如何运行、失败如何表达、共享解析如何组织，供维护和扩展门禁时查阅。"
kind: "module"
---
# scripts

## 摘要

本模块提供文档、任务与决策记录的结构检查，以及按基线列变更路径的工具。每个检查可单独运行，也可由 `test:docs`、`test:notes` 串联；通过退出码和可定位诊断报告结果。共享模块承担 Markdown、frontmatter、链接、文件发现和字数口径，门禁只实现各自的检查规则。内容是否属实、归属是否合理仍由评审和 Skills 判断。

## 能力说明

门禁覆盖文档元数据与模块关联、链接与锚点、段落换行、提交号引用、字数预算、持久化记录、生成区域、研发任务和 Agent Note 分类与归档；`change-scope` 报告相对基线的已提交、暂存、未暂存与未跟踪路径；关键检查与工具配有失败路径测试。

### 适用场景

改动文档、任务或 Note 后核验结构；定位某条门禁的失败原因；为项目新增一条可机械判定的约束。项目业务代码的构建、测试和发布不属于本模块。

## 使用方式

### 前置条件

Node.js ≥ 22.18（直接运行 `.ts` 脚本）并在项目根执行过 `pnpm install --frozen-lockfile`。`change-scope`、`verify-change-docs`、`verify-repository-references` 和 `verify-archived-agent-notes` 需要项目自己的 Git 工作树；`verify-change-docs` 还需可解析的基线引用，`verify-archived-agent-notes` 还需可读的 `HEAD` 或 `AGENT_NOTE_ARCHIVE_BASE_REF`。项目根没有 Git 工作树时，前三项与无归档内容的归档校验会报告跳过，`change-scope` 和归档写入则以非零退出报告缺基线。

### 常用入口

```sh
pnpm run test:docs
pnpm run test:notes
pnpm run verify-tasks
pnpm run test:gates
pnpm run test:tools
pnpm run change-scope --base <ref>
pnpm run verify-doc-budgets --list
pnpm run verify-change-docs --list-rules
```

成功时打印摘要并以 0 退出；失败时向 stderr 输出每条违规并以非零退出。`verify-change-docs` 默认只提示，`--strict` 只执行 `require` 规则；`--list-rules` 不需要 Git。

### 配置

| 文件或参数 | 作用 |
|---|---|
| `doc-budgets.manifest.json` | 常驻文档路径到字数上限的映射 |
| `change-doc-rules.json` | 改动路径到文档归属方的映射、级别与升级条件 |
| `generated-docs.manifest.json` | 含生成区域的文档到生产者的映射 |
| `module-readme-limitations.allowlist.json`、`subsystem-page-exemptions.json` | 带理由的豁免 |
| `verify-archived-agent-notes --write` | 为新增归档记录追加封印 hash |
| `verify-doc-budgets --list` | 打印每个登记文档的用量 |

## 行为契约

- 通过时退出 0 并打印一行摘要；失败时非零退出，向 stderr 输出文件、可得的行号与期望值。
- 语料由 glob 或清单决定并报告实际数量；语料为空也打印计数，不以“零文件通过”冒充全覆盖。
- 门禁不修改文件；唯一的写入是 `verify-archived-agent-notes --write` 追加封印。
- 冻结的归档 Note 不参与链接与措辞检查；归档校验器拒绝任何内容改动。
- 涉及 Git 的检查只使用项目自己的工作树；没有工作树时报告跳过，不借用上层仓库的历史制造通过结果。

## 职责边界

- 负责：结构检查的实现、共享解析、清单读取、退出语义与诊断格式。
- 不负责：规则依据（→ [文档标准](../docs/AGENTS.md)）、各检查的语料与清单说明（→ [文档门禁](../docs/subsystems/documentation-gates.md)）、触发时机（→ 根 [AGENTS.md](../AGENTS.md)）、设计理由（→ [Agent Note](../.agents/notes/README.md)）。

## 内部设计

<details>
<summary>实现细节 — 点击展开</summary>

每个门禁是独立入口脚本：解析参数、读取清单、用共享工具取得语料、逐项验证、汇总失败。共享层只提供事实提取，不承载具体策略。

### 依赖关系

入口脚本依赖 `doc-tooling.ts`、`repo-files.ts`、`markdown.ts`、`doc-units.ts`、`agent-note-tree.ts` 和 `archived-agent-notes.ts`；这些模块只依赖 Node 标准库与 `mdast`、`js-yaml` 依赖。门禁之间不互相导入，避免检查顺序影响结果。

### 源码导航

| 路径 | 职责 |
|---|---|
| `verify-doc-metadata.ts` | README frontmatter 与 kind 到模板的映射 |
| `verify-module-readmes.ts` | 模块摘要与限制章节 |
| `verify-module-groups.ts` | 模块组职责表与禁写章节 |
| `verify-subsystem-pages.ts` | 模块或模块组到子系统页的关联 |
| `verify-doc-refs.ts` | 源码注释中的文档路径引用 |
| `verify-persistence-records.ts` | 持久化记录的位置、声明与 schema 伴生 |
| `verify-generated-docs.ts` | 生成区域标记与生产者声明 |
| `verify-md-wrap.ts`、`verify-md-links.ts` | 段落物理行、相对链接与锚点 |
| `verify-repository-references.ts` | 维护文件中的 commit 标识 |
| `verify-tasks.ts` | 研发任务目录、状态、章节与本地引用 |
| `verify-doc-budgets.ts` | 常驻文档字数上限 |
| `verify-agent-note-classification.ts`、`verify-agent-note-format.ts`、`verify-archived-agent-notes.ts` | Agent Note 结构、格式与冻结归档 |
| `verify-change-docs.ts`、`change-scope.ts` | 变更影响清单与变更范围报告 |
| `doc-tooling.ts`、`repo-files.ts`、`markdown.ts`、`doc-units.ts`、`agent-note-tree.ts`、`archived-agent-notes.ts` | 共享解析与遍历 |
| `tests/gates.test.ts`、`tests/change-scope.test.ts` | 门禁与范围工具的失败路径测试 |

</details>

## 延伸阅读

- [文档门禁](../docs/subsystems/documentation-gates.md)：每条检查的语料、清单与失败语义。
- [文档标准](../docs/AGENTS.md)：文档层级、写作规则与字数预算。
- [Agent Note 规则](../.agents/notes/README.md)：生命周期、格式与冻结归档。
- [新增文档门禁](../docs/cookbook/add-a-doc-gate.md)：扩展工具链的固定步骤。

## 已知限制与暂缓工作

- 不检查文档中的代码示例、类型等价或图表语法；接入项目按自身技术栈补充。
- 源码文档引用只扫描 `src/`、`app/`、`scripts/` 与已列出的扩展名；其他语言或目录需在同一检查中配置。
- 模块类文档按 `kind` 发现；未声明元数据的 README 不进入检查，由评审发现。
- `verify-change-docs` 只按路径匹配归属文档，不能判断改动是否影响语义；模板不带规则，`--strict` 需项目自行声明 `require` 后才有效。
- 回归测试覆盖代表性失败路径，不覆盖每条规则与每个分支；字数口径是跨语言近似值。

## 开发备注

<details>
<summary>维护者的工作语境 — 点击展开</summary>

None.

</details>

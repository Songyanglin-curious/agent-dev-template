---
description: "文档与研发门禁脚本的模块说明：各检查如何运行、失败如何表达、共享解析如何组织，供维护和扩展门禁时查阅。"
kind: "module"
---
# scripts

## Summary

本模块是仓库的文档与研发门禁工具链。它提供一组可单独运行、也可由 `test:docs` 和 `test:notes` 串联的检查脚本，用退出码和可定位诊断报告结构违规，并通过共享解析模块避免每条门禁复制 Markdown、frontmatter 与文件发现逻辑；`change-scope` 另外报告相对基线的变更路径。门禁只判断可机械验证的结构，内容质量与归属判断仍属于评审和 Skills。

## Table of Contents

- [能力说明](#能力说明)
- [使用方式](#使用方式)
- [行为契约](#行为契约)
- [职责边界](#职责边界)
- [内部设计](#内部设计)
- [Further Exploration](#further-exploration)
- [已知限制与暂缓工作](#已知限制与暂缓工作)
- [Dev Note](#dev-note)

## 能力说明

门禁工具链覆盖文档结构、Agent Note 生命周期、链接与锚点、段落换行、提交号引用、字数预算、持久化记录、生成区域、模块与子系统关联，以及变更影响清单；`change-scope` 报告已提交、暂存、未暂存和未跟踪路径；关键门禁与工具配有回归测试。每条门禁只回答一个结构问题，失败时直接指向需要修改的位置。

### 适用场景

当你需要验证文档改动、定位某个门禁的失败原因，或给项目新增一条结构约束时使用本模块。不需要完整文档检查时，单独运行对应脚本即可；交付前仍以总入口为准。

## 使用方式

### 前置条件

Node ≥ 22.18（直接运行 `.ts` 脚本），仓库依赖已安装。`verify-repository-references`、`verify-change-docs` 与 `verify-archived-agent-notes` 还需要可用的 Git 仓库；`verify-change-docs` 需要可解析的基线引用，`verify-archived-agent-notes` 需要可读的 `HEAD` 或 `AGENT_NOTE_ARCHIVE_BASE_REF`。

### 最小可用示例

```sh
pnpm run test:gates
pnpm run test:tools
pnpm run test:docs
pnpm run test:notes
pnpm run change-scope --base main
node scripts/verify-doc-budgets.ts --list
node scripts/verify-change-docs.ts --base main --strict
```

成功时脚本打印一行摘要并以 0 退出；失败时把每条违规写到 stderr 并以非零退出。`verify-change-docs` 默认只提示，`--strict` 只执行标记为 `require` 的规则；当前没有这类规则时，`--strict` 会明确说明没有强制效果。

### 配置

| 配置项 | 默认值 | 含义 |
|---|---|---|
| `doc-budgets.manifest.json` | 登记的常驻文档 | 常驻文档路径到字数上限的映射 |
| `change-doc-rules.json` | 本仓库的归属规则 | 改动 glob 到文档归属方的映射与提示级别 |
| `verify-archived-agent-notes --write` | 不加参数时只校验 | 追加新归档记录的封存 hash |
| `verify-doc-budgets --list` | 不加参数时只校验 | 打印每个登记文档的用量 |

## 行为契约

- 通过时退出 0，只向 stdout 打印摘要；失败时退出非零，向 stderr 打印每条违规。
- 诊断包含仓库相对路径，可得时包含行号和期望值。
- 文件发现结果按稳定顺序处理，诊断顺序与文件顺序一致，不因目录列举顺序变化。
- 门禁不修改源文件；`verify-archived-agent-notes --write` 只追加封存 hash。
- 归档 Agent Note 被视为冻结历史：链接检查跳过它们的出站链接，归档校验器拒绝任何内容改动。
- 语料为空时仍报告计数，让“零文件通过”暴露出来而不是静默成功。
- 关键门禁的失败路径由 `pnpm run test:gates` 覆盖；新增或修改门禁时同时增加用例。

## 职责边界

- 本模块负责：结构检查的实现、共享解析、清单读取、退出语义和诊断格式。
- 本模块不负责：单条规则的内容依据（→ [文档标准](../docs/AGENTS.md)）、各门禁的语料与清单说明（→ [文档门禁](../docs/subsystems/documentation-gates.md)）、触发时机（→ 根 [AGENTS.md](../AGENTS.md)）、设计理由（→ Agent Note）。
- 具体业务项目的构建、测试、发布和代码风格检查不在本模块范围内。

## 内部设计

<details>
<summary>实现细节 — 点击展开</summary>

每个门禁是一个独立入口脚本：解析参数、读取清单、用共享工具取得语料、逐项验证、汇总失败。共享层只提供事实提取，不包含某条门禁的策略。

### 依赖关系

入口脚本依赖 `doc-tooling.ts`、`repo-files.ts`、`markdown.ts`、`doc-units.ts`、`agent-note-tree.ts` 和 `archived-agent-notes.ts`。这些模块只依赖 Node 标准库与 `mdast`/`js-yaml` 依赖；门禁之间不互相导入，避免检查顺序影响结果。

### 源码导航

| 路径 | 职责 |
|---|---|
| `verify-doc-metadata.ts` | README frontmatter 与 kind 到模板的映射 |
| `verify-module-readmes.ts` | 模块 Summary 与限制章节 |
| `verify-module-groups.ts` | 模块组的职责表与禁写章节 |
| `verify-subsystem-pages.ts` | 模块或模块组到子系统页的关联 |
| `verify-doc-refs.ts` | 源码注释中的文档路径引用 |
| `verify-persistence-records.ts` | 持久化记录的位置、声明与 schema 伴生 |
| `verify-generated-docs.ts` | 生成区域标记与生产者声明 |
| `verify-md-wrap.ts` | 段落物理行规则 |
| `verify-md-links.ts` | 相对链接与锚点 |
| `verify-repository-references.ts` | 维护文件中的 commit 标识（排除研发输入、归档和 vendor） |
| `change-scope.ts` | 按基线报告已提交、暂存、未暂存和未跟踪路径 |
| `verify-doc-budgets.ts` | 常驻文档字数上限 |
| `verify-agent-note-classification.ts` | Agent Note 目录与文件名结构 |
| `verify-agent-note-format.ts` | Agent Note 头部、状态与章节 |
| `verify-archived-agent-notes.ts` | 归档元数据与冻结 hash |
| `verify-change-docs.ts` | 变更文件到文档归属方的清单 |
| `tests/gates.test.ts` | 关键门禁的失败路径回归测试 |
| `tests/change-scope.test.ts` | 变更范围分类与基线错误测试 |
| `doc-tooling.ts` | frontmatter、标题、章节、链接、表格与语料发现 |
| `repo-files.ts` | 确定性 glob 遍历、符号链接去重与行级扫描 |
| `markdown.ts` | Markdown AST 解析与遍历 |
| `doc-units.ts` | 字数与词等量口径 |
| `agent-note-tree.ts` | Agent Note 生命周期与类别的封闭集合 |
| `archived-agent-notes.ts` | 归档记录解析与内容 hash |

</details>

## Further Exploration

- [文档门禁](../docs/subsystems/documentation-gates.md)：每条门禁的语料、清单和失败语义。
- [文档标准](../docs/AGENTS.md)：文档层级、写作规则与字数预算的依据。
- [Agent Note 规则](../.agents/notes/README.md)：生命周期、格式和归档冻结格式。
- [新增文档门禁](../docs/cookbook/add-a-doc-gate.md)：扩展工具链的固定步骤。

## 已知限制与暂缓工作

- 门禁不检查 Markdown 中的 TypeScript 示例和类型等价，也没有 Mermaid 校验；接入真实代码库后按需增加。
- 模块门禁按 `kind` 发现文档；未声明元数据的 README 不进入检查，由评审发现，当前不引入模块清单。
- `verify-change-docs` 只按路径 glob 匹配归属文档，不能判断改动是否真的影响该文档的语义；默认只提示，`require` 规则仅在 `--strict` 下失败。
- 回归测试覆盖关键门禁的代表性失败路径，不覆盖每条规则和每个分支；零记录的持久化、模块组、归档和生成区域机制仍只有代码审阅。
- 字数口径是跨语言近似值，不按词典分词；上限是护栏，不是质量指标。

## Dev Note

<details>
<summary>维护者的工作语境 — 点击展开</summary>

None.

</details>

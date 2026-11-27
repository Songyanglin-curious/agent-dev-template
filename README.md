# agent-dev-template

面向 AI Agent 辅助软件研发的项目模板。它把研发输入、研发任务、设计决策、系统认知和工程知识放进各自唯一的归属位置，并让文档维护成为研发流程的一部分，而不是研发结束后的整理工作。

本仓库既是模板源仓库，也是这套体系的第一次实践：`docs/` 记录体系自身，研发活动本身用来验证和修正这套体系。

## 解决什么问题

- **认知分层**：架构、子系统、模块文档分别回答“由什么组成”“能力契约是什么”“这个单元怎么用”，读者按需深入。
- **决策留存**：Agent Notes 记录问题、方案、取舍和后果，被否决的方案一并保留，避免反复争论。
- **文档跟随研发**：触发表、专项 Skills 和变更影响检查共同推动一次改动同步它所属的文档。
- **知识参与研发**：缺陷模式、开发准则、操作指南和 Skills 在对应场景被加载，而不是堆在知识库里。
- **机械约束优先**：能由脚本判定的结构、格式、链接、预算和冻结规则不依赖 Agent 自觉。

## 组成

| 部分 | 目录 | 负责 |
|---|---|---|
| 研发输入 | `研发输入/` | 原始需求、外部约束、参考资料、梳理草稿 |
| 研发任务 | `研发任务/` | 当前任务目标、范围、进展、交付与归档 |
| 研发演进 | `.agents/notes/` | 问题、方案、决策、取舍、否决与归档 |
| 系统认知 | `docs/architecture.md`、`docs/subsystems/`、模块 README、`docs/persistence-changes/` | 当前系统是什么样 |
| 工程知识 | `docs/core-guidelines/`、`docs/defensive-patterns/`、`docs/cookbook/`、`docs/postmortem/`、`.agents/skills/` | 怎样正确地设计和操作 |
| 治理 | 根 `AGENTS.md`、`docs/AGENTS.md`、`scripts/` | 何时做、做没做、格式是否正确 |

对参考体系（DSH）的研究结论见 [对 DSH 开发体系研究](docs/对dsh开发体系研究/README.md)；它记录可复用的设计原则和不采纳的理由，不是本仓库的规则。

职责边界与信息流见 [体系架构](docs/architecture.md)；任务边界见根 [AGENTS.md](AGENTS.md)；任务记录见 [研发任务规则](研发任务/README.md)；文档与决策规则见 [文档标准](docs/AGENTS.md) 与 [Agent Note 规则](.agents/notes/README.md)，专项操作见各 [Skill](.agents/skills/)。

## 命令

```sh
pnpm install                     # Node ≥ 22.18
pnpm run change-scope --base main # 列出相对基线的变更路径
pnpm run test:gates              # 关键门禁的失败路径测试
pnpm run test:tools              # 变更范围等工具的测试
pnpm run verify-tasks            # 研发任务结构与引用门禁
pnpm run test:docs               # 文档门禁总入口
pnpm run test:notes              # Agent Note 门禁
pnpm run verify-change-docs      # 列出本次改动需要核对的文档（本地提醒）
pnpm run verify-doc-budgets --list
```

全部命令与触发时机见 [AGENTS.md](AGENTS.md)。

## 持续集成

`.github/workflows/docs.yml` 在 push 与 pull request 上运行 `test:gates`、`test:tools`、`verify-tasks`、`test:docs` 和 `test:notes`；pull request 额外以 `--strict` 运行变更影响检查。CI 能发现问题，但只有把该工作流设为仓库的必需检查，才会阻止不合规的合并。

## 已知限制

- 提供轻量任务记录（`研发任务/`），但不提供 Issue、看板、优先级或自动任务流转；调查、实施、文档同步、记录和检查按任务性质触发，边界见根 `AGENTS.md`。
- 这套体系只提供通用的文档与流程机制，不包含任何具体技术栈的代码检查、构建或发布流程。
- 语义层面的归属判断和内容质量仍由评审与 Skill 承担，脚本只检查可机械判定的结构。
- 模块门禁按 `kind` 发现文档；未声明元数据的 README 不进入检查，由评审发现。
- 变更影响检查本地默认提醒；CI 的 `--strict` 只执行 `require` 规则并报告其数量，当前没有这类规则；规则级别与升级条件用 `verify-change-docs --list-rules` 查看。
- 本仓库当前只维护模板的源体系；通用交付内容在体系经过自身研发验证后单独整理。

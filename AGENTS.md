# AGENTS.md

agent-dev-template：面向 AI Agent 辅助软件研发的项目模板，以研发文档体系本身为交付物。说明见 [README](README.md)，体系结构见 [docs/architecture.md](docs/architecture.md)。

- 维护文档遵循 [docs/AGENTS.md](docs/AGENTS.md)。
- `研发输入/` 只保存原始需求、外部约束和资料，不写已确认的决策；研发任务与 Agent Note 通过引用关联，不建 Issue 系统。

## 任务与授权

- 调查、研究、讨论默认只读。
- 实施任务在明确范围内自主完成必要修改；用户明确要求的跨模块契约变更直接实施并做影响分析。
- 实施中发现必须改变用户未要求的契约、目标或重要约束时，暂停并说明原因、影响和方案。
- 按实际变更触发文档、Note 和专项规则；具体对应关系见下方触发表。
- 按变更范围选择检查；交付说明实际变更、验证、风险和状态；交付不等于发布。

## 研发活动触发

| 改动或活动 | 同一次变更中必须完成 |
|---|---|
| 修改 `scripts/` 中的门禁、共享工具或清单 | 更新 [文档门禁](docs/subsystems/documentation-gates.md)；必要时同步 [scripts 模块](scripts/README.md)；修改门禁逻辑时增加或调整失败路径用例 |
| 修改 Agent Note 规则、目录或校验脚本 | 更新 [Agent Note 规则](.agents/notes/README.md)；机制说明变化时同步 [体系架构](docs/architecture.md)，运行 `pnpm run test:notes` |
| 新增或修改 `docs/` 层级、文档 kind 或写作规则 | 更新 [文档标准](docs/AGENTS.md) 与字数预算清单；层级或组成变化时同步 [体系架构](docs/architecture.md) |
| 产生长期有效的设计取舍 | 新建或更新 Agent Note；被取代的记录按规则归档或合并 |
| 修复隐蔽、系统性或重复发现成本高的缺陷 | 更新 [复盘](docs/postmortem/README.md) 与对应 [防御性模式](docs/defensive-patterns/README.md) |
| 形成已验证、会重复执行的操作步骤 | 写入 [cookbook](docs/cookbook/README.md)，并从触发它的文档链接 |
| 同一正确或错误写法在评审中反复出现 | 提炼为 [核心准则](docs/core-guidelines/README.md) 或防御性模式 |
| 新增或变更持久化数据结构 | 按 [持久化记录](docs/persistence-changes/README.md) 新建记录 |

## 命令

| 用途 | 命令 |
|---|---|
| 安装依赖 | `pnpm install` |
| 变更范围 | `pnpm run change-scope --base <ref>` |
| 文档门禁 | `pnpm run test:docs` |
| 门禁失败路径测试 | `pnpm run test:gates` |
| 工具测试 | `pnpm run test:tools` |
| Agent Note 门禁 | `pnpm run test:notes` |
| 变更影响清单 | `pnpm run verify-change-docs` |
| 文档字数用量 | `pnpm run verify-doc-budgets --list` |

## 审查与验证

- 评审变更使用 [code-review](.agents/skills/code-review/SKILL.md)：先建立范围和依据，再用证据报告 blocker/suggestion；不把清单当通过条件。
- 提交或推送前使用 [pre-push-checks](.agents/skills/pre-push-checks/SKILL.md)：按变更范围选择最小检查，不默认全量；失败停止，不重复已通过的检查。CI 在 push/PR 上运行同一组检查。
- 初始化或接入项目使用 [project-onboarding](.agents/skills/project-onboarding/SKILL.md)：以代码和实际行为调查，由人确认架构和模块边界。
- 用 `pnpm run verify-change-docs` 逐项核对文档影响；本地默认提示，CI 的 `--strict` 只执行已建立的 `require` 规则。不把未执行或未通过的检查报告为通过。
- 交付说明列出实际执行的命令和结果；未覆盖或未验证的事项必须明确说明。

# AGENTS.md

项目定位与使用入口见 [README](README.md)，系统组成与修改入口见[架构](docs/architecture.md)。按这次任务选择规则，不执行统一流水线。

## 范围与授权

- 调查、研究、讨论默认只读。实施时在明确范围内自主完成必要修改；用户已要求的跨模块契约变更直接做，并分析影响。
- 若必须改变未获授权的目标、契约或重要约束，先说明原因、影响和方案，暂停确认。交付不等于发布；部署、生产迁移与外部删除另行授权。
- [研发输入](研发输入/README.md)保留原始依据，[研发任务](研发任务/README.md)记录本次范围与交付，[Agent Note](.agents/notes/README.md)保留长期理由，[项目文档](docs/AGENTS.md)描述当前事实。用链接关联，不复制正文。

## 同一次变更的触发项

| 触发 | 应做什么 |
|---|---|
| 需要跨回合维护目标、进展与验收 | 用[任务管理](.agents/skills/task-management/SKILL.md)建立或更新一份任务，状态变化时移动原文件；运行任务门禁。问答与一次性小改动不建任务。 |
| 产生长期设计取舍，或修改 Note 规则 | 更新归属 Note，检查是否取代旧记录；规则变化同步 [Note 说明](.agents/notes/README.md)。运行 Note 门禁。 |
| 修改文档层级、kind 或写作规则 | 更新[文档标准](docs/AGENTS.md)、模板和相关预算；系统组成或边界变化同步架构；运行文档门禁。 |
| 修改门禁、共享工具或清单 | 更新[文档门禁](docs/subsystems/documentation-gates.md)和受影响的[工具说明](scripts/README.md)；逻辑变化补失败路径用例。 |
| 修复隐蔽、系统性或重复发现成本高的缺陷 | 写[复盘](docs/postmortem/README.md)，并更新对应[防御模式](docs/defensive-patterns/README.md)。 |
| 步骤已验证且会重复执行；或同类写法反复出现 | 前者写入 [cookbook](docs/cookbook/README.md)，后者提炼为[准则](docs/core-guidelines/README.md)或防御模式。 |
| 新增或改变持久化结构 | 按[记录规则](docs/persistence-changes/README.md)核对受影响的格式与兼容要求；项目负责提供真实结构证据。 |

## 检查入口

| 用途 | 在项目根目录执行 |
|---|---|
| 安装治理工具依赖 | `pnpm install --frozen-lockfile` |
| 变更范围 | `pnpm run change-scope --base <ref>`（替换为可解析基线） |
| 文档、任务、决策记录 | 按面选 `pnpm run test:docs`、`pnpm run verify-tasks` 或 `pnpm run test:notes` |
| 门禁与范围工具自身的测试 | `pnpm run test:gates`、`pnpm run test:tools` |
| 影响清单、预算用量 | `pnpm run verify-change-docs`、`pnpm run verify-doc-budgets --list` |

评审使用 [code-review](.agents/skills/code-review/SKILL.md)，提交或推送前使用 [pre-push-checks](.agents/skills/pre-push-checks/SKILL.md)，按变更面选最小检查，失败停止。没有配置的 CI 或 Hook 不会代为执行；工具前提与项目接入项见 [README](README.md)。交付报告实际变更、命令与结果、风险及未验证项。

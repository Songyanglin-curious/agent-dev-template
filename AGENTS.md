# AGENTS.md

agent-dev-template：面向 AI Agent 辅助软件研发的项目模板，以研发文档体系本身为交付物。说明见 [README](README.md)，体系结构见 [docs/architecture.md](docs/architecture.md)。

- 非机械性研发任务：先加载 [dev-workflow](.agents/skills/dev-workflow/SKILL.md)，按其流程执行。
- 维护文档遵循 [docs/AGENTS.md](docs/AGENTS.md)。
- `研发输入/` 只保存原始需求、外部约束和资料，不写已确认的决策。

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

## 仓库布局

```text
项目根目录/
├── AGENTS.md    # 常驻研发规则与入口导航
├── README.md    # 项目介绍与使用说明
├── docs/        # 系统认知与工程知识
├── .agents/     # Agent Notes 与专项 Skills
├── .github/     # CI 工作流
├── scripts/     # 工程检查与自动化脚本
└── 研发输入/    # 原始需求、外部约束与参考资料
```

## 命令

| 用途 | 命令 |
|---|---|
| 安装依赖 | `pnpm install` |
| 文档门禁 | `pnpm run test:docs` |
| 门禁失败路径测试 | `pnpm run test:gates` |
| Agent Note 门禁 | `pnpm run test:notes` |
| 变更影响清单 | `pnpm run verify-change-docs` |
| 文档字数用量 | `pnpm run verify-doc-budgets --list` |

### 环境与沙箱故障

如果必需的构建、测试、版本控制或生成命令因运行沙箱拦截（凭据、网络、IPC、文件监听等）而失败，保留原始报错作为证据，以最小必要权限原样重试。严禁借此绕过测试失败、跳过校验或修改测试掩盖问题。

## 审查与验证

- 交付前运行 `pnpm run test:gates`、`pnpm run test:docs` 与 `pnpm run test:notes`；CI 在 push 与 pull request 上运行同一组检查。
- 用 `pnpm run verify-change-docs` 的结果逐项核对文档影响；本地默认提示，CI 的 `--strict` 只执行已建立的 `require` 规则。不把未执行或未通过的检查报告为通过。
- 交付报告列出：改动内容、同步的文档、变更影响清单结果、实际执行的验证命令与结果、未覆盖事项。

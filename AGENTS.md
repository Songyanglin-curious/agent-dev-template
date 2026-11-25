# AGENTS.md

面向 Agent 辅助软件开发的轻量级研发模板项目。

- 维护文档遵循 `docs/AGENTS.md`。
- 修改 `template/` 前先阅读 `docs/architecture.md`。

## 仓库布局

```text
项目根目录/
├── AGENTS.md    # 项目级研发规则与入口导航
├── README.md    # 项目介绍与使用说明
├── docs/        # 系统认知与工程知识
├── .agents/     # 研发记录与专项 Skills
├── scripts/     # 工程检查与自动化脚本
├── template/    # 模板交付产物
└── 研发输入/    # 原始需求、外部约束与参考资料
```

## 命令

```sh
pnpm install                                  # 安装依赖（运行门禁脚本需要 Node ≥ 22.18）
pnpm run verify-agent-note-classification     # 校验 Agent Note 的生命周期、分类目录与文件名
pnpm run verify-agent-note-format             # 校验 Agent Note 的头部、章节与状态行
pnpm run verify-archived-agent-notes          # 校验归档 triplet、元数据与冻结 manifest
pnpm run verify-archived-agent-notes --write  # 归档变更时追加新封存 hash（只增不改）
pnpm run verify-md-links                      # 校验 Markdown 相对链接与锚点
pnpm run verify-md-wrap                       # 校验每个段落只占一个物理行
pnpm run verify-repository-references         # 拒绝指向具体 commit 的历史引用
pnpm run verify-doc-budgets                   # 校验常驻文档字数上限（--list 查看用量）
pnpm run test:docs                            # 文档门禁总入口
```

### 环境与沙箱故障（按需保留）

如果必需的构建、测试、版本控制或生成命令因运行沙箱拦截（凭据、网络、IPC、文件监听等）而失败，保留原始报错作为证据，以最小必要权限原样重试。严禁借此绕过测试失败、跳过校验或修改测试掩盖问题。

## 约定

文档、Agent Note 与 Skill 的创建标准分别见 `docs/AGENTS.md`、`.agents/notes/README.md` 和对应 Skill；新增或修订前先阅读归属方的规则。

## 审查与验证

文档改动提交前运行 `pnpm run test:docs`；放置、归属与字数预算见 `docs/AGENTS.md`。

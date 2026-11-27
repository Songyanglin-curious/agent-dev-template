---
name: pre-push-checks
description: 在本地提交或推送前使用；按 change-scope 报告选择与变更范围相称的最小检查，避免全量和重复执行，失败停止；处理历史重写与存在远端时的验证，发布和部署另行处理。
---
# 本地检查与推送

## 建立变更范围

1. 确认 checkout、分支和未提交改动：

```sh
git status --short --branch
git rev-parse --show-toplevel
```

2. 显式选择基线，运行：

```sh
pnpm run change-scope --base <verified-base>
```

`change-scope` 输出 committed、staged、unstaged、untracked 路径。它不猜测基线，也不决定检查。基线按场景选择：

- **有 upstream**：使用实际 upstream（如 `@{upstream}`），不使用猜测的 `origin/<本地分支>`。
- **纯本地、无远端**：使用本地分支、tag、commit 或 merge-base；只检查工作区时用 `HEAD`，但这不会包含已提交的分支改动。
- **首次推送或新分支**：推送前先明确并记录基线（本地分支、`main`、tag 或用户指定 ref）；不要假设远端已有同名分支。

如果选择的基线无法解析，停止并说明，不退回猜测值。

## 选择证据

没有脱离变更面的“通用全套检查”。每个行为变化至少需要一个会因该回归而失败的最小检查；只有 diff 实际触及的面才扩大范围。

| 变更面 | 优先检查 |
|---|---|
| 文档、链接、预算、模块/子系统关联 | `pnpm run test:docs` |
| Agent Note 规则、目录、格式、归档 | `pnpm run test:notes` |
| 门禁脚本、共享解析、清单、失败路径 | `pnpm run test:gates` + 受影响的单独门禁 |
| `change-scope` 或其他工具 | `pnpm run test:tools` |
| 代码行为 | 拥有该行为的聚焦测试；共享契约变化再加相邻测试 |
| 持久化结构 | 持久化记录检查 + 兼容性/迁移测试 |
| 依赖、manifest、构建入口 | 相关构建、约束和 smoke 检查 |
| UI/CLI/模型可见输出 | 对应的实际检查或快照；测试通过不等于界面被看过 |

- 不默认运行全量测试；CI 负责执行仓库完整检查；多平台矩阵由具体项目按需配置。
- 不重复已经通过且未被新改动影响的检查。
- 不因为“马上要 push”就重复跑 pre-push 已经覆盖的检查。
- 只有用户明确要求、正在诊断 CI、或变更跨到没有更窄可信集合时，才做完整本地 rehearsal。

## 本地 Git 边界

- 提交前检查 `git diff` 和 `git diff --cached`；只提交本次任务的文件，不盲目 `git add -A`。
- 不覆盖用户未提交的改动；不把无关文件、生成物或凭据带入提交。
- **纯本地 Git**：完成本地检查和提交即可，不执行远端验证；报告中明确说明“仅本地”。
- **存在 upstream**：用实际 upstream 作为基线和推送后核对目标，不假设远端名为 `origin`，也不假设远端分支名与本地相同。

```sh
git rev-parse --abbrev-ref --symbolic-full-name '@{upstream}'
git rev-parse HEAD
git rev-parse '@{upstream}'
```

- **首次推送或新分支**：推送前明确 remote 和远端分支，并记录所用基线；推送后用你实际推送的 `<remote>/<remote-branch>` 核对，不按本地分支名猜。

```sh
git remote -v
git push -u <remote> <branch>
git rev-parse '<remote>/<remote-branch>'
```

如果 `@{upstream}` 不存在，就不要执行上游核对；不要为了“看起来完整”而伪造一个 `origin/<branch>`。只有确实存在远端并经用户授权推送时，才执行远端验证。

- 历史重写只在明确授权时进行；使用 `--force-with-lease`，禁止 raw `--force`。
- 推送不等于发布。发布、部署、生产迁移和删除外部资源必须单独授权，并按项目发布流程执行。

## 失败处理

- 相关检查失败时停止普通推送，修复或说明阻断原因；不带着失败推送并期待 CI 不同。
- 保留实际命令、失败测试和平台差异；不要把未执行的检查报告为通过。
- 如果必需的构建、测试、版本控制或生成命令因沙箱拦截（凭据、网络、IPC、文件监听等）失败，保留原始报错作为证据，以最小必要权限原样重试；严禁借此绕过测试失败、跳过校验或修改测试掩盖问题。
- 只有用户明确同意时才绕过本地 hook，并说明失败内容、绕过原因和 CI 预期差异。

## 报告

交付时列出实际执行的命令、结果、未执行或未通过的检查，以及仍是 pending 的远端状态。当前没有平台 CI 时，明确说明验证只在本地完成。

## 相关

- [代码审查](../code-review/SKILL.md)：先判断变更，再选择检查。
- [文档门禁](../../../docs/subsystems/documentation-gates.md)：`test:docs` 的覆盖范围。
- [Agent Note 规则](../../notes/README.md)：Note 生命周期与归档。

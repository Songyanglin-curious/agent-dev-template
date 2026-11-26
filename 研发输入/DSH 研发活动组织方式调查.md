# DSH 研发活动组织方式调查

**研究基线**：`D:\mycode\deepseek-harness`，分支 `master`，提交 `4b399c39a6d1479cd84ca591b4d7c88e24d38a96`（2026-11-22），工作区 clean；调查日 2026-11-26。以下把“仓库明确写下的规则”“从提交历史观察到的行为”“基于证据的推断”分开标注。

**一句话结论**：DSH 有“提案”这个文档生命周期，但**没有“先批准提案、才允许实施”的强制流程**。它的强制机制主要落在三处：同一变更内同步文档和笔记、格式与一致性门禁、以及 PR 合并前的人工批准。实施通常先发生，评审在后；提案只在部分高风险变更中被真正前置。

---

## 一、结论摘要

1. **不是固定流水线。** DSH 没有一条“目标 → 调查 → 提案 → 审批 → 实施 → 验证”的统一流程。流程由根 `AGENTS.md`、多个专项 Skills、Scripts/CI、GitHub PR 约定拼接而成。
2. **提案是可选的设计记录，不是实施许可。** `proposed/` 的规范定义是“实施前评审的提案”，但没有脚本或 CI 检查“改动代码前必须存在 proposed note”。
3. **真正强制的人工关口在 PR 合并前。** 加权审批要求 2 分、CI 要求 `all checks passed`、Issue policy 要求 Issue 和标签；UI 变更还要求设计师/产品评审。这些都是实施完成后的评审，不是实施前的授权。
4. **Plan mode 是唯一的显式“先批准计划、再执行”机制，但它是产品功能，不是仓库研发规则。** 它需要用户主动 `/plan`，而且明确是“soft guidance”，不限制工具调用。
5. **绝大多数 Agent Note 直接以 `implemented` 创建。** 当前 414 条 implemented 中，至少只有 12 条能追溯到 `proposed/` 阶段；其余没有仓库内的提案阶段记录。
6. **这不能硬性阻止“一次改 120 个文件”。** DSH 自己既有 3281 文件的提案先行案例，也有 37 文件、3399 行新增的直接实施案例；规模本身不触发提案，判断权在 Agent 和评审者。

---

## 二、DSH 实际流程：一条“弱流程”

把 DSH 的机制按你提出的四个层次对照：

| 层次 | DSH 对应物                                                                     | 实际作用                                                   |
| ---- | ------------------------------------------------------------------------------ | ---------------------------------------------------------- |
| 原则 | `docs/architecture.md`、`docs/core-guidelines/`、Agent Note 中的 rationale | 解释为什么这样设计，供调查和评审时阅读                     |
| 规则 | 根 `AGENTS.md`、各子树 `AGENTS.md`                                         | 规定什么情况下必须同步什么、必须跑什么检查                 |
| 程序 | `.agents/skills/*/SKILL.md`                                                  | 专项工作流：评审、推送前检查、PR 描述、笔记归档、UI 设计等 |
| 校验 | `scripts/`、tests、CI、GitHub 审批                                           | 检查文档格式、链接、生成物、类型、行为、合并资格           |

关键点是：**校验层检查的是“文档是否一致、格式是否合法、测试是否通过、PR 是否获批”，不检查“实施前是否形成了方案并获授权”。**

一个典型变更的实际路径是：

```text
用户目标 / Issue
  → 读 AGENTS.md、architecture、相关 Agent Notes
  → 按需加载专项 Skill
  → 直接改代码（可能同时写/改 Agent Note）
  → 本地跑相关检查（doc-sync、聚焦测试、build）
  → 开 PR（Issue 引用、PR 描述、AI Usage）
  → CI 跑 static / coverage / build / snapshot / Windows / Python
  → 人工评审 + 加权审批
  → 合并
  → proposed → implemented、归档/合并笔记、补 upgrade guide
```

其中“读 architecture、形成方案”是规范期望，但不是独立阶段，也没有产物强制。

---

## 三、问题 1：研发活动如何组织

### 3.1 Agent 通常如何开始

根 [AGENTS.md:3](../deepseek-harness/AGENTS.md#L3) 的第一条实质规则是：**改 `packages/` 之前先读 `docs/architecture.md`**。这是最接近“先调查”的常驻要求。

除此之外，起步动作分散在 Skills 中：

- [dsh-pre-push-checks:10](../deepseek-harness/.agents/skills/dsh-pre-push-checks/SKILL.md#L10) 要求先确认 checkout/branch，用 `change-scope` 看完整变更范围；
- [dsh-code-review:8](../deepseek-harness/.agents/skills/dsh-code-review/SKILL.md#L8) 要求评审前先跑 `change-scope`，再读 diff 和周边代码；
- [dsh-find-simplifications:10](../deepseek-harness/.agents/skills/dsh-find-simplifications/SKILL.md#L10) 要求先建立范围，读 AGENTS、architecture、defensive patterns、testing policy 和相关笔记。

这些是“调查”的程序性指导，但没有一个统一的“调查完成”产物或检查点。

### 3.2 哪些情况直接实施，哪些先形成提案

从规范和案例看，大致是这样：

| 情况                 | 观察到的处理                                                               | 强制程度                                                                       |
| -------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| 机械性、局部修改     | 直接改；Agent Note 豁免                                                    | 明确豁免（[notes/README.md:48](../deepseek-harness/.agents/notes/README.md#L48)） |
| 局部 UI 调整         | 直接改；但仍需 UI 检查、GIF、必要时设计师/产品评审                         | 笔记豁免，评审不豁免                                                           |
| 局部 bug fix         | 通常直接改，可同时写 `implemented/bug-fix` 笔记                          | 无强制提案                                                                     |
| 单包新功能           | 可以直接实施（如 scoped REPL）                                             | 无强制提案                                                                     |
| 跨包重命名、架构调整 | 可能先写 `proposed/` 笔记，单独 PR 评审（如 repository naming contract） | 规范建议，不强制                                                               |
| 简化调查             | 用 `proposed/simplification` 记录候选和证据；调查不等于实施许可          | Skill 明确要求区分，但无门禁                                                   |
| 持久化结构变更       | 必须写 persistence-change acknowledgement，做兼容性判断                    | **有门禁**                                                               |
| 外部可感知破坏性变更 | 同一次变更内写 upgrade guide                                               | **有门禁**                                                               |
| UI/视觉变更          | 设计评审、实际页面检查、GUI PR GIF；广泛或明显可感知变更需设计师/产品评审  | **有明确规则**                                                           |
| 官方插件图标         | 新 glyph 落地前必须设计师批准                                              | **有明确规则**                                                           |

“提案”主要被用作**设计文档**，而不是**开工许可**。最典型的表述在 [dsh-find-simplifications:8](../deepseek-harness/.agents/skills/dsh-find-simplifications/SKILL.md#L8)：

> “keep the user's scope and distinguish a survey from permission to implement its proposals.”

以及第 24 行：

> “implementation must remain within the user's authorization.”

这两句说明 DSH 的作者明确意识到“调查/提案”和“实施授权”不是一回事。但它们是 Skill 指导，不是 CI 能验证的规则。

### 3.3 DSH 是否存在明确的提案与实施阶段划分？

**有阶段词汇，没有阶段门禁。**

Agent Note 的生命周期是闭集：`proposed` / `implemented` / `rejected`，见 [agent-note-tree.ts:12](../deepseek-harness/scripts/agent-note-tree.ts#L12)。规范定义：

- `proposed/`：实施前评审的提案，尚未构建或仅部分构建（[notes/README.md:12](../deepseek-harness/.agents/notes/README.md#L12)）；
- `implemented/`：决策已交付，并且要随实际代码保持事实准确（[notes/README.md:13](../deepseek-harness/.agents/notes/README.md#L13)）；
- `rejected/`：提案被考虑后拒绝，只在能防止诱人错误时保留（[notes/README.md:14](../deepseek-harness/.agents/notes/README.md#L14)）。

但注意三个事实：

1. **没有 `accepted` 状态。** 一个提案被“接受”后，并不会变成 accepted；它继续留在 `proposed/`，直到实施 PR 把它移入 `implemented/`。因此“提案已批准”在仓库里没有独立记录。
2. **没有“提案必须存在”的检查。** 格式门禁只检查头部、章节、状态与目录一致（[verify-agent-note-format.ts:22](../deepseek-harness/scripts/verify-agent-note-format.ts#L22)）；分类门禁只检查生命周期/类别路径。没有脚本扫描“这个代码变更是否需要一个 proposed note”。
3. **`proposed/` 可以长期停留。** 当前有 52 条 active proposed，最老的日期是 2026-06-11（如 [supply-chain-and-vendor-drift](../deepseek-harness/.agents/notes/proposed/process/2026-06-11-supply-chain-and-vendor-drift.md)），已经五个多月。规范没有评审 SLA，也没有集中索引（[notes/README.md:19](../deepseek-harness/.agents/notes/README.md#L19) 明确禁止 `INDEX.md`）。

因此更准确的说法是：**DSH 提供了一套可选的“提案文档生命周期”，但把它是否使用、何时使用留给判断。**

### 3.4 不同任务确实采用不同处理方式

从规范和案例可以归纳出四种模式：

| 模式           | 典型任务                           | 产物                                      | 评审位置               |
| -------------- | ---------------------------------- | ----------------------------------------- | ---------------------- |
| 直接实施       | 局部 bug、UI 调整、单包功能        | 代码 + 测试；可选的 implemented note      | 实施后的 PR            |
| 提案先行       | 跨包重命名、架构调整、有争议的简化 | 单独的 proposed note PR，后续实施 PR      | 提案 PR + 实施 PR      |
| 记录与门禁并行 | 持久化结构、破坏性变更             | 代码 + persistence record / upgrade guide | 实施后的 PR + 专门检查 |
| 计划批准后执行 | 用户主动进入 plan mode             | `exit_plan_mode` 的 plan + 用户 Approve | 执行前，但仅限该模式   |

所以 DSH 不是“所有任务都先提案”，也不是“所有任务都直接干”；它按任务的风险和争议程度选择，但选择标准没有量化。

---

## 四、问题 2：人工参与与授权边界

### 4.1 DSH 确实有强制的人工关口

#### （1）PR 合并前的加权审批

[review-ownership/README.md:19](../deepseek-harness/.github/review-ownership/README.md#L19) 定义了 `weighted approval`：

- 要求 **2 分**；
- 默认评审人 1 分，指定的 8 位评审人 2 分；
- 作者自己的评审不算；
- 作者历史合并 PR 最多贡献 1.1 分，不能单独满足 2 分；
- 有 `CHANGES_REQUESTED`、草稿状态、或分数不足时，状态保持 `pending`；
- 分支规则应要求这个 commit status。

[approval-policy.json:2](../deepseek-harness/.github/review-ownership/approval-policy.json#L2) 明确 `requiredPoints: 2`。

这是仓库内最明确的“人工授权”机制，但它发生在**代码已经写完并推送之后**。

#### （2）Issue policy

[issue-management/README.md:27](../deepseek-harness/.github/issue-management/README.md#L27) 要求非草稿、人类作者的 PR 至少引用一个同仓库 Issue，并带 `kind/*`、`area/*` 标签。它保证变更可追溯，但**不是实施前的批准**。

#### （3）UI 与视觉

[dsh-client-ui-ux:117](../deepseek-harness/.agents/skills/dsh-client-ui-ux/SKILL.md#L117) 规定：

> “A PR with extensive UI changes, or any clearly user-perceivable change to UI or interaction, must get a designer or product review.”

这又是 PR 阶段的额外人工关口。

#### （4）官方插件图标

[dsh-official-plugin-artwork:29](../deepseek-harness/.agents/skills/dsh-official-plugin-artwork/SKILL.md#L29) 要求“Obtain designer approval before landing new glyphs”。这是明确的“落地前”人工批准，但只针对图标资产。

#### （5）Plan mode

Plan mode 是唯一接近“执行前批准”的通用机制：

- 用户 `/plan` 进入；
- Agent 调查、设计，调用 `exit_plan_mode` 提交完整计划；
- 用户选择 `Approve` 或 `Keep planning`；
- 只有恰好一个 `Approve` 选择才算同意（[plan-mode/src/index.ts:377](../deepseek-harness/packages/plan/plan-mode/src/index.ts#L377)）。

但它的限制非常关键：

- **opt-in**：根 `AGENTS.md` 没有要求使用 plan mode；它也不在默认研发流程里；
- **soft guidance**：[plan-mode/README.md:12](../deepseek-harness/packages/plan/plan-mode/README.md#L12) 明确说“It does not restrict the agent: every tool stays callable”；
- **不是仓库规则**：它是 DSH 产品包，不是 deepseek-harness 仓库的研发门禁。

所以不能把 plan mode 当作 DSH 开发流程的默认审批机制。

### 4.2 DSH 没有的东西

在仓库的 `AGENTS.md`、Skills、Scripts、CI 中，**没有找到**以下机制：

- 没有“修改代码前必须获得用户对方案的明确批准”的规则；
- 没有“改动超过 N 个文件/跨 N 个包就必须先写 proposed note”的阈值；
- 没有脚本检查“这个 PR 是否先有提案”；
- 没有 `accepted` 状态或“提案批准记录”；
- 没有默认开启的 plan mode；
- 没有自动阻断“Agent 直接开始实施”的机制。

**因此，用户提出一个目标，在 DSH 的机制上不等于“授权实施”，但也没有任何机制阻止 Agent 把它当成实施授权。** 这正是你之前遇到的情况：规范文本可能反对，但执行层没有硬约束。

### 4.3 目标、讨论方案、授权实施如何区分？

在 DSH 仓库流程中，这三者没有被形式化区分：

| 概念     | DSH 中的载体                            | 是否等于授权                            |
| -------- | --------------------------------------- | --------------------------------------- |
| 用户目标 | Issue、对话、PR 的 Motivation           | 否，是上下文                            |
| 方案讨论 | proposed note、PR 描述、review 评论     | 否，是设计记录                          |
| 实施授权 | 没有独立状态；PR 合并是最终授权         | 合并才是最终授权                        |
| 计划批准 | plan mode 的 `exit_plan_mode` Approve | 是，但只在用户主动进入 plan mode 时存在 |

PR 模板和 [dsh-pr-description:112](../deepseek-harness/.agents/skills/dsh-pr-description/SKILL.md#L112) 把 `breakdown`、`design`、`testing`、`implementation`、`review` 分阶段记录，并要求填写人工参与度。这说明 DSH 在**概念上**区分“谁做设计、谁做实现、谁处理评审”；但它是**事后披露**，不是事前门禁，也没有自动核实。

---

## 五、问题 3：具体执行机制如何配合

### 5.1 根 `AGENTS.md`：常驻规则，不是流程引擎

根 [AGENTS.md](../deepseek-harness/AGENTS.md) 主要做三件事：

1. **给方向**：改 `packages/` 前读 architecture；遵循文档标准；先看 defensive patterns。
2. **给同变更义务**：改 API 要更新消费者；改持久化要 acknowledge；破坏性变更要写 upgrade guide；文档随代码更新；非机械变更要有 Agent Note 或更新已有 note。
3. **给检查入口**：`pnpm run test:docs`、`test:gates`、`test:notes`、`change-scope`、`doc-sync` 等。

它明确写了“Create Agent Notes only for durable decision rationale; mechanical/local edits are exempt”（[AGENTS.md:158](../deepseek-harness/AGENTS.md#L158)），但没有写“什么时候必须先提案”。这是“法”的层面，不是“律”的层面。

### 5.2 Skills：专项程序，不是端到端工作流

DSH 没有 agent-dev-template 那样的单一 `dev-workflow` Skill。22 个 Skill 里，和研发流程直接相关的是：

| Skill                                        | 作用                                        | 在流程中的位置  |
| -------------------------------------------- | ------------------------------------------- | --------------- |
| `dsh-pre-push-checks`                      | 选择最小相关检查，避免反射式跑全量          | 实施后、推送前  |
| `dsh-code-review`                          | 评审 PR：先跑 change-scope，再按规则审 diff | 评审阶段        |
| `dsh-pr-description`                       | 写 PR 描述、模块职责、测试设计、AI Usage    | 开 PR / 更新 PR |
| `dsh-find-simplifications`                 | 调查可删除的维护义务，写/合并提案           | 调查、提案      |
| `dsh-archive-agent-notes`                  | 新增/审计/归档/删除 Agent Notes             | 记录收束        |
| `dsh-client-ui-ux`                         | UI 设计、检查、评审升级                     | UI 变更         |
| `dsh-create-upgrade-guide`                 | 破坏性变更的升级指南                        | 变更同时        |
| `dsh-ci-test-reliability`                  | 异步/资源/CI 测试的隔离与可靠性             | 测试设计        |
| `dsh-prose-standard` / `dsh-doc-writing` | 文档与注释标准                              | 全程            |

关键调用关系是：**`AGENTS.md` 在具体条目上链接 Skill；Skill 再链接具体的 docs、scripts、notes。** 例如根 `AGENTS.md:117` 要求推送前遵循 `dsh-pre-push-checks`；`dsh-pre-push-checks` 再要求用 `change-scope` 看范围，按变更面选择 `doc-sync`、聚焦测试、`build` 等。

没有“提案 Skill”。提案的格式由 `.agents/notes/README.md` 定义，提案的调查方法由 `dsh-find-simplifications` 定义，提案的归档由 `dsh-archive-agent-notes` 定义。三者是拼起来的，不是一个统一入口。

### 5.3 Agent Notes：承载“为什么”，不承载“做什么”

`.agents/notes/AGENTS.md:3` 把 Agent Notes 定义为“effectively RFCs written by agents”：

- 记录 decision rationale、alternatives、consequences、required verification；
- `proposed/` 用 `Problem / Proposal / Alternatives / Acceptance criteria / Risks`；
- `implemented/` 用 `Problem / Decision / Alternatives / Consequences`，且必须是现在时；
- `rejected/` 是冻结的提案，拒绝理由写在 `Status:` 行；
- `implemented/` 的事实要随代码更新，不能把旧 note 改写成另一个决策；
- 归档后冻结，不能编辑，也不能当作当前权威。

格式门禁很具体：第一行必须是 `# Agent Note: <title>`，第三行必须是 `Status:`，状态必须与目录一致；`implemented/` 禁止出现 `## Proposal`、`## Plan`、`## Acceptance criteria` 等提案期标题（[verify-agent-note-format.ts:22](../deepseek-harness/scripts/verify-agent-note-format.ts#L22)）。移动 `proposed/` → `implemented/` 时必须同时改写正文结构，否则门禁失败（[notes/README.md:121](../deepseek-harness/.agents/notes/README.md#L121)）。

这套机制解决的是“决策理由不丢失、不过时、不重复”，不是“实施前必须审批”。它和你的“每个事实只保留一个归属方”原则高度一致：**Agent Note 拥有“为什么/放弃了什么”，代码和测试拥有“现在是什么”，README 拥有“包契约”，生成目录拥有“清单”。**

一个代价是：**没有集中索引。** 规范明确禁止 `INDEX.md`，路径就是元数据，搜索就是索引。这避免了生成文件冲突，但也意味着没有一个“待评审提案”的仪表盘；提案容易停在 `proposed/` 里。

### 5.4 Scripts / Tests / CI：把“遗漏”变成红灯

这是 DSH 最像“律”的部分。

**Scripts 的实际分工：**

| 脚本/入口                                                            | 作用                                                                | 是否阻断                |
| -------------------------------------------------------------------- | ------------------------------------------------------------------- | ----------------------- |
| `scripts/run-gates.ts`                                             | 门禁总调度，定义 `doc-sync`、`ci-static`、`ci-primary` 等聚合 | 是，失败退出非零        |
| `verify-agent-note-format`                                         | 检查 note 头部、生命周期章节、alternatives                          | 是，doc-sync 内         |
| `verify-agent-note-classification`                                 | 检查生命周期/类别目录、日期文件名                                   | 是，doc-sync 内         |
| `verify-archived-agent-notes`                                      | 检查归档三元组、归档元数据、冻结 manifest                           | 是                      |
| `verify-md-links` / `verify-doc-budgets` / `verify-type-equiv` | 链接、字数、类型粘贴一致性                                          | 是                      |
| `verify-persistence-changes` / `persistence-review`              | 持久化结构变化的记录与前后对比                                      | 是                      |
| `pre-merge-check.ts`                                               | 版本同步、安装、upgrade guide 目录、Host/Client 编译                | 是（按 `CHECK_MODE`） |
| `change-scope.ts`                                                  | 只报告 committed/staged/unstaged/untracked 路径                     | 否，不是批准            |

`change-scope` 很重要：它是“看清范围”的工具，不是“范围是否被批准”的检查。它的文件头写得很清楚：“Report the explicit committed and worktree scope of a repository change.”（[change-scope.ts:1](../deepseek-harness/scripts/change-scope.ts#L1)）

**CI 的实际分工：**

- `ci-static` 在 PR 上运行静态门禁和 `doc-sync`，包括 Agent Note 的格式/分类/归档检查（[ci.yml:144](../deepseek-harness/.github/workflows/ci.yml#L144)，[run-gates.ts:546](../deepseek-harness/scripts/run-gates.ts#L546)）。
- `ci-primary` 还包含 typecheck、lint、duplication、coverage、snapshot、build、publint 等（[run-gates.ts:464](../deepseek-harness/scripts/run-gates.ts#L464)）。
- 最终有一个稳定 required check：`all checks passed`，它要求所有需要的 job 成功（[ci.yml:1109](../deepseek-harness/.github/workflows/ci.yml#L1109)）。
- 加权审批是独立的状态检查，不在 `ci.yml` 里，但被分支规则要求（[review-ownership/README.md:19](../deepseek-harness/.github/review-ownership/README.md#L19)）。

**Tests 的作用边界：**

- `test:coverage` 才是 CI 覆盖率门禁，`test` 不是（[AGENTS.md:121](../deepseek-harness/AGENTS.md#L121)）。
- 本地不默认跑全量；CI 拥有 exhaustive coverage 和平台矩阵（[AGENTS.md:119-120](../deepseek-harness/AGENTS.md#L119-L120)）。
- 测试证明行为，不证明设计值得做；snapshot 证明模型/用户可见输出，不证明 UI 好看。`dsh-code-review` 明确要求人工检查 UI、语义、生命周期和测试强度，不能只看绿灯。

**本地检查的定位：**

`dsh-pre-push-checks` 要求“选最小相关检查”，而不是反射式跑全量；Git hooks 也很窄：pre-commit 只做 pairing、staged lint、whitespace、vendor 检查，pre-push 只做增量 typecheck（[development.md:142](../deepseek-harness/docs/development.md#L142)）。这体现的是“CI 拥有 exhaustive，local 只做相关证据”，不是“本地全量通过才敢交付”。

### 5.5 实际调用链

```text
用户目标
  │
  ├─ 根 AGENTS.md（常驻规则）
  │    ├─ 读 docs/architecture.md
  │    ├─ 指向 docs/AGENTS.md、Agent Notes、Skills
  │    └─ 同变更义务：文档/笔记/upgrade guide/persistence record
  │
  ├─ 按需加载 Skill
  │    ├─ dsh-find-simplifications（调查/提案）
  │    ├─ dsh-pre-push-checks（验证选择）
  │    ├─ dsh-code-review（评审）
  │    ├─ dsh-pr-description（PR 记录）
  │    └─ dsh-client-ui-ux / dsh-create-upgrade-guide / ...
  │
  ├─ 实施：代码 + 测试 + 文档 + 可选 note
  │
  ├─ 本地：change-scope → 相关测试 / doc-sync / build
  │
  ├─ PR：Issue 引用、PR 描述、AI Usage
  │
  ├─ CI：ci-static（含 doc-sync）、coverage、build、snapshot、Windows、Python
  │
  ├─ 人工：weighted approval（2 分）+ UI/产品评审 + Issue policy
  │
  └─ 合并 → proposed→implemented / 归档 / 升级指南
```

这条链里，**“提案”是可插拔的一步，不是必经节点；“审批”是合并前的最后一步，不是实施前的第一步。**

---

## 六、问题 4：真实研发案例

### 案例 A：repository naming contract——提案先行的典型

这是 DSH 里最完整、也最能说明“提案如何被使用”的案例。

| 时间             | 提交        | 事件                                                                       | 规模                                |
| ---------------- | ----------- | -------------------------------------------------------------------------- | ----------------------------------- |
| 2026-08-11 20:26 | `869b5c7` | `docs: propose repository naming contract`；新增 proposed note           | 3 文件，+720 行                     |
| 2026-08-11 21:07 | `32454ba` | `docs: address naming ledger review`；按评审修订提案                     | 约 39 行英文正文改动                |
| 2026-08-13 00:36 | `a2d0f7f` | `refactor: apply repository naming contract`；实施重命名                 | **3281 文件，+21708/−21570** |
| 2026-08-13 01:38 | `0233b8b` | `docs: mark repository naming contract implemented`；移动 note、更新引用 | 16 文件                             |
| 2026-08-13 05:02 | `34dd480` | `fix(session-query): rename session log export package`；实施后修正      | 45 文件                             |

对应的 PR 序列（来自本地 merge commit）：

- 提案 PR：`#2280`；
- 实施 PR：`#2302`；
- 标记 implemented：`#2435`；
- 后续修正：`#2443`。

提案本身在 [2026-08-11-repository-naming-contract-and-rename-ledger.md](../deepseek-harness/.agents/notes/implemented/architecture/2026-08-11-repository-naming-contract-and-rename-ledger.md)，最初是 357 行的完整命名契约和重命名账本。

**提案评审确实改变了设计。** `32454ba` 的 diff 显示，评审后至少做了这些调整：

- 新增 `Binder` 角色，用于“把一个声明绑定到调用方 context/lifecycle”的对象；
- `TypertRegistry` 改为 `TypertRegistryContract`，避免接口与已有具体类冲突；
- `ModelDirectoryRegistry` 改为 `ModelDirectoryResolver`，因为它的唯一公开操作是 `directoryFor(sessionId)`，没有注册 API；
- `SettingsScopeService` 改为 `SettingsScopeBinder`，因为它的职责是绑定而不是管理集合；
- acceptance criteria 增加“within one Cordis context”，并调整被部分取代的 note 范围。

**这个案例说明了什么：**

- DSH 确实可以在实施前进行真正的设计评审，而且能处理 3281 文件级别的变更；
- 但“提案被接受”并没有独立状态：提案 PR 合并后，note 仍然是 `proposed`，直到实施 PR 把它移入 `implemented`；
- 提案评审发生在**代码之前**，这是它和普通 PR 评审最大的区别；
- 评审意见的具体内容在本地不可见，只能从修订提交推断；不能声称具体是谁批准、批准了几轮。

### 案例 B：scoped REPL——单包大功能的直接实施

| 项目       | 内容                                                                                                                                             |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| 提交       | `793ce79`（2026-11-10）                                                                                                                        |
| 标题       | `feat(ptc): add scoped REPL execution with copied top-level bindings`                                                                          |
| 规模       | 37 文件，+3399/−36                                                                                                                              |
| Agent Note | [2026-11-09-retained-ptc-scoped-repl.md](../deepseek-harness/.agents/notes/implemented/architecture/2026-11-09-retained-ptc-scoped-repl.md)，515 行 |
| 生命周期   | **直接以 `implemented` 创建**，没有 proposed 阶段                                                                                        |
| PR         | `#8202`                                                                                                                                        |

这个案例很重要，因为它不是“小改动”：

- 它增加了一个完整的 scoped REPL evaluator；
- 包含 326 行 kernel、109 行 evaluator、593 行测试；
- 包含 snapshot、配置、README、upgrade guide；
- Agent Note 里记录了与 `node:repl`、`vm-script` 的对比和 alternatives。

但它的 Agent Note 是在实现提交中一起新增的，不是先有提案 PR。**这说明 DSH 对“单包、边界清晰、可测试”的大功能，接受直接实施 + 事后记录设计理由。**

### 案例 C：message image factories——`proposed` 作为“实施中的设计记录”

| 时间             | 提交        | 事件                                                                                                       |
| ---------------- | ----------- | ---------------------------------------------------------------------------------------------------------- |
| 2026-10-10 01:25 | `2c684c5` | `refactor(web): compose native message image factories`；**同一个提交里新增 proposed note 和代码** |
| 2026-10-10 22:26 | `ba452cf` | `docs: mark message image factory decision implemented`；把 note 移到 implemented                        |

这个案例说明：`proposed` 并不必然意味着“代码还没开始”。它也可以是一个**实施过程中写的设计文档**，等实现完成后再改写成 implemented。它更像“design record 的状态”，而不是“开工前的审批阶段”。

### 案例 D：timers/promises——提案在实现尝试之后被拒绝

[2026-07-26-builtin-timer-promises-for-hand-rolled-sleeps.md](../deepseek-harness/.agents/notes/rejected/simplification/2026-07-26-builtin-timer-promises-for-hand-rolled-sleeps.md) 的状态是：

> `Status: rejected — implementation (PR #679) falsified the parity premise: vitest's fake clock does not intercept node:timers/promises...`

对应提交 `05adf5d`：`docs: reject the timers/promises sleep proposal after implementation`。

这个案例说明：**提案生命周期不是严格线性的。** 一个提案可以先被实现尝试，再根据实现证据被拒绝。它进一步说明 `proposed` 不是“实施前必须通过的关卡”，而是一个可被证据推翻的设计记录。

### 案例 E：持久化变更——记录与人工评审并行

持久化是 DSH 里“记录最强”的领域：

- 每个结构性变更都需要 acknowledgement，记录 predecessor、after digest、compatibility decision（[persistence-changes/README.md:51](../deepseek-harness/docs/persistence-changes/README.md#L51)）；
- 同版本变更需要解释新旧读者的行为，不能只靠类型差异；
- `persistence-review` 可以对比 base/head，但文档明确说：

> “Verification cannot establish how the record was authored or whether a human reviewed it.”（[persistence-changes/README.md:65](../deepseek-harness/docs/persistence-changes/README.md#L65)）

> “after recording, it cannot replace a base/head review or establish that a human reviewed the change.”（[reviewing-persistence-type-changes.md:42](../deepseek-harness/docs/cookbook/reviewing-persistence-type-changes.md#L42)）

这是一个很好的“律”的范例：**机器可以检查记录是否完整、类型是否兼容，但不能替代人判断兼容性决策是否合理。** 它和你的“持久化数据结构变化记录”目标最接近。

---

## 七、证据分级：哪些是机制，哪些是观察，哪些是推断

| 结论                                                                           | 类型                                                       | 依据                                                                         |
| ------------------------------------------------------------------------------ | ---------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Agent Note 有 proposed/implemented/rejected 三态，格式由脚本检查               | **已实现机制**                                       | `agent-note-tree.ts`、`verify-agent-note-format.ts`、`notes/README.md` |
| `doc-sync` 包含 note 格式、分类、归档检查                                    | **已实现机制**                                       | `run-gates.ts:1034-1036`                                                   |
| CI 的 `ci-static` 运行 `doc-sync`，`all checks passed` 是 required check | **已实现机制**                                       | `ci.yml:144`、`ci.yml:1109`                                              |
| PR 合并前需要 2 分加权审批                                                     | **已实现的仓库策略**（实际分支保护设置未在本地核验） | `review-ownership/README.md`、`approval-policy.json`                     |
| UI 变更需要设计师/产品评审                                                     | **已实现规则**                                       | `dsh-client-ui-ux:117`                                                     |
| 官方图标新 glyph 需要设计师批准                                                | **已实现规则**                                       | `dsh-official-plugin-artwork:29`                                           |
| Plan mode 有用户批准出口，但不限制工具                                         | **已实现产品机制**                                   | `plan-mode/README.md:12`、`plan-mode/src/index.ts:377`                   |
| 持久化结构变更必须记录                                                         | **已实现门禁**                                       | `verify-persistence-changes`、`persistence-changes/README.md`            |
| 没有“实施前必须提案/批准”的通用门禁                                          | **未找到依据**（不能绝对说团队外部没有约定）         | 检查了 AGENTS、Skills、Scripts、CI                                           |
| 当前 414 条 implemented 中至少 12 条曾从 proposed 移入                         | **观察统计**（rename 检测，可能低估）                | `git log --diff-filter=R`                                                  |
| 52 条 active proposed，最老 2026-06-11                                         | **观察统计**                                         | 当前工作区 `.agents/notes/proposed/`                                       |
| 提案阶段使用是“按风险判断”，不是按规模阈值                                   | **推断**                                             | 案例 A 与 B 的对比；规范没有阈值                                             |
| PR 评审是事实上的最终授权边界                                                  | **推断**（有文档支持，但实际分支保护未核验）         | `review-ownership`、`ci.yml`、PR 模板                                    |
| DSH 默认依赖 Agent 自觉先调查                                                  | **推断**                                             | 规范有要求，但没有 pre-implementation gate                                   |

### 未找到依据 / 本次无法验证

- **PR 评审的具体讨论和批准人**：本机没有 `gh`，GitHub 页面抓取也被重定向到 discussion，无法读取 PR #2280/#2302 的评论和审批记录。
- **实际 GitHub branch protection 设置**：仓库内只有“分支规则应要求该状态”的文档和工作流注释，设置本身不在仓库。
- **Agent 实际会话中多常先调查**：没有 DSH 开发会话日志；只能从提交和笔记反推。
- **“substantial”的判定阈值**：规范反复使用“substantial future work”，但没有定义行数、文件数、包数或风险等级。
- **直接实施的 note 是否在仓库外有过方案讨论**：无法从本地仓库判断。
- **52 条 proposed 中哪些是刻意延期、哪些是被遗忘**：没有状态字段或 review SLA 可以区分。

---

## 八、对 agent-dev-template 的判断含义

这次调查对“如何避免 Agent 直接把目标当成实施授权”有几个直接含义：

1. **不要只复制 `proposed/` 目录。** DSH 的 `proposed/` 是文档生命周期，不是门禁。如果没有“何时必须提案”的可判定条件和阻断点，它只会变成停车场。DSH 当前 52 条 active proposed、最老五个多月，就是一个现实提醒。
2. **DSH 真正可复制的“律”是“同变更义务 + 机器检查”。** 改代码必须同 PR 更新 README/JSDoc/Agent Note/upgrade guide/persistence record，否则 `doc-sync` 或专门检查红灯。这比“提醒 Agent 记得更新文档”可靠得多。
3. **人工评审放在 PR 是有效的，但对“大范围直接实施”太晚。** DSH 的命名契约案例说明：高风险、跨包变更可以先做一个只改文档的提案 PR，让评审在代码之前发生；单包功能则可以接受直接实施 + 事后评审。关键是把“哪种情况适用哪种模式”写成规则，而不是留给 Agent 猜。
4. **Plan mode 不能当作硬约束。** DSH 自己明确说它是 guidance，不限制工具；如果 agent-dev-template 需要“未批准不得改文件”的硬保证，必须自己实现阻断，不能依赖 plan mode。
5. **“目标”和“授权”必须在机制上分开。** DSH 没有独立授权状态，所以它的规范只能靠文字说“survey 不等于 permission”；这正好是 agent-dev-template 可以做得更明确的地方：把“调查/提案/实施”变成可观察状态，并让“实施”状态只能由明确授权进入。

---

## 附：主要证据文件

| 主题               | 文件                                                                                                                                                                                                                    |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 常驻研发规则       | [AGENTS.md](../deepseek-harness/AGENTS.md)                                                                                                                                                                                 |
| Agent Note 规则    | [.agents/notes/README.md](../deepseek-harness/.agents/notes/README.md)、[.agents/notes/AGENTS.md](../deepseek-harness/.agents/notes/AGENTS.md)、[implemented/AGENTS.md](../deepseek-harness/.agents/notes/implemented/AGENTS.md) |
| Note 结构门禁      | [agent-note-tree.ts](../deepseek-harness/scripts/agent-note-tree.ts)、[verify-agent-note-format.ts](../deepseek-harness/scripts/verify-agent-note-format.ts)                                                                  |
| 门禁总调度         | [run-gates.ts](../deepseek-harness/scripts/run-gates.ts)                                                                                                                                                                   |
| CI                 | [.github/workflows/ci.yml](../deepseek-harness/.github/workflows/ci.yml)                                                                                                                                                   |
| 加权审批           | [.github/review-ownership/README.md](../deepseek-harness/.github/review-ownership/README.md)、[approval-policy.json](../deepseek-harness/.github/review-ownership/approval-policy.json)                                       |
| 推送前检查         | [dsh-pre-push-checks/SKILL.md](../deepseek-harness/.agents/skills/dsh-pre-push-checks/SKILL.md)                                                                                                                            |
| PR 评审            | [dsh-code-review/SKILL.md](../deepseek-harness/.agents/skills/dsh-code-review/SKILL.md)                                                                                                                                    |
| PR 描述与 AI Usage | [dsh-pr-description/SKILL.md](../deepseek-harness/.agents/skills/dsh-pr-description/SKILL.md)、[pull_request_template.md](../deepseek-harness/.github/pull_request_template.md)                                               |
| 简化/提案方法      | [dsh-find-simplifications/SKILL.md](../deepseek-harness/.agents/skills/dsh-find-simplifications/SKILL.md)                                                                                                                  |
| Plan mode          | [packages/plan/plan-mode/README.md](../deepseek-harness/packages/plan/plan-mode/README.md)                                                                                                                                 |
| 持久化变更         | [docs/persistence-changes/README.md](../deepseek-harness/docs/persistence-changes/README.md)、[reviewing-persistence-type-changes.md](../deepseek-harness/docs/cookbook/reviewing-persistence-type-changes.md)                |
| 文档分层           | [docs/AGENTS.md](../deepseek-harness/docs/AGENTS.md)                                                                                                                                                                       |

本次调查未修改 DSH 或 agent-dev-template 的任何文件；DSH 工作区保持 clean。

# AGENTS.md — 文档标准

本文件定义文档结构、Markdown 层级、写作规则和 `verify-doc-budgets` 上限。放置与校验使用 [doc-writing](../.agents/skills/doc-writing/SKILL.md)，必需的覆盖范围与编辑判断使用 [prose-standard](../.agents/skills/prose-standard/SKILL.md)；[归档的 doc-tiers Agent Note](../.agents/notes/archived/process/2026-07-04-doc-tiers-and-budgets.md) 记录历史理由。

## 文档结构

这些规则适用于面向人的文档；[Agent Note](../.agents/notes/README.md) 仍在其范围之外。[复盘](postmortem/README.md) 是限定于单次事件的参考；按时序记录的是证据，不是教学顺序。文档的主题和树中位置决定其范围：以合适的细节描述它自己的主题，直接子项只按用途、职责和高层行为描述；更低层的细节链接到负责它的子页面。文档类型不会扩大该范围。参考只有关于自身主题时才可以穷举。测试机制、fixture 和测试框架属于最低的归属层级；更高层文档链接到那里。

把每个范围内文档归类为教程或参考。教程沿着有序路径通向某个结果，只引入每一步需要的内容。参考定义查找范围和当前行为，不含教学顺序。实质性的教程内容和参考内容要分开；当任一部分较小时，为章节加标签。

写教程之前，先私下把读者的起始知识以及每个概念归类为入门、中级或高级。先建立前置条件，再引入依赖概念，逐步提高难度，把不必要的高级材料移到后续教程或参考中。

按以下顺序编写：在树中定位文档；设定允许的细节层级；选择教程或参考；对教程按前置条件和难度排列概念；迁移属于子页面的细节；用指向归属方的链接替换低层解释。

## 层级分类法：一个事实一个归属

每个事实只有一个归属：承担该职责的层级；在其他地方只做链接。

| 层级 | 职责 | 不应放在这里 |
|---|---|---|
| 根 `AGENTS.md` | 常驻指令：agent 每次会话都需要放在上下文中的规则，每条一到三行，并链接其归属处 | 故事、完整示例、情境性流程，以及任何从链接归属处转述来的内容 |
| 子树 `AGENTS.md`（`packages/`、`docs/`、`.agents/notes/`） | 该子树专属的指令 | 根文件已经承载的全仓库规则 |
| [architecture.md](architecture.md) | 有序地图：组合、核心包、循环、seam、扩展点；改动 `packages/` 前先阅读 | 类型定义（→ subsystems）、逐包细节（→ 包 README）、决策理由（→ Agent Note）、实现状态标注 |
| [subsystems/](subsystems/README.md) | 每个子系统一页参考：类型定义、语义和生成的 Cordis API | 行为叙述（→ architecture.md） |
| [Agent Note](../.agents/notes/README.md) | 活跃的决策记录：为什么、放弃了什么、必需的验证；`implemented/` 笔记用现在时描述已交付的现实 | 迁移计划、验收任务清单、fixture 走查，以及决策交付后仍出现的 spec-speak（"should…"）；归档笔记是冻结的历史，永远不是当前权威 |
| [defensive-patterns/](defensive-patterns/README.md) | 本仓库在评审中执行的规则，按工件拆分：一个通用 bug 类别页面，加上按领域划分的页面 | 类型定义与语义（→ subsystems）、决策理由（→ Agent Note）、写代码的设计规则（→ core-guidelines/） |
| [core-guidelines/](core-guidelines/README.md) | 写代码的编号设计规则，每个领域一个文件（general、frontend、backend、data exchange），格式由规则 G.1 定义 | 业务领域规则（→ 包 README、subsystems/、Agent Note）；工件 bug 类别检查（→ defensive-patterns/） |
| [postmortem/](postmortem/README.md) | 事故故事——唯一适合事故亲历式叙事的层级 | — |
| [Persistence history](persistence-changes/README.md) 和 [format references](persistence-changes/historical-formats/README.md) | 类型变更确认、发布对比和完整的历史格式 schema | 纯行为变更；当前运行时契约 |
| [cookbook/](cookbook/adding-a-package.md) | 带编号验证步骤的分步操作指南 | 设计理由（→ 各指南链接的 Agent Note） |
| [user/](user/index.md) | 由文档网站发布的产品向指南 | 生成的参考表格、贡献者流程、决策历史 |
| 包 README | 逐包契约：配置、语义、限制、扩展点和 [Model Experience](cookbook/adding-a-package.md#4-write-the-package-readme) | JSDoc 复述、生成目录的复述（event/tool 表）、其他包关注的事务 |
| [development.md](development.md) | 贡献者配置、日常工作流和 CI 摘要；属于 [i18n 契约](i18n/README.md)下的双语配对 | 运行时/版本理由（→ Agent Note）、与 `package.json` 脚本逐渐脱节的逐项检查清单 |
| 生成的参考：[subsystems/](subsystems/README.md) 中每页的 `cordis-surface` 区域、[Cordis 核心 API + 继承层级](cordis-api/context.md)、[tool-catalog](tool-catalog.md)、[config-catalog](config-catalog.md)、[persistence-catalog](persistence-catalog.md)、[module-graph.md](module-graph.md)、[cli-help](cli-help.md) | 从源码重新生成并做新鲜度门禁的穷举英文源；经评审的中文对侧遵循[配对工作流](i18n/README.md#scope-and-exclusions) | 手工编辑生成的英文源或区域；中文对侧只能通过配对更新 |
| Skills（`.agents/skills/`） | 可复用工作流和专门的决策标准 | 产品与运行时契约（→ docs 或源码） |

放置：bug → 复盘；理由 → Agent Note；流程 → cookbook；类型定义 → subsystems；包契约 → 包 README；常驻指令 → 根 `AGENTS.md` 并附理由链接；按工件区分的评审规则 → `defensive-patterns/`；写代码的设计规则 → `core-guidelines/`。

<a id="writing-rules"></a>
## 写作规则

- **记录当前状态。** 把历史留在 commit、PR、Agent Note、复盘或有范围的持久化记录中。其他文字只命名当前机制，不写变更或技术栈位置。通用的 Session 格式文字链接[版本/状态权威](session-format-status.md)；版本特定的契约、示例或证据保留具体数字。
- **应用 Agent Note 的创建标准。** 机械性/本地编辑豁免，包括本地 UI 改动；保持现有归属笔记准确（[范围](../.agents/notes/README.md#when-to-write-one)）。
- **每个段落只占一个物理行**（`verify-md-wrap`）：使用编辑器软换行。代码块、表格和列表结构保持各自格式；代码注释保持在校验器的列宽限制内。
- **`ts` 围栏块必须能编译**（`doc-typecheck`）；粘贴的类型声明及其原始 JSDoc 使用 ` ```ts type-equiv `，而去掉函数体的公开类声明使用 ` ```ts public-api `；两者都要登记到 manifest 中，以免漂移（[机制](development.md#documenting-types-verbatim-ts-type-equiv)）。
- **所属 [subsystems 页面](subsystems/README.md) 必须在同一次变更中更新**，只要该变更重塑了已记录的类型。`verify-type-equiv` 只能发现漂移的粘贴，不能发现从未记录的新类型；类型记录在其声明包组的页面上（[页面范围](../scripts/verify-subsystem-pages.ts)）。
- **配对数一起更新**：[术语引导](i18n/terminology.md)、单轮由活跃 agent 执行的工作会重新定位首次出现的注释、保留未改动的文字并重新记录；`dsh-translate-docs` 仍由用户调用（[契约](i18n/README.md)）。
- **注释和 JSDoc 陈述完整契约，而不是推理过程记录。** 保留行为、失败、时序、归属、情态、例外、后果和非显而易见的定位；删除叙述、测试走查、评审分析和代码复述。保留本地契约并链接其理由。细节使用 [prose-standard](../.agents/skills/prose-standard/SKILL.md)。
- 直接写：写明执行者和事实（[参考](../.agents/skills/prose-standard/SKILL.md)）。`seam` 只留给已定义的能力。写明确切的检查、类型、API、操作或行为，而不是隐喻性的 "gate"、"vocabulary" 或 "surface"。

<a id="wordcount-budgets"></a>
## 字数预算

[scripts/doc-budgets.manifest.json](../scripts/doc-budgets.manifest.json) 设置常驻文档的字数上限；`pnpm run verify-doc-budgets` 拒绝超限或缺失的文件。

门禁变红时：

1. **迁移**属于其他层级的内容；必要时留一行链接。
2. **压缩**属于此处但可以更短的内容。
3. 只有当文字确实需要空间时才**上调**上限；在 PR 中说明 manifest 改动的理由。上限过低是预算 bug。

上限是护栏，不是削减目标。达到或低于目标时，至少保留 5% 余量；高于目标时，冻结上限，直到迁移或压缩把文档降到目标以下。只有文档仍有空间时才下调上限。目标：根 `AGENTS.md` ≤ 2,080；`architecture.md` ≤ 2,400；子树 `AGENTS.md` ≤ 600，但 `packages/AGENTS.md` ≤ 810、本文件 ≤ 1,430；`packages/README.md` ≤ 1,100；另外 `cordis-primer.md` 600、`testing.md` 1,300、`examples/AGENTS.md` 310。未设预算的层级由评审负责。

## 冗余清单

在任何文档中排查这些内容；[doc-writing](../.agents/skills/doc-writing/SKILL.md) 会把这份清单作为审计执行：

- 重复规则：搜索一个有辨识度的短语；只保留一个归属处，其余链接过去。
- 出现在不允许层级的历史：陈述当前事实并链接历史归属方。
- 文字或图中的实现状态标注（"implemented!"、"future: …"）。状态会腐烂；仓库布局和包 manifest 承载它。
- 手工复述的目录、JSDoc，或在源码或生成器具有权威性时手写测试、包和状态清单。
- 推理过程记录：逐步实现叙述、显而易见分支的证明、测试走查或被否决的本地替代方案。保留由此产生的契约或持久理由；删除推导路径。
- 在兄弟方法旁重复理由，而不是在所属能力或辅助函数处写一次。
- 段落墙：一个段落承载多条规则和插入语。拆分它，或把细节降级到其归属处。
- 强调膨胀：到处加粗、全大写或写 "critically"，等于什么都不突出。强调只留给改变行为的从句。
- `implemented/` Agent Note 中的 spec-speak："should"、迁移计划、验收清单。已实现的 Agent Note 按其[已实现笔记的说明](../.agents/notes/implemented/AGENTS.md)描述现状。

## 仓库引用

当前文件使用相对 Markdown 链接，历史引用使用 tag 或 PR 编号。`verify-md-links` 检查本地目标。[引用校验](../scripts/verify-repository-references.ts)会拒绝受维护文件中包含十六进制字母的 commit 标识符和被禁止的组织 URL。纯十进制 token 会被忽略，以避免与数字数据冲突，即使它们确实标识 commit。
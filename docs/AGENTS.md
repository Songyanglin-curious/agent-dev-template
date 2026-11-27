# AGENTS.md — 文档标准

本文件定义文档结构、Markdown 层级、写作规则和字数预算。放置与校验使用 [doc-writing](../.agents/skills/doc-writing/SKILL.md)，必需的覆盖范围与编辑判断使用 [prose-standard](../.agents/skills/prose-standard/SKILL.md)。

## 文档结构

这些规则适用于面向人的文档；[Agent Note](../.agents/notes/README.md) 按自己的格式规则维护，[研发输入](../研发输入/README.md) 不属于常驻文档。[复盘](postmortem/README.md) 是限定于单次事件的参考；按时序记录的是证据，不是教学顺序。文档的主题和树中位置决定其范围：以合适的细节描述它自己的主题，直接子项只按用途、职责和高层行为描述；更低层的细节链接到负责它的子页面。文档类型不会扩大该范围。参考只有关于自身主题时才可以穷举。测试机制、fixture 和测试框架属于最低的归属层级；更高层文档链接到那里。

把每个范围内文档归类为教程或参考。教程沿着有序路径通向某个结果，只引入每一步需要的内容。参考定义查找范围和当前行为，不含教学顺序。实质性的教程内容和参考内容要分开；当任一部分较小时，为章节加标签。

写教程之前，先私下把读者的起始知识以及每个概念归类为入门、中级或高级。先建立前置条件，再引入依赖概念，逐步提高难度，把不必要的高级材料移到后续教程或参考中。

按以下顺序编写：在树中定位文档；设定允许的细节层级；选择教程或参考；对教程按前置条件和难度排列概念；迁移属于子页面的细节；用指向归属方的链接替换低层解释。

## 层级分类法：一个事实一个归属

每个事实只有一个归属：承担该职责的层级；在其他地方只做链接。

| 层级 | 职责 | 不应放在这里 |
|---|---|---|
| 根 `AGENTS.md` | 常驻指令：agent 每次会话都需要放在上下文中的规则，每条一到三行，并链接其归属处 | 故事、完整示例、情境性流程，以及任何从链接归属处转述来的内容 |
| 子树 `AGENTS.md`（`docs/`、`.agents/notes/` 等） | 该子树专属的指令 | 根文件已经承载的全仓库规则 |
| [architecture.md](architecture.md) | 有序地图：整体组成、主要模块、依赖方向、扩展点与修改入口；改动模块代码前先阅读 | 类型定义（→ subsystems）、逐模块细节（→ 模块文档）、决策理由（→ Agent Note）、实现状态标注 |
| [subsystems/](subsystems/README.md) | 每个子系统一页参考：概念、数据结构、语义、接口契约、生命周期和重要机制 | 使用指导（→ 模块文档）、行为叙述（→ architecture.md）、决策历史（→ Agent Note） |
| [Agent Note](../.agents/notes/README.md) | 活跃的决策记录：为什么、放弃了什么、必需的验证；`implemented/` 记录用现在时描述已交付的现实 | 迁移计划、验收任务清单、fixture 走查，以及决策交付后仍出现的 spec-speak（"should…"）；归档记录是冻结的历史，永远不是当前权威 |
| [defensive-patterns/](defensive-patterns/README.md) | 本仓库在评审中执行的规则，按工件拆分：一个页面覆盖一类工件的缺陷检查 | 类型定义与语义（→ subsystems）、决策理由（→ Agent Note）、写代码的设计规则（→ core-guidelines/） |
| [core-guidelines/](core-guidelines/README.md) | 写代码的编号设计规则，每个领域一个文件，格式由规则 G.1 定义 | 业务领域规则（→ 模块文档、subsystems/、Agent Note）；工件 bug 类别检查（→ defensive-patterns/） |
| [postmortem/](postmortem/README.md) | 事故故事——唯一适合事故亲历式叙事的层级 | 日常任务清单、通用设计理由（→ Agent Note）、可复用的缺陷模式（→ defensive-patterns/） |
| 模块文档（`module`） | 逐模块契约：能力、使用方式、行为契约、职责边界、内部设计、限制和源码导航；模块是具有独立职责和维护价值的软件单元，代码目录、入口和部署形态不是固定条件 | JSDoc 复述、生成目录复述、系统级类型定义（→ subsystems）、决策理由（→ Agent Note） |
| 模块组文档（`module-group`，按需） | 一组相关模块的整体能力、直接下属模块的职责、组合关系与导航 | 单个模块的使用方式、配置、限制和内部实现（→ 模块文档） |
| [持久化记录](persistence-changes/README.md) | 持久化类型变更确认、发布对比和完整的历史格式 schema | 纯行为变更；当前运行时契约（→ subsystems 或模块文档） |
| [cookbook/](cookbook/README.md) | 带编号验证步骤的分步操作指南 | 设计理由（→ 各指南链接的 Agent Note）、场景判断（→ Skills） |
| [研发输入](../研发输入/README.md) | 原始需求、外部约束、参考资料和梳理成果 | 已验证的决策（→ Agent Note）、当前系统契约（→ docs 或模块文档） |
| [对dsh开发体系研究/](对dsh开发体系研究/README.md) | 对参考体系的调查研究：机制、证据、可复用原则和不采纳理由；设计新机制或提取模板前查阅 | 本仓库当前机制与已定决策（→ [体系架构](architecture.md)、[Agent Note](../.agents/notes/README.md)）；原始清单、截图和未经验证的推断 |
| Skills（`.agents/skills/`） | 可复用工作流和专门的决策标准 | 产品与运行时契约（→ docs 或源码） |
| 生成的参考 | 从源码重新生成的穷举参考；生成区域的结构与生产者声明由门禁校验 | 手工编辑生成的英文源或生成区域 |

放置：bug → 复盘；理由 → Agent Note；流程 → cookbook；类型定义 → subsystems；模块契约 → 模块文档；模块分组 → 模块组文档；常驻指令 → 根 `AGENTS.md` 并附理由链接；按工件区分的评审规则 → `defensive-patterns/`；写代码的设计规则 → `core-guidelines/`；待验证的原始材料 → `研发输入/`；参考体系研究 → [对dsh开发体系研究](对dsh开发体系研究/README.md)。

接入已有项目时，`docs/handover/` 是临时暂存区，不是归属层：文件不声明 `kind`，内容在正式文档或 Agent Note 承接后删除，目录清空后连同根 `AGENTS.md` 的临时链接一起移除；流程见 [project-onboarding](../.agents/skills/project-onboarding/SKILL.md)。

<a id="writing-rules"></a>
## 写作规则

- **记录当前状态。** 把历史留在 commit、PR、Agent Note、复盘或有范围的持久化记录中。其他文字只命名当前机制，不写变更或技术栈位置。版本特定的契约、示例或证据保留具体数字。
- **应用 Agent Note 的创建标准。** 机械性/本地编辑豁免，包括本地 UI 改动；保持现有归属笔记准确（[范围](../.agents/notes/README.md#何时需要写一份)）。
- **每个段落只占一个物理行**（`verify-md-wrap`）：使用编辑器软换行。代码块、表格和列表结构保持各自格式；代码注释保持在校验器的列宽限制内。
- **示例必须可执行或可解析。** 命令、配置和代码片段按文档展示的样子验证过；复制源码类型或接口时链接所属源码，不制造第二份定义。
- **所属 [subsystems 页面](subsystems/README.md) 必须在同一次变更中更新**，只要该变更重塑了已记录的类型（由评审保证；`verify-subsystem-pages` 只检查关联存在）。类型记录在其声明模块所属的子系统页面上；模块文档只链接类型定义，不复制。
- **不保留占位内容。** 不要写“目录待建”“TODO”“后续补充”或指向尚不存在文件的 Markdown 链接；机制尚未落地时用行内代码写明现状，或先不写。建立后再改成链接。
- **注释和 JSDoc 陈述完整契约，而不是推理过程记录。** 保留行为、失败、时序、归属、情态、例外、后果和非显而易见的定位；删除叙述、测试走查、评审分析和代码复述。保留本地契约并链接其理由。细节使用 [prose-standard](../.agents/skills/prose-standard/SKILL.md)。
- **元数据与模块门禁。** 模块和模块组 README 必须声明 `description` 与 `kind`；模块门禁按 `kind` 发现文档，未声明元数据的 README 不会进入检查，计数下降由评审发现。模块摘要与限制章节由 `verify-module-readmes` 校验；模块组表由 `verify-module-groups` 校验；子系统关联由 `verify-subsystem-pages` 校验。豁免登记在 `scripts/module-readme-limitations.allowlist.json` 与 `scripts/subsystem-page-exemptions.json`，每条写明理由。
- **直接写：写明执行者和事实**（[参考](../.agents/skills/prose-standard/SKILL.md)）。写明确切的检查、类型、API、操作或行为，避免没有定义的隐喻。

<a id="wordcount-budgets"></a>
## 字数预算

[scripts/doc-budgets.manifest.json](../scripts/doc-budgets.manifest.json) 设置常驻文档的字数上限；`pnpm run verify-doc-budgets` 拒绝超限或缺失的文件。上限按“CJK 字符逐个计数，其余按空白分词”的口径计算，具体实现见脚本头注释；登记新文件或调整口径时在同一次变更中更新 manifest。

门禁变红时：

1. **迁移**属于其他层级的内容；必要时留一行链接。
2. **压缩**属于此处但可以更短的内容。
3. 只有当文字确实需要空间时才**上调**上限；说明 manifest 改动的理由。上限过低是预算 bug。

上限是护栏，不是削减目标。达到或低于目标时，至少保留 5% 余量；高于目标时，冻结上限，直到迁移或压缩把文档降到目标以下。只有文档仍有空间时才下调上限。具体目标值登记在 manifest 中，本文件不复述；未登记在 manifest 的层级由评审负责。

## 冗余清单

在任何文档中排查这些内容；[doc-writing](../.agents/skills/doc-writing/SKILL.md) 会把这份清单作为审计执行：

- 重复规则：搜索一个有辨识度的短语；只保留一个归属处，其余链接过去。
- 出现在不允许层级的历史：陈述当前事实并链接历史归属方。
- 文字或图中的实现状态标注（"implemented!"、"future: …"）。状态会腐烂；仓库布局和模块 manifest 承载它。
- 手工复述的目录、JSDoc，或在源码或生成器具有权威性时手写测试、模块和状态清单。
- 推理过程记录：逐步实现叙述、显而易见分支的证明、测试走查或被否决的本地替代方案。保留由此产生的契约或持久理由；删除推导路径。
- 在兄弟方法旁重复理由，而不是在所属能力或辅助函数处写一次。
- 段落墙：一个段落承载多条规则和插入语。拆分它，或把细节降级到其归属处。
- 强调膨胀：到处加粗、全大写或写 "critically"，等于什么都不突出。强调只留给改变行为的从句。
- `implemented/` Agent Note 中的 spec-speak："should"、迁移计划、验收清单。已实现的 Agent Note 按其[已实现记录的说明](../.agents/notes/implemented/AGENTS.md)描述现状。

## 仓库引用

当前文件使用相对 Markdown 链接，历史引用使用 tag 或 PR 编号。Markdown 结构门禁覆盖维护中的 Markdown 文档（含模块 README），排除研发输入、归档记录和 `node_modules/`。文档改动提交前运行 `pnpm run test:docs`：它依次检查元数据与 kind、模块与模块组文档、子系统关联、源码文档引用、持久化记录、生成区域、段落换行、相对链接与锚点、commit 标识引用和字数预算。关键门禁的失败路径由 `pnpm run test:gates` 覆盖；新增或修改门禁时同时补用例。生成区域登记在 `scripts/generated-docs.manifest.json`，声明生产方后才能进入门禁。变更影响清单由 `pnpm run verify-change-docs` 按 `scripts/change-doc-rules.json` 输出：本地默认提示，CI 以 `--strict` 执行已建立的 `require` 规则；当前没有这类规则。

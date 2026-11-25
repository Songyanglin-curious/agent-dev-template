---
name: doc-writing
description: 创建、重构、评审、审计或迁移 DeepSeek Harness 的 Markdown 文档、包 README 和文档网站，采用读者优先的层级、按 kind 映射的 YAML 元数据、双语行对齐、Summary/目录导航、从用户到开发者的渐进式细节、已执行操作的事实核验以及仓库校验。适用于新增或修订 DSH 文档、docs 目录树组织、文档质量审计与预算、网站页面发布以及双语文档结构调整。
---
# DeepSeek Harness 文档

## Summary

DeepSeek Harness 文档标准：让每个页面都可被搜索、可被新人读懂，并且对 agent 和维护者足够精确；同时让文档网站始终是仓库 Markdown 经过测试的投影。先遵循仓库的 `AGENTS.md` 与已执行的校验门禁，再用本流程处理按 kind 映射的元数据、渐进式细节、行对齐的双语页面、语料审计和网站发布。坚持“一个事实一个归属方”：源码、测试、生成目录、包 README、指南、Agent Note 和 scratch 各自保留自己那一类事实。`session-persistence-jsonl` 的 README 配对是本格式的参考范例。

## Table of Contents

- [工作流程](#工作流程)
- [事实核验流程](#事实核验流程)
- [kind 体系与模板](#kind-体系与模板)
- [行文规则](#行文规则)
- [质量标准](#质量标准)
- [语料审计](#语料审计)
- [字数预算](#字数预算)
- [网站发布](#网站发布)
- [详细参考](#详细参考)
- [验证](#验证)
- [Dev Note](#dev-note)

## 工作流程

对每个请求范围都按以下顺序执行。让常见读者路径保持简短，但不要为了减少字数而删除失败情形、归属关系、限制条件或其他必需约定。

1. 阅读根目录及更具体层级的 `AGENTS.md`、[文档标准](../../../docs/AGENTS.md)、目标页面及其源码/测试、导航归属方和双语记录。
2. 按主要职责和读者为页面分类：产品快速上手、用户任务指南、贡献者教程、架构概览、包/子系统参考、生成式参考、agent 指令、决策记录或 scratch。
3. 把页面放到最近的归属方。包约定放在包代码旁边；跨包的学习、用户、开发者、架构、讨论和会过期的 scratch 材料放在 `docs/`。
4. 在写细节之前，先确定读者的起始状态、可观察结果、可能的失败、恢复路径以及下一个有用的深度层级。
5. 添加或修订 YAML 元数据——为本文档的职责指定与模板对应的 `kind`——然后在文档类型允许的情况下，按顺序写 `Summary`、`Table of Contents`、面向用户的内容、面向开发者的内容、可选的 `Further Exploration` 和最后的 `Dev Note`。
6. 同一次修改中更新双语对侧。保持标题、列表、表格、代码、链接、frontmatter 布局和物理行数对齐。
7. 对照代码、测试、生成器、包元数据或当前决策归属方核验每一项声明，并按下面的事实核验流程实际执行页面所指示的操作。先更新归属方，再更新任何衍生产物。
8. 先跑针对性检查，再跑 `pnpm run test:docs`、`pnpm run doc-sync`、`pnpm run lint` 和 `git diff --check`；重读完整 diff，先看正确性，再看简洁性和与仓库的契合度。

## 事实核验流程

文档描述的是产品当前的行为，而操作类声明的唯一有效证据是实际执行过。每个新文档，以及每个包含操作、命令、默认值、错误或平台差异声明的新段落，都必须执行本流程。

1. **在写安装指引前先判定对象类别。** 读事实，不要读文件夹名：从 `package.json` 看是否声明 `dsh.bundle.patch`，从入口文件看插件形态（导出 `apply` 或默认导出 service 的是插件；普通模块 API 是库）。bundle 用 `dsh plugin --profile <name> add <package>` 安装，这也是该命令唯一会激活 profile 层的包形态；插件以 `cordis.yml` 的一行挂载；库只是一项依赖，没有自己的安装路径。具有特殊状态的包（库、bundle）使用各自的 README 模板——绝不要套用带有不适用安装指引的插件 README。
2. **针对当前 checkout 执行每一项声明的操作。** 按文档将要展示的样子，逐条执行每个 CLI 命令、配置片段、profile 或 patch 示例；只写你观察到的内容，包括确切输出、警告和失败模式。如果某项声明依赖你没有的密钥或网络，说明这一点并写出核验归属方，而不要断言该行为。
3. **删掉无法复现的内容。** 绝不凭记忆、类比或邻近包的 README 搬运命令、字段、默认值或行为。声明无法复现时，修声明，不要修测试。
4. **用最新 master 检查旧文档。** 修订既有页面前先执行 `git fetch origin`，把相关章节与 `origin/master` 比对；配对 sidecar 可恢复任一侧最后确认的文本。master 上过时的说法仍然是错的：要对照代码改正，而不是对照旧文案。
5. **每次编辑后重新记录配对。** 每次成对编辑后重跑 `pnpm run verify-translation-pairing --write <pair>`，让 sidecar 追踪已确认的配对。

## kind 体系与模板

`kind` frontmatter 字段只选择一个 README 模板。[元数据参考](references/metadata-links-i18n.md#kind-体系)中的每个 kind 都恰好对应 [`templates/`](templates/) 里的一个模板文件，每个模板也只支撑一个 kind；文档检查会根据同样的机械事实推导出应使用的 kind。

- `package-group` → [templates/package-group.md](templates/package-group.md)：分组映射（`packages/README.md`、`packages/<group>/README.md`）——为能力族定位，映射其直接包，链接由包自己负责的细节。
- `package-reference` → [templates/package-reference.md](templates/package-reference.md)：Cordis 插件或 service 包——挂载配置、配置表、折叠的实现说明，以及门禁规定形式的 Model Experience 和 Known Limitations。
- `package-library` → [templates/package-library.md](templates/package-library.md)：没有插件表面的包——消费方入口、无 profile 安装路径、无挂载配置。
- `package-bundle` → [templates/package-bundle.md](templates/package-bundle.md)：声明 `dsh.bundle.patch` 的包——经过验证的 `dsh plugin` 安装路径、层语义、patch 文档。
- `persistence-change` → [templates/persistence-change.md](templates/persistence-change.md)：`docs/persistence-changes/` 下带日期的记录——确认机械检测到的类型迁移，附各 root 的前驱记录和生成的 after schema。
- `persistence-release` → [templates/persistence-release.md](templates/persistence-release.md)：`docs/persistence-changes/releases/` 下的固定 tag——比较重建出的历史类型，但不声称已做兼容性确认。
- `persistence-format` → [templates/persistence-format.md](templates/persistence-format.md)：`docs/persistence-changes/historical-formats/` 下的历史 Session 格式检查点，附完整 schema；当前写入器使用现有的 catalog。
- `upgrade-guide` → [templates/upgrade-guide.md](templates/upgrade-guide.md)：`docs/upgrade-guide/v<version>/<item>/guide.md` 及其中文姊妹篇——针对单个外部可感知破坏的迁移步骤，由 [dsh-create-upgrade-guide](../dsh-create-upgrade-guide/SKILL.md) 负责。

动笔前先打开模板，遵循其骨架和规则；模板会说明该 kind 是什么、页面如何组织，以及每一节需要承担哪些事实核验。只有同时具备独立模板文件、已记录的仓库位置或已声明的归属方，以及能把文档映射到该 kind 的针对性检查时，才新增 kind。

## 行文规则

这些规则决定一个章节可以说什么。它们适用于每个由人编写的面向人页面，对包 README 尤其严格。

- **Summary 说明对象能做什么。** 开头的 `Summary` 和面向用户的章节描述用户或 agent 能用该对象做什么——结果、收益、何时选择它、主要代价——而不是它的角色、类型或内部身份。包 Summary 里的“它是什么”只指读者可见的能力，不指它在 Cordis 中的角色、注册项或内部组件。除非读者会直接在配置、命令或公共 API 中使用，否则省略源码标识符。“这个 seam 注册 `ctx.x` 并追加 `x/event` 记录”是在讲身份；“你可以为每条消息保存一条笔记，重启后它仍然存在”才是在讲它能做什么。
- **开发者章节讲解释，不做罗列。** 折叠的实现内容涵盖整体设计理念、架构和粗线条的数据流——足以理解这个包如何工作——并链接代码以提供精确细节。折叠区里不出现完整的 API 目录、穷举的列清单、事件载荷枚举或 JSDoc 复述。
- **Dev Note 是唯一允许粗糙的区域。** 半成品想法、草稿、未定方向、实测产物和工作假设只放在最后的 Dev Note 中，并明确标注为非权威内容。其他每个章节都是打磨过的、描述当前状态的文字。
- **只讲当前状态。** 普通文档描述当前代码库。专门的 `persistence-change`、`persistence-release` 和 `persistence-format` 记录保留历史类型证据；发布对比和格式检查点描述观察到的历史，但不声称兼容性。`upgrade-guide` 描述从其版本目录对应的发布到下一个发布之间的变化。Agent Note 和复盘保留各自的历史范围。
- **使用受控技术英语。** 当歧义会改变行为时，为每个句子指定明确的执行者和一个主要动作。每个概念只用一个固定术语，优先使用直接动词，拆分叠加的指令和条件，并保持情态和例外不变。遵循[页面风格参考](references/style.md#受控技术英语)中源自 ASD-STE100 的非认证纪律。精确性会下降时，不要强行缩短句子。

## 质量标准

评审时使用以下定义。每个章节在子章节或穷举细节之前，先用一段简短的引导性文字开场。

- **简短：** 常见路径只包含达成其结果所需的事实；穷举性的真相始终只隔一个直接链接或一层细节。
- **直观：** 前置条件出现在依赖概念之前，下一个动作显而易见，标题使用读者会搜索的术语。
- **友好：** 读者能识别成功、在行动前理解风险、从可能的失败中恢复，并选择是否继续深入。
- **准确：** 每一项持久声明都有唯一归属方，以及与风险相称的核验路径。
- **agent 可读：** 元数据、稳定标题、锚点、术语、归属关系以及当前/拟定状态，支持在不加载整个语料库的情况下做定向检索。
- **新人可完整理解：** 不具备仓库背景的专业工程师，能通过三到五个互链页面重建相关架构或功能。

不要对穷举式参考套用统一的字数上限。要衡量入口路径长度、为查一处而扫过的无关材料、最大章节、标题数量和页面大小；检索成本高时，按既有的领域归属方拆分。

## 语料审计

阅读归属约定文件本身，不要转述摘要：[docs/AGENTS.md](../../../docs/AGENTS.md) 负责层级、教程/参考形态、分类法、预算和冗余清单；[.agents/notes/README.md](../../notes/README.md) 负责 Agent Note 生命周期；[docs/i18n/README.md](../../../docs/i18n/README.md) 负责双语配对规则；[根 AGENTS.md](../../../AGENTS.md) 负责长期指令。审计和编辑时排除 `.agents/notes/archived/`——归档笔记是冻结的历史。

对范围内每个面向人的文档应用标准的编写顺序（不适用于 Agent Note）：定位文档并说明其自身主题；设定允许的细节层级，把更深入的解释移到负责它的子页面并用链接关联；按预期用途而非路径判断它属于教程还是参考；对教程，按前置条件和难度排列概念；拆分体量较大的混合形态。然后检查放置约束：配对文档意味着每次编辑都要更新对侧并重新执行 `--write` 记录；生成目录绝不手工编辑；移动必须原子完成，并在同一次改动中修复所有入站链接。

结构检查之后，用成本最低的检查手段先排查冗余清单。推理过程记录泄漏用 [dsh-trim-cot-leakage](../dsh-trim-cot-leakage/SKILL.md) 处理；用 grep 搜索特征短语以找出重复的规则；把手写的目录和状态清单替换为其权威归属方；从已实现的 Agent Note 中删除迁移计划和将来时态的需求描述。用 `pnpm run verify-doc-budgets --list` 和字数扫描衡量离群页面；如果删除文字改变的是承诺的行为而不是对行为的解释，先提出行为变更（遵循 [dsh-find-simplifications](../dsh-find-simplifications/SKILL.md)）。保留每一条承重规则，最好是一到三行，再加一个指向其理由的链接；不要仅仅为了转移一次性推理而新造一段解释。

## 字数预算

`pnpm run verify-doc-budgets` 会把常驻文档与 [scripts/doc-budgets.manifest.json](../../../scripts/doc-budgets.manifest.json) 中的上限做比较；出现红色门禁时，按 [docs/AGENTS.md](../../../docs/AGENTS.md#wordcount-budgets) 中既定的迁移—压缩—上调顺序处理。上限是护栏，不是削减目标：达到或低于目标时，至少保留 5% 余量；只有文字确实需要空间时才上调上限，并在 PR 中说明 manifest 改动的理由。

## 网站发布

网站是经过测试的投影，绝不是第二份副本：[website/docs.ts](../../../website/docs.ts) 是显式的公开允许列表，把权威的 `docs/` 源映射到路由树；[scripts/project-doc-site.ts](../../../scripts/project-doc-site.ts) 把它们改写进一次性的 `website/.generated/` 树；VitePress 构建这棵树。仓库 Markdown 始终是唯一可编辑的内容源；译文保持同目录配对（`foo.md`、`foo.zh.md`、`foo.i18n.yaml`），绝不使用 locale 目录。已发布的页面只在权威源中修改；新增页面时加一条 manifest 条目；移动或删除时，同一次变更内原子更新源文件、manifest 条目和入站链接；绝不编辑 `website/.generated/`、`website/.cache/` 或 `website/.dist/`。每个 `DocsPage` 字段都要有意识地设置，并遵守投影器的链接规则；字段、侧边栏集合和预览命令见 [references/website-sync.md](references/website-sync.md)。把内容同步进构建并不等于发布：部署始终是另外一步，需要显式请求。

## 详细参考

只加载当前任务需要的参考。每份参考都直接从本文件链接，因此本 skill 没有深层参考链。

- [元数据、链接与双语配对](references/metadata-links-i18n.md)：README frontmatter、kind 体系及其推导、description 语义、仓库路径、行对齐和 sidecar 记录。
- [页面结构与层级](references/structure-hierarchy.md)：强制章节顺序、章节摘要、从用户到开发者的递进、docs 树放置、小型规则文件、Further Exploration 和 Dev Note 归属。
- [页面风格](references/style.md)：简短 Summary、`-----` 章节分隔线、可折叠内容章节和强调的使用纪律。
- [评审标准](references/review.md)：新人测试、证据检查、包 README 评审、参考范例和验证命令。
- [网站发布](references/website-sync.md)：manifest 字段、投影器链接规则、预览与校验、部署隔离。

[`templates/`](templates/) 中的模板为每个 `kind` 提供一个可用骨架；动笔前先打开文档 kind 对应的那个。

句子层面的约定覆盖和编辑判断使用 [prose-standard](../prose-standard/SKILL.md)。`session-persistence-jsonl` README 配对（[英文](../../../packages/session/session-persistence-jsonl/README.md)、[中文](../../../packages/session/session-persistence-jsonl/README.zh.md)）是参考范例：可搜索的 YAML、Summary 与 Table of Contents、带折叠开发者章节的从用户到开发者递进、Further Exploration、规范的 Model Experience 与 Known Limitations 章节，以及最后的 Dev Note。

## 验证

验证的是受影响的格式，而不仅仅是 Markdown 语法。一个强承诺需要有一个针对性的有效 fixture，以及一个能证明顶层门禁会失败的无效 fixture。

- README 元数据：解析 YAML，把 `kind` 映射到模板和文档标准，拒绝 `name`、`audience`、未被治理的 `tags` 和 README 局部的 `i18n` 元数据，并拒绝缺失或广告式的 description。
- 双语页面：校验结构、精确行数、术语、链接一致性和 sidecar 记录。
- 教程：实际走一遍文档中的入口路径，或明确指定人工核验归属方。
- 生成式参考：运行确定性的新鲜度检查，并报告检索规模指标。
- 包 README：运行 Summary 门禁，它把每个英文 Summary 限制在 100 个 `wc -w` 风格单词内，并把失败指回本 skill 和对应的 kind 模板；运行模型体验和限制检查，行为声明发生变化时再跑包内针对性测试；合并关于某条命令的声明前，重跑 README 指示的每条命令。
- Skill：运行仓库的 skill 调用元数据检查。

在完整的 `pnpm run doc-sync` 之前，先跑 `pnpm run test:docs` 做快速综合文档检查（配对、换行、链接、README 门禁、预算、skill 元数据、Agent Note 门禁）。

## Dev Note

None.

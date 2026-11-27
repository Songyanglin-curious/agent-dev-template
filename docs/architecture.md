# 体系架构

本文说明 agent-dev-template 研发文档体系的组成、职责边界、信息流和扩展方式。它是阅读其他文档的起点：先在这里建立整体认识，再沿链接进入子系统、模块或规则。

## 设计目标

这套体系要解决的不是“没有文档”，而是文档与研发活动脱节：维护文档被当成研发结束后的独立工作，AI 记不住要更新，积累的知识也没有在需要时被加载。因此它把文档放进研发流程本身，并用归属规则和自动化检查降低对自觉性的依赖。

核心原则是**一个事实一个归属**：每个事实只写在承担该职责的位置，其他文档通过相对链接建立联系。第二份副本视为缺陷，而不是备份。

## 四层信息结构

| 层 | 归属 | 回答的问题 | 生命周期 |
|---|---|---|---|
| 研发输入 | `研发输入/` | 为什么要做、依据什么、外部约束是什么 | 随需求变化，可整份删除 |
| 研发演进 | `.agents/notes/` | 选择什么方案、放弃了什么、代价是什么 | proposed → implemented → archived；rejected 作为护栏 |
| 系统认知 | [architecture](architecture.md)、[subsystems](subsystems/README.md)、模块 README、[持久化记录](persistence-changes/README.md) | 当前系统由什么组成、具有什么契约、如何演进 | 持续同步，只描述现状 |
| 工程知识 | [core-guidelines](core-guidelines/README.md)、[defensive-patterns](defensive-patterns/README.md)、[cookbook](cookbook/README.md)、[postmortem](postmortem/README.md)、Skills | 应该怎样设计、修改前检查什么、步骤是什么、事故如何发生 | 按需增删，由评审与门禁维护 |

治理横跨四层：根 `AGENTS.md` 决定何时读写哪一层，[文档标准](AGENTS.md) 决定每层怎么写，`scripts/` 检查能机械判定的结构约束。

## 系统认知的三层

架构回答“系统由哪些部分组成、依赖方向如何、修改入口在哪里”，它是有序地图而不是实现说明。子系统回答“某项能力的概念、类型、语义、生命周期和契约是什么”，供研究、设计和修改机制时查阅。模块回答“这个软件单元提供什么、何时选用、如何使用、边界在哪里”，随模块代码维护。

三层不要求一一对应：一个子系统可以跨多个模块，一个模块也可以服务多个子系统；模块组只在若干模块需要被一起理解时建立。复杂度确实需要时，可以在子系统内部复用同样的认知关系，而不是复制一整套目录。模块文档由 `kind` 发现；未声明元数据的 README 不进入自动检查，由评审发现。

## 一次研发的信息流

研发信息在四层之间流动，并有两个回环：验证发现的问题回到实施，沉淀出的经验回到下一次定位。

1. **输入**：需求、缺陷和外部约束进入 `研发输入/`，保留原文、来源和约束；它是外部要求，不是已确认决策。
2. **任务**：明确目标、范围、验收和约束；简单任务只存在于对话，复杂任务写简短说明。任务范围是实施边界，原始输入、任务和 Agent Note 用链接关联，不建 Issue 系统。
3. **决策**：存在长期取舍、被否决方案或跨模块影响时，在 `.agents/notes/` 建立 proposed 或 implemented 记录；机械性或局部修改不立记录。
4. **实施与同步**：代码、测试、配置和文档在同一次变更中完成；按根 `AGENTS.md` 的触发表更新系统认知与决策记录。
5. **验证与交付**：按变更范围选择检查；交付说明实际变更、验证、风险和状态，交付不等于发布。可复用的经验再进入准则、防御模式、cookbook 或 Skill。

具体规则见根 `AGENTS.md`、[文档标准](AGENTS.md)、[Agent Note 规则](../.agents/notes/README.md) 和专项 Skills；不存在统一研发流程 Skill。

## 目录与归属映射

| 路径 | 归属的事实 | 维护入口 |
|---|---|---|
| `研发输入/` | 原始需求、外部资料、梳理草稿 | 同目录 README |
| `.agents/notes/` | 设计问题、方案、取舍、后果 | [Agent Note 规则](../.agents/notes/README.md) |
| `docs/architecture.md` | 整体组成、依赖方向、扩展点 | 本页 |
| `docs/subsystems/` | 能力语义、类型契约、重要机制 | [子系统索引](subsystems/README.md) |
| 模块 README | 模块能力、使用、契约、限制 | [doc-writing](../.agents/skills/doc-writing/SKILL.md) |
| `docs/core-guidelines/` | 写代码的设计规则 | [准则索引](core-guidelines/README.md) |
| `docs/defensive-patterns/` | 修改某类工件前的缺陷检查 | [模式索引](defensive-patterns/README.md) |
| `docs/cookbook/` | 已验证的固定操作步骤 | [指南索引](cookbook/README.md) |
| `docs/postmortem/` | 事故经过与系统性根因 | [复盘规则](postmortem/README.md) |
| `docs/persistence-changes/` | 持久化格式的历史结构与兼容决策 | [记录规则](persistence-changes/README.md) |
| `.agents/skills/` | 场景工作流与判断标准 | 各 Skill 的 `SKILL.md` |
| `scripts/` | 可机械判定的结构约束 | [文档门禁](subsystems/documentation-gates.md) |

## 关键机制

- **任务范围是实施边界**：调查、研究、讨论默认只读；实施在明确范围内自主完成；超出范围、改变方向或触及未预期契约、持久化、安全、外部操作时暂停确认。交付不等于发布。
- **变更范围与检查选择**：`change-scope` 报告相对基线的已提交、暂存、未暂存和未跟踪路径；[pre-push-checks](../.agents/skills/pre-push-checks/SKILL.md) 按触及面选择最小证据；[code-review](../.agents/skills/code-review/SKILL.md) 先读要求和归属，再读 diff。
- **生命周期表达状态**：Agent Note 所在目录、`Status:` 行和正文章节必须一致，由 `verify-agent-note-format` 交叉检查；归档记录冻结并追加 hash。
- **门禁只检查结构**：脚本负责格式、元数据、链接、锚点、字数、冻结状态和生成区域所有权；语义质量由评审和 Skills 负责。
- **变更影响清单**：`verify-change-docs` 把“回忆哪些文档受影响”变成按 manifest 生成的逐项清单；`remind` 始终提示，`require` 只在 CI 的 `--strict` 下失败；当前没有 `require` 规则。

## 扩展点

- **新增文档 kind**：同时提供模板、仓库位置和针对性检查，并更新[文档标准](AGENTS.md)的分类法与 doc-writing 的 kind 表；只增加名称不算新增 kind。
- **新增门禁**：按 [cookbook](cookbook/add-a-doc-gate.md) 的步骤实现共享解析、清单登记、命令注册、文档同步和失败路径用例。
- **新增 Skill**：只在存在明确触发场景和判断标准时建立，并在根 `AGENTS.md` 的触发表中接入。
- **新增子系统**：在 `docs/subsystems/` 建页，并在相关模块文档和架构页中链接；没有独立契约的目录不建页。

## 边界

本仓库不建立文档网站、不做双语文档配对、不检查文档中的类型与源码等价，也不内建 Issue、PR 或任务管理自动化。这些机制依赖具体技术栈和托管平台；需要时由使用这套体系的项目按同样归属原则自行接入。任务在对话或简短说明中表达，不构成新的常驻文档层。

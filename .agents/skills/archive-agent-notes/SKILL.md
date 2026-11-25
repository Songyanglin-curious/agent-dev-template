---
name: archive-agent-notes
description: 在本项目中新增、审计、精简、归档、恢复或复核 Agent Notes 时使用；检查每条新 note 是否已被 active 记录取代，删除小 UI 与纯机械性记录，按未来决策价值对其余 implemented notes 分类，删除不再能阻止诱人谬误的 rejected notes，并应用冻结的 archived/{kind} 记录与 manifest 规则。
---
# 归档 Agent Notes

在不抹去仍能指导工作的历史的前提下，缩减生效中的 decision corpus（决策语料）。逐条对 note 做语义判断；字数与年龄只是发现线索，从来不是归档标准。

## 阅读约定

分类之前，先阅读 [Agent Note 规则](../../notes/README.md)、[归档说明](../../notes/archived/AGENTS.md)，以及适用的 active 生命周期说明。借助当前代码、配置、模块文档、生成目录、更新的 Agent Notes 与 inbound links，判断某条 rationale 是否仍然拥有或约束着什么。

## 新增 note 时检查 supersession

起草之前，先套用 [创建标准](../../notes/README.md#何时需要写一份)。每新增一条 Agent Note，都会触发一次范围化审计：检查覆盖同一决策、机制或被否决替代方案的 active notes。在撰写新 note 的同时，对每一次完全或部分 supersession 作出分类：在同一次变更中归档符合条件的 implemented 记录；保留部分 supersession 或仍有独立价值的 rationale，并建立交叉链接；否决（reject）过时的提案；删除不再能阻止可信错误的 rejected notes。当新的 owner 吸收了全部独有命题时，套用 Agent Note 合并规则；不要把已知的匹配推迟到之后的语料审计。

## 按未来价值分类

按生命周期分别套用以下结论：

- **Implemented — 删除：** 删除只描述小幅 UI 调整或纯机械性变更的完整记录，并修复或移除 inbound links。本地缺陷修复、性能改动、新能力，以及实质性的行为或归属决策，不会仅仅因为已经实现就符合删除条件。先按此标准判断，再进入保留/归档分类。
- **Implemented — 保持 active：** 当某条 note 的 rationale、替代方案、负向保证、durable/wire 语义、归属边界、安全规则或重新引入条件很可能指导未来变更时，保留它。要分类的是决策本身，而不是它的实现手法：一次机械的重命名或类型提取，同样可能记录下长期有效的命名、兼容性或归属规则。长度无关紧要。
- **Implemented — 归档：** 当某项实质性的历史决策已经完成、且不太可能指导未来工作，但其历史 rationale 仍值得留存时，归档它。符合直接删除标准的记录不要归档。
- **Proposed — 永不归档：** 仍然有效的提案保持 active；若已不值得推进，就用诚实的理由否决它，并满足 rejected 生命周期的格式要求。
- **Rejected — 只作为护栏保留：** 只有当被否掉的提案仍是一种诱人而有意义的错误，且 note 解释了它为何落败时，才保留这条否决记录。
- **Rejected — 删除：** 当被否决的想法已过时、已被取代、不再可信，或不太可能再阻止旧事重提时，删除整条记录。修复或删除 inbound links。

不要为了凑配额而归档。检查范围内每条 note，对同类分组套用同一原则，边界情形凭最佳判断处理，并把真正拿不准的决策记录下来供交接。

## 校准示例

以下示例给出判断尺度；其中的字数说明篇幅并不是判据。

暂时没有例子，后续遇见进行补充

## 归档一条 implemented 记录

1. 把 `foo.md` 从 `implemented/<kind>/` 移动到 `archived/<kind>/`；归档路径中刻意不含 `implemented`。
2. 不改动正文。紧接 `Status: implemented` 之下插入 `Archived: YYYY-MM-DD`，使用归档日期。
3. 不要在 note 内部改写、重排格式、更新事实或修复链接。既有标题标点与空行布局保持原样，它们不是归档的前提条件。
4. 从 active 正文中搜索 inbound links。把它们改指向当前权威，只有在有意引用历史快照时才改指向 archived 路径，否则删除。不要从 archived note 出发去校验或修复链接。
5. 运行 `pnpm run verify-archived-agent-notes --write`。它的 append-only 模式先证明每个已有 seal 仍然匹配，然后只追加新记录的 hash。之后再运行常规校验器。

记录一旦封存，就永远不要编辑、移动、重排格式或删除它。archived notes 仍然是有效的 inbound-link 目标，但它们是历史快照，不是当前行为的权威。

## 验证并报告

运行 `pnpm run verify-archived-agent-notes` 与 `git diff --check`；其他证据按仓库现有门禁选择。

报告保留的 active implemented notes、被删除或归档的 implemented notes、保留与删除的 rejected notes、若有则报告被否决的 proposed notes，以及每个真正处于边界的情形（含字数与所选结论）。不要声称 archived 的出站链接有效：归档校验器有意从不检查它们。

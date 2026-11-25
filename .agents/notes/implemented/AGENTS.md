# AGENTS.md — 已实现的 Agent Notes

这些 Agent Notes 记录已交付的决策。请遵循 [根目录说明](../../../AGENTS.md)、[文档标准](../../../docs/AGENTS.md) 与 [Agent Note 格式](../README.md#文件格式)；`verify-agent-note-format` 会把守按生命周期区分的结构。

## 让 implemented Agent Note 与实际交付保持一致

在改动路径、符号、默认值与机制的同一处改动中，同步更新它们。就地重写过时的事实；不要追加变更历史。

当某条已交付的 note 不太可能指导未来工作时，通过 [archive-agent-notes](../../skills/archive-agent-notes/SKILL.md) 归档其完整 triplet，而不是继续维护它。

### 这并不是重写 *decision* 的许可

就地更新事实性的落地表述。若要推翻该决策或其 rationale，需要新增一条 Agent Note 并建立交叉链接；完全被取代的旧 note 只能依据 [Agent Note 规则](../README.md) 中的合并规则删除。

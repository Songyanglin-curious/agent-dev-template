# AGENTS.md — Agent Notes

智能体笔记实际上是由智能体编写的 RFC：即持久化的提案与决策记录，用于保留理由、备选方案、后果以及所需的验证。请遵循文档标准和智能体笔记规则。

每新增一条智能体笔记都会触发一次取代检查。请在活动树中搜索覆盖同一决策或机制的较早笔记，用 `dsh-archive-agent-notes` 对任何完全或部分取代进行分类，并在同一个 PR 中归档所有符合条件的已实现三元组。请让部分取代保持活动状态并建立交叉链接。

`archived/` 下的文件是冻结的历史快照：切勿编辑它们，也不要将其视为当前权威。

Agent Notes are effectively RFCs written by agents: durable proposals and decision records that preserve rationale, alternatives, consequences, and required verification. Follow the [documentation standard](../../docs/AGENTS.md) and the [Agent Note rules](README.md).

**Every new Agent Note triggers a supersession check.** Search the active tree for older notes covering the same decision or mechanism, classify any full or partial supersession with [`dsh-archive-agent-notes`](../skills/dsh-archive-agent-notes/SKILL.md), and archive every qualifying implemented triplet in the same PR. Keep partial supersessions active and cross-linked.

Files under [`archived/`](archived/AGENTS.md) are frozen historical snapshots: never edit them or treat them as current authority.

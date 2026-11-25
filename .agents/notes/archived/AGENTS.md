# AGENTS.md — 已归档的 Agent Notes

各 kind 目录下的 archived Agent Note triplet 是冻结的历史快照，不是当前权威。对已封存的 artifact，永远不要编辑、重排格式、翻译、修复、删除或移动；新的决策与事实请使用 active Agent Note 或当前文档。

归档这次改动只允许：整体移动一个完整的 triplet（英文、中文与 sidecar 三份文件），在两个 `Status: implemented` 行之下插入完全相同的 `Archived: YYYY-MM-DD` 行，重录 sidecar，以及修复或删除 inbound links。不要从 archived notes 出发去检查、校验或修复链接。

运行 [archive-agent-notes](../../skills/archive-agent-notes/SKILL.md) 工作流，并用 `pnpm run verify-archived-agent-notes --write` 追加新的 artifact hash。常规校验器会拒绝被改动或缺失的 sealed artifact、不完整的 triplet、未知的 kind 目录，以及无效的归档元数据。

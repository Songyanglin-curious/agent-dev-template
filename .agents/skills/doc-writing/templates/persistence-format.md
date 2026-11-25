# 模板：persistence-format

本 kind 用于 `docs/persistence-changes/historical-formats/vN.md` 及其中文姊妹篇。每条记录描述一个显式选定的历史 Session 格式检查点，并包含完整声明的类型。它是格式参考，不是发布记录，也不是兼容性确认。检出副本中的写入器使用现有的当前 catalog。

## Frontmatter

```yaml
---
description: "The historical Session format, source checkpoint, and persistence types documented here."
kind: persistence-format
---
```

## 章节

1. **Summary：** 说明该格式及其有区分度的持久化字段。
2. **Table of Contents：** 用共享的双语锚点链接后续章节。
3. **源码证据：** 写明 tag 或 PR，以及足以选定源码树的上下文。PR 的中间树不得被呈现为它的最终合并结果或产品发布。历史来源使用不带行号的文件路径；除非链接到确切源文件，否则保持为文本。
4. **格式特征：** 解释 header、event 和物理编码上的差异；超出声明类型清单的行为要链接其编解码归属方。
5. **Declaration：** 每种语言各包含一个完全相同的 `yaml persistence-format` 块，其中有 `schemaVersion: 1`、数值型 `sessionFormatVersion`、恰好包含一个 `tag` 或数值型 `pullRequest` 的 `source`，以及把每个 root 键映射到其捕获 SHA-256 digest 的 `roots`。链接同目录的 `vN.schema.json`。
6. **完整 schema：** 保留一个 `persistence-format-schema:start` / `persistence-format-schema:end` 注释区域。格式校验器会在这里渲染 root digest 和所有可达定义。
7. **验证与限制：** 写明实际提取证据、覆盖范围限制和离线校验器。保留历史可选字段和不透明声明，但不声称已获编解码准入或迁移安全。
8. **Dev Note：** 保留给非权威的工作语境，或写 `None.`。

[格式索引](../../../../docs/persistence-changes/historical-formats/README.md)负责覆盖范围与维护。`pnpm run verify-persistence-formats --write` 会先校验 schema，再刷新生成区域和配对记录。它无法创建历史证据或修复机器数据。当前写入器前进时，每个更旧的整数都要保留文档；不要以历史文件名重复当前的 catalog。

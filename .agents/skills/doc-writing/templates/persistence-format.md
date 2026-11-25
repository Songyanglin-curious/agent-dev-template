# 模板：persistence-format

此类型用于 `docs/persistence-changes/historical-formats/vN.md` 及其中文对应文档。每条记录描述一个明确选定的历史 Session 格式检查点，包含完整的声明类型。该记录用于格式查阅，不承担发行记录或兼容性确认的作用。当前检出版本的写入器使用现行目录。

## 元数据

```yaml
---
description: "记录历史 Session 格式、源码检查点及持久化类型。"
kind: persistence-format
---
```

## 章节

1. **Summary**：指出格式及其有辨识度的持久化字段。
2. **Table of Contents**：用双语共用的锚点链接后续章节。
3. **Source evidence**：注明标签或 PR，并提供足以确定源码树的信息。PR 的中间源码树不能当作最终合并版本或产品发行版本。历史源文件路径不附行号，只有能指向确切源码时才写成链接。
4. **Format characteristics**：解释头部、事件和物理编码的差异。声明类型清单之外的行为链接到负责的编解码器。
5. **Declaration**：每种语言各含一个相同的 `yaml persistence-format` 块，字段包括 `schemaVersion: 1`、数值型 `sessionFormatVersion`、仅含一个 `tag` 或数值型 `pullRequest` 的 `source`，以及将每个根类型键映射到所记录 SHA-256 摘要的 `roots`。链接同级 `vN.schema.json`。
6. **Complete schemas**：保留一个由 `persistence-format-schema:start` 和 `persistence-format-schema:end` 注释划定的区域。格式校验器在此生成根摘要和所有可达定义。
7. **Verification and limitations**：说明实际提取证据、覆盖限制和离线校验器。保留历史可选字段和不透明声明，避免据此宣称编解码器会接纳该格式或迁移是安全的。
8. **Dev Note**：存放非权威工作背景。没有内容时填写 `None.`。

[格式索引](../../../../docs/persistence-changes/historical-formats/README.md) 负责覆盖范围和维护。`pnpm run verify-persistence-formats --write` 验证 schema 后，再刷新生成区域和配对记录。该命令无法创建历史证据或修复机器数据。写入器升级时继续记录每个旧的整数版本，避免以历史文件名复制当前目录。

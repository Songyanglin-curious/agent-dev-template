# 模板：persistence-release

本 kind 用于 `docs/persistence-changes/releases/dsh-v<version>.md` 及其中文姊妹篇。这些记录重建已打 tag 的持久化类型，供人工比较和格式校验。它们是观察结果，不是兼容性确认，也不参与当前源码的历史。

## Frontmatter

```yaml
---
description: "The tagged persistence types and adjacent-release differences recorded here."
kind: persistence-release
---
```

## 章节

1. **Summary：** 说明与上一个可用 tag 相比的具体类型差异或没有差异，并在相关时说明 Session 写入器版本。
2. **Table of Contents：** 用共享的双语锚点链接后续章节。
3. **发布证据：** 写明源 tag 和已打 tag 的源码路径，然后用相对路径链接前一条记录和 schema 伴随文件。说明重建的限制。
4. **Declaration：** 恰好包含一个 `yaml persistence-release` 块，其中有 `schemaVersion: 1`、`tag`、`previous`、`sessionFormatVersion` 和 `changes`。每项变更写明 `root`、`before` 和 `after`；null 表示缺失。两种语言的机器块完全相同。
5. **结构变更：** 列出机械检测到的路径和类型。按当前规则做的分类仅供参考；它们不能确立历史发布的安全性，也不意味着观察到的写入器版本提升过。
6. **验证：** 写明实际执行的重建和校验证据。`pnpm run verify-persistence-releases` 无需检出源码、Git 或网络访问，即可校验已提交的归档。
7. **Dev Note：** 把该章节保留给非权威的工作语境，或写 `None.`。

## 快照与历史规则

[归档参考](../../../../docs/persistence-changes/releases/README.md)负责固定的发布 manifest 和提取限制。第一条记录包含每个已提取的 root；后续 schema 伴随文件只包含仍然存在且发生变化的 root，以及它们所有可达的类型定义。空变更和快照用于保留类型未变的发布。每条记录引用 manifest 中紧邻的前一个条目。

索引表、清单单元格和结构变更事实分别使用 `persistence-release-index`、`persistence-release-inventory` 和 `persistence-release-changes` 起止注释标记。把人工解释放在这些生成区域之外。`pnpm run verify-persistence-releases --write` 会先校验所有机器数据，再刷新事实区域和配对记录；它会保留由人编写的文字、机器声明和 schema 文件。默认校验会拒绝过时的生成事实和缺失的固定索引文件。

保持源码中的 `number` 声明和历史可选字段不变。单独报告实际的写入器版本常量。历史解析允许 surface 事件带有可选 `surfaceOp`；当前持久化解析器和确认规则仍然严格。绝不要把这些回溯记录插入当前源码的确认链，也不要为了迁就旧发布而重写已提交的基线。

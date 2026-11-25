# 模板：persistence-release

此类型用于 `docs/persistence-changes/releases/dsh-v<version>.md` 及其中文对应文档。记录重建指定标签下的持久化类型，供人工比较与格式验证。这些记录只描述观察结果，不作兼容性确认，也不进入当前源码的历史记录链。

## 元数据

```yaml
---
description: "记录指定标签下的持久化类型及相邻发行版本间的差异。"
kind: persistence-release
---
```

## 章节

1. **Summary**：说明与前一个可用标签相比有哪些具体类型差异，或明确没有差异。有关时写明 Session 写入器版本。
2. **Table of Contents**：用双语共用的锚点链接后续章节。
3. **Release evidence**：列出源标签及该标签中的源文件路径，再用相对链接指向前序记录和配套 schema。说明重建的局限。
4. **Declaration**：恰好包含一个 `yaml persistence-release` 块，字段包括 `schemaVersion: 1`、`tag`、`previous`、`sessionFormatVersion` 和 `changes`。每项变更指定 `root`、`before` 和 `after`，用 null 表示不存在。双语机器块完全一致。
5. **Structural changes**：列出自动检测到的路径及变更类型。按现行规则得出的分类仅供参考，不能据此确认历史版本安全或推断当时的写入器版本已提高。
6. **Verification**：记录实际执行的重建和验证证据。`pnpm run verify-persistence-releases` 验证已提交的归档，无需源码检出、Git 或网络访问。
7. **Dev Note**：存放非权威的工作背景。没有内容时填写 `None.`。

## 快照与历史规则

[归档参考](../../../../docs/persistence-changes/releases/README.md) 维护固定的发行清单和提取范围。首条记录包含所有提取出的根类型。后续配套 schema 仅包含发生变化且仍存在的根类型及其所有可达类型定义。类型未变的版本也须用空变更和空快照保留。每条记录引用清单中紧邻的前一项。

索引表、清单单元格和结构变更事实使用 `persistence-release-index`、`persistence-release-inventory` 和 `persistence-release-changes` 的起止注释标记。人工说明应放在生成区域之外。`pnpm run verify-persistence-releases --write` 先检查全部机器数据，再刷新事实区域和配对记录，并保留手写正文、机器声明及 schema 文件。默认校验会拒绝过时的生成事实，以及缺失的固定索引文件。

原样保留源码中的 `number` 声明和历史可选字段。另行记录写入器实际使用的版本常量。历史解析允许接口事件的 `surfaceOp` 为可选字段，当前的持久化解析器和确认规则仍按严格要求处理。禁止将回溯记录插入当前源码的确认链，或为容纳旧版本而改写已提交的基线。

# 模板：persistence-change

此模板用于 `docs/persistence-changes/YYYY-MM-DD-slug.md` 及其中文对应文档。目录 README 用于索引。记录只确认自动检测到的持久化类型变更。生成的同级 JSON 保留完整的变更后 schema，使验证无需 Git 基线。

## 元数据

```yaml
---
description: "说明变更的持久化类型和本记录所解释的兼容性决定。"
kind: persistence-change
---
```

## 骨架

生成器填充机器声明、配套 schema 和一致性记录。不属于既有同版本情形的结构变更需要显式的兼容性决定。向 `--prose` 提供 JSON，其中 `en` 和 `zh` 对象均包含手写的 `summary`、`compatibility` 和 `verification` 字符串。Compatibility 说明新旧读者两个方向上的兼容情况，Verification 记录实际执行的检查。[操作指南](../../../../docs/cookbook/reviewing-persistence-type-changes.md) 展示具体步骤。下列字段请使用实际生成的根类型名称、记录 ID 和摘要。

````markdown
# Persistence change: <具体的持久化变更>

English | [中文](YYYY-MM-DD-slug.zh.md)

## Summary

描述自动检测到的变更和版本决定。

## Table of Contents

- [Declaration](#declaration)
- [Compatibility](#compatibility)
- [Verification](#verification)
- [Dev Note](#dev-note)

<a id="declaration"></a>
## Declaration

```yaml persistence-change
schemaVersion: 1
id: YYYY-MM-DD-slug
baseline: false
changes:
  - root: event:example/message
    previous: YYYY-MM-DD-predecessor
    after: <generated-64-character-sha256-hex>
    decision: same-version
```

<a id="compatibility"></a>
## Compatibility

解释每条检测路径的兼容性决定。说明旧读取器如何保留语义、安全忽略可选数据，或在执行或恢复之前拒绝必需特性。说明新读取器如何保留历史语义以及处理混合表示。特性缺失时延续现有行为。若提高版本，链接相邻版本的迁移说明并指明验证负责方。

<a id="verification"></a>
## Verification

记录实际运行的命令及其结果。链接支持兼容性说明的针对性测试或留存证据。

<a id="dev-note"></a>
## Dev Note

None.
````

## 规则

- 恰好保留一个 `yaml persistence-change` 块。中英文块逐字节相同。校验器解析一次英文记录，再检查其中文对应文档。
- 文件名主干与 `id` 一致。根类型的 `previous` 指向前序记录，`null` 表示新增该根。`after` 与生成的配套 schema 摘要一致，`null` 表示删除。
- 用一条初始 `baseline: true` 记录覆盖完整的类型清单。常规变更使用 `baseline: false` 并保留已确认的前序记录。版本提升记录应包含本次递增的 `SessionHeader.version` 变化。
- 仅凭结构差异无法推导版本提升。需审查的同版本变更要显式指定 `--decision same-version`。头部版本变化时推导为 `version-bump`。显式决定不能免除头部版本递增的要求。该命令不修改源码，也不给出验证结论。
- 只解释检测到的持久化类型变更。此类型允许记录变更前后事实及所需的历史证据，单纯行为变更不在范围内。
- 创建记录或更新末端记录时会生成目录对及一致性伴随文件。审查两种语言并保留生成的配套文件。直接编辑正文也须重录配对，禁止手工维护 schema 节点或摘要。
- 只有更新尚未确认的末端记录时才显式使用 `--update`，该选项拒绝基线和已有后继依赖的记录。`--prose` 会替换手写解释，省略时原样保留。被标记的同版本更新须显式指定 `--decision same-version`，并依据完整的变更重新评估解读。已确认的记录应新增后继。
- [目录参考](../../../../docs/persistence-changes/README.md) 定义兼容性规则，[操作指南](../../../../docs/cookbook/reviewing-persistence-type-changes.md) 说明命令和恢复步骤。

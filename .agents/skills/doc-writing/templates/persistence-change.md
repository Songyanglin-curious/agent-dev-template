# 模板：persistence-change

用于 `docs/persistence-changes/YYYY-MM-DD-slug.md` 及其中文姊妹篇。该文件夹的 README 是索引，不是记录。记录只确认机械检测到的持久化类型变更。其生成的 JSON 姊妹文件保留完整的 after schema，因此核验不需要 Git 基线。

## Frontmatter

```yaml
---
description: "The persisted types changed and the compatibility decision this record explains."
kind: persistence-change
---
```

## 骨架

生成器会填充机器声明、schema 伴随文件和一致性记录。既有同版本用例之外的结构性变更需要明确的兼容性决策。提供带 `en` 和 `zh` 对象的 `--prose` JSON，每个对象包含由人编写的 `summary`、`compatibility` 和 `verification` 字符串。用 Compatibility 解释两个方向的读者行为，用 Verification 记录实际执行的检查。[cookbook](../../../../docs/cookbook/reviewing-persistence-type-changes.md) 演示了该操作。在下列字段中使用实际生成的 root 名称、记录 id 和 digest。

````markdown
# Persistence change: <specific persisted change>

English | [中文](YYYY-MM-DD-slug.zh.md)

## Summary

Describe the mechanically detected change and its version decision.

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

Explain the declared decision for every detected path: how older readers preserve meaning, safely ignore optional data, or refuse required features before execution or recovery; and how new readers preserve historical meaning and mixed representations. Feature absence retains existing behavior. For a version bump, link the adjacent migration and its verification owner.

<a id="verification"></a>
## Verification

Record the commands actually run and their outcomes. Link focused tests or preserved evidence that support the compatibility explanation.

<a id="dev-note"></a>
## Dev Note

None.
````

## 规则

- 只保留一个 `yaml persistence-change` 块。英文块和中文块逐字节一致；校验器解析一次英文记录，再检查其对应中文。
- 文件名主干与 `id` 一致。某个 root 的 `previous` 标识其前驱记录；`null` 表示引入新 root。其 `after` 与生成的伴随 schema digest 一致；`null` 表示记录删除。
- 一条初始的 `baseline: true` 记录覆盖完整清单。常规变更使用 `baseline: false` 并保留已接受的前驱。版本提升记录携带自己的、递增的 `SessionHeader.version` 迁移。
- 仅凭结构差异不能推断出版本提升。需要评审的同版本变更要显式指定 `--decision same-version`；header 版本变化则推断为 `version-bump`。显式决策不能豁免必需的 header 提升。该命令不提供源码改动或校验声明。
- 只解释检测到的持久化类型变更。该 kind 允许承载该迁移所需的 before/after 事实和历史证据；纯行为变更不在范围内。
- 记录创建和终态记录更新会生成 catalog 配对和一致性 sidecar。评审两种语言并保留生成的伴随文件。直接编辑文字后仍需重新记录配对；不要手工维护 schema 节点或 digest。
- 只对未被接受的终态记录使用显式 `--update`。它会拒绝 baseline 和被依赖的记录；`--prose` 会替换由人编写的说明，省略时则保留。被标记的同版本更新需要显式 `--decision same-version`；要对照完整迁移重新评估说明。已接受的记录会获得后继记录。
- [文件夹参考](../../../../docs/persistence-changes/README.md)负责兼容性规则；[cookbook](../../../../docs/cookbook/reviewing-persistence-type-changes.md) 负责命令与恢复。

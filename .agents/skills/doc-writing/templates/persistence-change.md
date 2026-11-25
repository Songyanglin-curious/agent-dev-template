# 模板：persistence-change

用于 `docs/persistence-changes/YYYY-MM-DD-slug.md`。该文件夹的 README 是索引，不是记录。记录只确认机械检测到的持久化数据结构变更——类型、字段或物理编码的变化；生成的 schema 伴生文件保留完整的 after schema，因此核验不需要 Git 基线。

检测、生成和校验由项目按所用持久化技术实现（关系数据库、配置文件、游戏存档、事件日志、导入导出文件等的提取方式各不相同）。工具就绪前不要创建本类记录：把临时决策留在 Agent Note 或复盘中，工具就绪后从一条 baseline 记录开始。

## Frontmatter

```yaml
---
description: "被检测到的持久化类型变更，以及本记录解释的兼容性决策。"
kind: persistence-change
---
```

## 骨架

````markdown
# Persistence change: <具体变更>

## Summary

说明机械检测到的变更及其版本决策。

## Table of Contents

- [Declaration](#declaration)
- [Compatibility](#compatibility)
- [Verification](#verification)
- [Dev Note](#dev-note)

## Declaration

```yaml persistence-change
schemaVersion: 1
id: YYYY-MM-DD-slug
baseline: false
changes:
  - root: <root 标识>
    previous: YYYY-MM-DD-predecessor
    after: <生成的 64 字符 sha256 hex>
    decision: same-version
```

## Compatibility

解释每一项被检测路径的决策：旧读取方如何保留含义、安全忽略可选数据，或在执行与恢复之前拒绝必需特性；新读取方如何保留历史含义和混合表示。特性缺失时保持既有行为。版本提升时，链接相邻的迁移记录及其验证归属方。

## Verification

记录实际执行的命令及其结果。链接支撑兼容性解释的针对性测试或保留的证据。

## Dev Note

None.
````

## 规则

- **只保留一个 `yaml persistence-change` 块。** 机器声明由项目工具生成和解析，人工说明写在块外；重录时不要让生成器覆盖人工段落，也不要手工填写 digest。
- **文件名与声明一致。** 文件名主干与 `id` 一致。某个 root 的 `previous` 标识其前驱记录；`null` 表示引入新 root。其 `after` 与生成的伴生 schema digest 一致；`null` 表示记录删除。
- **baseline 只用在起点。** 一条初始的 `baseline: true` 记录覆盖完整清单。常规变更使用 `baseline: false` 并保留已接受的前驱。
- **不凭结构差异推断版本提升。** 需要评审的同版本变更要显式声明 `decision: same-version`；持久化格式版本常量变化则推断为 `version-bump`。显式决策不能豁免必需的版本提升，版本提升记录要携带自己的、递增的迁移。
- **范围限于持久化类型变更。** 该 kind 允许承载迁移所需的 before/after 事实和历史证据；纯行为变更不在范围内，属于系统文档或 Agent Note。
- **已接受的记录只增不改。** 记录被接受后，后续演进通过新增后继记录表达；只有尚未被接受的终态记录才使用工具提供的重录入口重新生成，并对照完整迁移重新评估人工说明。
- **生成产物随记录一起提交。** 记录创建和终态更新由项目工具生成 schema 伴生文件；评审时保留这些伴生文件，不要手工维护 schema 节点或 digest。
- **兼容性规则与操作步骤各有归属方。** 项目按需建立 `docs/persistence-changes/README.md` 承载兼容性规则，并在 cookbook 中记录工具命令与恢复流程；这些归属方建立前，在记录的 Verification 章节写明判断依据，不要声称运行了不存在的校验。

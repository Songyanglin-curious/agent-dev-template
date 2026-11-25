# 模板：upgrade-guide

此类型用于 `docs/upgrade-guide/v<version>/<item>/guide.md` 及其中文对应文档 `guide.zh.md`。中文文档设有 `## 变更` 和 `## 迁移` 两节。此目录树没有文件夹索引。[dsh-create-upgrade-guide](../../dsh-create-upgrade-guide/SKILL.md) 定义适用范围、存放位置、维护方式和篇幅要求，由 `pnpm run verify-upgrade-guides` 校验。

## 元数据

```yaml
---
kind: upgrade-guide
description: "说明外部可感知的破坏性变更及替代方案。"
---
```

## 骨架

````markdown
# <具体的破坏性变更，例如 `--profile` 替代 `--preset`>

English | [中文](guide.zh.md)

## Change

说明相关接口的新旧行为，以及哪些读者会感知到变化。

## Migration

1. 指出要修改的确切文件、键、命令或符号。若前后对照片段更简洁，就用片段说明。
2. 说明如何确认迁移成功。
````

# 模板：upgrade-guide

本 kind 用于 `docs/upgrade-guide/v<version>/<item>/guide.md` 及其中文姊妹篇 `guide.zh.md`，后者的章节是 `## 变更` 和 `## 迁移`。该目录树没有文件夹索引。[dsh-create-upgrade-guide](../../dsh-create-upgrade-guide/SKILL.md) 负责范围、放置、维护和长度规则；`pnpm run verify-upgrade-guides` 强制执行它们。

## Frontmatter

```yaml
---
kind: upgrade-guide
description: "The externally perceptible surface that breaks and what replaces it."
---
```

## 骨架

````markdown
# <Specific break, for example: `--profile` replaces `--preset`>

English | [中文](guide.zh.md)

## Change

State the old and new behavior of the surface and who observes it.

## Migration

1. Name the exact file, key, command, or symbol to change, with a before/after snippet when it is shorter than prose.
2. State how to confirm the migration worked.
````

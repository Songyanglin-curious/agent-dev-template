# 模板：package-group

用于 `packages/README.md` 和每份 `packages/<group>/README.md`。页面用于导航，介绍这一组包提供的能力，为每个直接下属包写一句职责说明，并链接到各包负责的文档。不要在组索引重复包契约。

## 元数据

```yaml
---
description: "介绍 <group> 包组下各包的职责，帮助读者选用包或查找相关文档。"
kind: "package-group"
---
```

## 骨架

```markdown
# <group>/ — <一句话主题>

English | [中文](README.zh.md)

## Summary

用三到五句说明这一组提供什么、读者能做什么、各部分由哪个包负责，以及最重要的使用边界。英文用 `wc -w` 的方式计数，最多 100 个词。遵循[摘要表述规则](../SKILL.md#voice-rules)。

## Table of Contents

- [Packages](#packages)
- [Related documentation](#related-documentation)
- [Dev Note](#dev-note)

-----

<a id="packages"></a>
## Packages

先用一句话交代主题，再列出下属包：

| 包 | 职责 |
|---|---|
| [`<pkg>`](<pkg>/README.md) | 一句话说明该包提供的能力 |

<a id="related-documentation"></a>
## Related documentation

- [相关内容的负责方](../../<path>.md) — 概述它补充了什么。

<a id="dev-note"></a>
## Dev Note

None.
```

## 规则

- 每个直接下属包占一行，职责只描述它提供的能力。
- 只有在该信息有助于读者选包时，才增加 `ctx key`、包类型或 npm 包名列。
- 相关文档链接到邻近的负责方，如组索引、子系统页面和 Agent Note。用短语说明各链接的用途。
- 组索引不负责运行时行为，因此无需 Model Experience 或 Known Limitations 章节。
- 修改双语文档后，重跑 `pnpm run verify-translation-pairing --write packages/<group>/README.md`。

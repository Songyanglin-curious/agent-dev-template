# 模板：package-group

`packages/README.md` 和每个 `packages/<group>/README.md` 都使用本模板。该页面是一张地图：为能力族定位，用一行职责列出其直接包，并链接由包自己负责的细节。它绝不复述某个包的约定。

## Frontmatter

```yaml
---
description: "The <group> package group: what the packages under packages/<group>/ own, for readers choosing or navigating the family."
kind: "package-group"
---
```

## 骨架

```markdown
# <group>/ — <one-line subject>

English | [中文](README.zh.md)

## Summary

Three to five sentences and at most 100 `wc -w`-style words: what the family provides, what a reader can DO with it, which package owns which half, and the main boundary. Apply the [Summary voice rules](../SKILL.md#voice-rules).

## Table of Contents

- [Packages](#packages)
- [Related documentation](#related-documentation)
- [Dev Note](#dev-note)

-----

<a id="packages"></a>
## Packages

One short orienting sentence, then the package map:

| Package | Role |
|---|---|
| [`<pkg>`](<pkg>/README.md) | One-line role: what it contributes |

<a id="related-documentation"></a>
## Related documentation

- [Adjacent owner](../../<path>.md) — what it adds to this family.

<a id="dev-note"></a>
## Dev Note

None.
```

## 规则

- 每个直接包一行；职责文字说明该包的贡献，绝不写它的内部细节。
- 只有当 `ctx key`、包形态或 npm 名称的区别能帮助读者在直接包之间做选择时，才增加相应的列。
- `Related documentation` 章节链接相邻归属方（分组映射、子系统页面、Agent Note），每个链接配一个短语。
- 不要添加 Model Experience 或 Known Limitations 章节；分组映射不拥有任何运行时行为。
- 编辑配对后重跑 `pnpm run verify-translation-pairing --write packages/<group>/README.md`。

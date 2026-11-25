# 模板：package-reference

用于入口是 Cordis 插件——service 默认导出或 `apply` 函数——并挂载在某个组合中的包。这是 `packages/<group>/<pkg>/README.md` 的默认模板。`session-persistence-jsonl` 的 README 配对是本模板的实操范例。

## Frontmatter

```yaml
---
description: "What the package lets a reader choose, configure, or debug, in one or two concrete sentences with searchable domain terms."
kind: "package-reference"
---
```

## 骨架

```markdown
# @deepseek-ai/dsh-<name>

English | [中文](README.zh.md)

## Summary

Three to five sentences and at most 100 `wc -w`-style words on what a user or agent can DO with the package: outcomes, when to choose it, main cost, most important boundary. Apply the [Summary voice rules](../SKILL.md#voice-rules); never describe its role, type, or internal identity.

## Table of Contents

- [Use this package](#use-this-package)
- [Understand the implementation](#understand-the-implementation)
- [Further Exploration](#further-exploration)
- [Model Experience](#model-experience)
- [Known Limitations and Deferred Work](#known-limitations-and-deferred-work)
- [Dev Note](#dev-note)

-----

<a id="use-this-package"></a>
## Use this package

One orienting sentence: the common path.

### When to choose it

Choose or avoid the package: one paragraph naming the deciding conditions and the fallback package.

### Minimal configuration

The smallest mount that works, as a `cordis.yml` snippet, plus the config table:

| Field | Default | Meaning |
|---|---|---|
| `<field>` | `<default>` or `required` | One-line meaning |

The generated [configuration catalog](../../../docs/config-catalog.md#deepseek-aidsh-<name>) is the exhaustive source for every accepted field.

-----

<a id="understand-the-implementation"></a>
## Understand the implementation

<details>
<summary>Implementation internals — click to expand</summary>

Design concept, component architecture, and hand-waving dataflow — enough to understand the package. A source-map table links files for exact detail. No API catalogs or JSDoc restatement.

</details>

-----

<a id="further-exploration"></a>
## Further Exploration

Three to seven adjacent pages, closest prerequisite first, one short phrase each.

-----

<a id="model-experience"></a>
## Model Experience

<per the Model Experience contract in docs/cookbook/adding-a-package.md#4-write-the-package-readme; the verify-package-readme-model-experience gate owns the required form>

## Known Limitations and Deferred Work

<a id="known-limitations-and-deferred-work"></a>

One orienting sentence, then top-level bullets naming current package constraints. Packages with none use the allowlist in scripts/verify-package-readme-limitations.ts.

<a id="dev-note"></a>
### Dev Note

<details>
<summary>Working context for maintainers — click to expand</summary>

None.

</details>
```

## 规则

- **写之前先做事实核验。** 在测试组合中挂载该包，并运行本 README 作出的每条命令、配置字段、默认值和行为声明。删掉任何未能复现的内容；链接生成的配置 catalog，而不是复述字段。
- **安装指引。** 插件包通过 `cordis.yml` 的行挂载。只有声明 `dsh.bundle.patch` 的包才通过 `dsh plugin --profile <name> add <package>` 作为 profile 层安装——如果本包没有该声明，就说明它如何在组合中挂载，绝不要写 `dsh plugin add`。
- **Model Experience 和 Known Limitations 由门禁负责。** 与两个门禁强制的确切标题和每包形式保持一致；当行为使某个包在形式之间迁移时，在同一次改动中更新门禁的受审计列表。
- 编辑配对后重跑 `pnpm run verify-translation-pairing --write packages/<group>/<pkg>/README.md`。

# 模板：package-library

用于没有插件表面的包：其入口导出普通模块 API，不向组合注册任何东西。示例：`boot/app-boot`、`util/*`、`sdk/protocol`、`typert/generator`。`boot/app-boot` 的 README 配对是实操范例。

库 README 与包参考有三点不同：不写“安装进 profile”的指引（库是依赖，不是层），不写挂载配置（没有 `cordis.yml` 行），且 Model Experience 章节只采用门禁为该包指定的受审计形式（多数库是 `none` 或 `indirect`）。

## Frontmatter

```yaml
---
description: "What the library lets a caller build, in one or two concrete sentences with the consuming packages or searchable domain terms."
kind: "package-library"
---
```

## 骨架

```markdown
# @deepseek-ai/dsh-<name>

English | [中文](README.zh.md)

## Summary

Three to five sentences and at most 100 `wc -w`-style words: what a caller can DO with the library, who consumes it, the smallest entry point, and the main boundary. Apply the [Summary voice rules](../SKILL.md#voice-rules).

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

### When to use it

Name the consuming call sites (which bins, packages, or runtimes import it) and when a caller should reach for it instead of a plugin.

### Entry point

The smallest import-plus-call that works, in a `text` or `ts` fence, followed by what success and failure look like. Link the owning contracts in `src/index.ts` for exact detail instead of restating them.

-----

<a id="understand-the-implementation"></a>
## Understand the implementation

<details>
<summary>Implementation internals — click to expand</summary>

Design notes and a source-map table. No API catalogs.

</details>

-----

<a id="further-exploration"></a>
## Further Exploration

Adjacent pages, closest prerequisite first.

-----

<a id="model-experience"></a>
## Model Experience

Only the form the verify-package-readme-model-experience gate assigns this package (`none`, `indirect`, or the canonical blocks). A library never invents model effects it does not have.

## Known Limitations and Deferred Work

<a id="known-limitations-and-deferred-work"></a>

Current package constraints as top-level bullets; allowlist the package in scripts/verify-package-readme-limitations.ts when none exist.

<a id="dev-note"></a>
### Dev Note

<details>
<summary>Working context for maintainers — click to expand</summary>

None.

</details>
```

## 规则

- **按入口判定，而不是按文件夹判定。** 选择本模板前先读 `src/index.ts`：`export default` 一个 service 类或导出 `apply` 都会使该包成为 `package-reference`，而 `package.json` 中的 `dsh.bundle.patch` 会使其成为 `package-bundle`。没有这些的普通模块 API 才是库。
- **绝不写 profile 安装指引。** `dsh plugin --profile <name> add <package>` 可以安装任意 npm 依赖，但只为声明 `dsh.bundle` 的包激活 profile 层；对库而言它至多是一个空操作的依赖，绝不能作为安装路径出现。
- 编辑配对后重跑 `pnpm run verify-translation-pairing --write packages/<group>/<pkg>/README.md`。

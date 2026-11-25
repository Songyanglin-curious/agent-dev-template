# 模板：package-library

用于无插件接口的包。此类包的入口只导出普通模块 API，不向组合注册任何内容。示例包括 `boot/app-boot`、`util/*`、`sdk/protocol`、`typert/generator`。`boot/app-boot` 的双语 README 是使用此模板的实例。

库作为依赖使用，没有配置档安装步骤，也不需要在 `cordis.yml` 中配置挂载。Model Experience 只采用校验给该库规定的格式，多数库是 `none` 或 `indirect`。

## 元数据

```yaml
---
description: "用一到两句说明调用者借此库能构建什么，并提到使用该库的包或可检索的领域术语。"
kind: "package-library"
---
```

## 骨架

```markdown
# @deepseek-ai/dsh-<name>

English | [中文](README.zh.md)

## Summary

用三到五句说明调用者借此库能做什么、使用者是谁、最小入口和主要边界。英文用 `wc -w` 的方式计数，最多 100 个词。遵循[摘要表述规则](../SKILL.md#voice-rules)。

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

指出哪些可执行程序、包或运行时导入该库，以及何时应选用该库。

### Entry point

用 `text` 或 `ts` 围栏代码块展示可运行的最小导入和调用，随后说明成功与失败时的表现。具体契约链接到 `src/index.ts` 中负责的定义。

-----

<a id="understand-the-implementation"></a>
## Understand the implementation

<details>
<summary>实现细节（点击展开）</summary>

说明设计思路，并用源码索引表链接到相关文件。省略 API 全量目录。

</details>

-----

<a id="further-exploration"></a>
## Further Exploration

列出相关页面，最贴近的前置知识优先。

-----

<a id="model-experience"></a>
## Model Experience

只使用 verify-package-readme-model-experience 给这个包规定的格式（`none`、`indirect` 或规定的内容块）。按库实际产生的模型侧效果编写。

## Known Limitations and Deferred Work

<a id="known-limitations-and-deferred-work"></a>

以顶层列表写明当前包的约束。没有限制时，把包加入 scripts/verify-package-readme-limitations.ts 的允许名单。

<a id="dev-note"></a>
### Dev Note

<details>
<summary>维护者的工作背景（点击展开）</summary>

None.

</details>
```

## 规则

- **根据入口判断类型。** 选择模板前读取 `src/index.ts`。用 `export default` 导出服务类或导出 `apply` 时用 `package-reference`。`package.json` 声明 `dsh.bundle.patch` 时用 `package-bundle`。只提供普通模块 API 的包是库。
- **库只作为依赖使用。** `dsh plugin --profile <name> add <package>` 可以安装任意 npm 依赖，但只有声明 `dsh.bundle` 的包才会激活一个配置档层。对库而言，该命令最多只是添加依赖，不得列为安装路径。
- 修改双语文档后，重跑 `pnpm run verify-translation-pairing --write packages/<group>/<pkg>/README.md`。

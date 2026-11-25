# 模板：package-bundle

用于清单声明 `dsh.bundle.patch` 的包。这类包是可安装的配置档层，例如 `packages/bundle/*`、`dsh-subagent-codex`、`dsh-subagent-claude-code`。`bundle/base` 的双语 README 是使用此模板的实例。

捆绑包 README 优先说明如何安装到配置档以及这一层的语义，再在折叠的实现章节解释补丁文档。使用者通过配置档层获取能力，无需导入库或单独挂载插件。

## 元数据

```yaml
---
description: "说明捆绑包层为 dsh --profile 增添哪些能力，帮助用户组装或定制配置档。"
kind: "package-bundle"
---
```

## 骨架

````markdown
# @deepseek-ai/dsh-<name>

English | [中文](README.zh.md)

## Summary

用三到五句说明该层为配置档增加什么、哪些配置档已包含它、用户如何添加或移除，以及主要限制。英文用 `wc -w` 的方式计数，最多 100 个词。遵循[摘要表述规则](../SKILL.md#voice-rules)。

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

### Install into a profile

动笔前在当前检出版本实际运行下列命令，验证安装路径：

```text
dsh plugin --profile <name> add @deepseek-ai/dsh-<name>
dsh plugin --profile <name> remove @deepseek-ai/dsh-<name>
```

说明内置捆绑包从哪里解析、配置档协调步骤会激活什么，以及缺少补丁声明时会发生什么错误。

### What you get

说明该层带来的可观察能力，如工具、提供方或 UI 条目，并指明每项行为由哪个包负责。

-----

<a id="understand-the-implementation"></a>
## Understand the implementation

<details>
<summary>实现细节（点击展开）</summary>

解释补丁文档中的插入清单、条目 ID、平台条件和覆盖语义。源码索引表链接 `cordis.patch.yml` 和 `src/`。省略 API 全量目录。

</details>

-----

<a id="further-exploration"></a>
## Further Exploration

链接到相关的组索引、配置档契约和组合关系图。

-----

<a id="model-experience"></a>
## Model Experience

使用 verify-package-readme-model-experience 指定的格式。承载其他包的捆绑包使用 `indirect` 或 `none`，插入条目的模型侧行为由各条目对应的包负责。

## Known Limitations and Deferred Work

<a id="known-limitations-and-deferred-work"></a>

说明用户必须遵守的当前约束，包括覆盖语义、平台条件和冲突规则。

<a id="dev-note"></a>
### Dev Note

<details>
<summary>维护者的工作背景（点击展开）</summary>

None.

</details>
````

## 规则

- **模板只适用于声明 `dsh.bundle.patch` 的包。** 分类前在 `package.json` 核验声明。`dsh plugin` 的协调步骤只为这类包激活一层。
- **验证安装路径。** 在临时配置档运行 `dsh plugin --profile <name> add <this-package>`。动笔前重现文档所述的警告、层激活和失败情况。
- 修改双语文档后，重跑 `pnpm run verify-translation-pairing --write packages/<group>/<pkg>/README.md`。

# 模板：package-reference

用于入口为 Cordis 插件的包。入口可默认导出服务，也可导出 `apply` 函数，通过组合配置挂载。这是 `packages/<group>/<pkg>/README.md` 的默认模板。`session-persistence-jsonl` 的双语 README 是使用此模板的实例。

## 元数据

```yaml
---
description: "用一到两句具体说明读者如何选择、配置或排查这个包，并使用可检索的领域术语。"
kind: "package-reference"
---
```

## 骨架

```markdown
# @deepseek-ai/dsh-<name>

English | [中文](README.zh.md)

## Summary

用三到五句说明用户或 Agent 借此能做什么，包括结果、适用情形、主要代价和最重要的边界。英文用 `wc -w` 的方式计数，最多 100 个词。遵循[摘要表述规则](../SKILL.md#voice-rules)，省略内部角色、类型和身份。

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

用一句话交代最常见的使用路径。

### When to choose it

用一段说明哪些条件决定采用或避开这个包，以及可用哪个包替代。

### Minimal configuration

给出能运行的最小 `cordis.yml` 挂载片段，以及配置表：

| 字段 | 默认值 | 含义 |
|---|---|---|
| `<field>` | `<default>` 或 `required` | 一句话说明含义 |

生成的[配置目录](../../../docs/config-catalog.md#deepseek-aidsh-<name>)是所有受支持字段的完整来源。

-----

<a id="understand-the-implementation"></a>
## Understand the implementation

<details>
<summary>实现细节（点击展开）</summary>

说明设计思路、组件架构和数据流概况，帮助读者理解包如何工作。用源码索引表链接到负责具体细节的文件。省略 API 全量目录和 JSDoc 复述。

</details>

-----

<a id="further-exploration"></a>
## Further Exploration

列出三到七个相关页面，最贴近的前置知识放在前面，每项附简短说明。

-----

<a id="model-experience"></a>
## Model Experience

<按照 docs/cookbook/adding-a-package.md#4-write-the-package-readme 的 Model Experience 契约编写，具体形式由 verify-package-readme-model-experience 校验规定>

## Known Limitations and Deferred Work

<a id="known-limitations-and-deferred-work"></a>

先用一句话交代主题，再用顶层列表列出包当前的限制。没有限制的包使用 scripts/verify-package-readme-limitations.ts 中的允许名单。

<a id="dev-note"></a>
### Dev Note

<details>
<summary>维护者的工作背景（点击展开）</summary>

None.

</details>
```

## 规则

- **动笔前核验事实。** 在测试组合中挂载该包，实际执行每条命令并验证每个配置字段、默认值和行为声明。删去无法复现的内容。字段清单链接到生成的配置目录。
- **安装说明。** 插件包通过 `cordis.yml` 条目挂载。只有声明 `dsh.bundle.patch` 的包才可用 `dsh plugin --profile <name> add <package>` 安装为配置档层。若包没有该声明，只说明如何在组合中挂载。
- **Model Experience 和 Known Limitations 由校验定义。** 使用两项校验规定的确切标题和该包对应的格式。行为变更导致包改用另一种格式时，在同一变更中更新校验的审计清单。
- 修改双语文档后，重跑 `pnpm run verify-translation-pairing --write packages/<group>/<pkg>/README.md`。

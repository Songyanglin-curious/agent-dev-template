# 评审标准

## Summary

评审文档要看读者能否完成某个结果，而不是看模板标题是否齐全。对照代码和测试核验文字，保留精确的约定，让包 README 对消费方有用，同时为维护者暴露足够的实现细节。运行当前的仓库门禁；`session-persistence-jsonl` 的 README 配对是本格式的参考范例。

## Table of Contents

- [新人测试](#新人测试)
- [证据评审](#证据评审)
- [包 README 评审](#包-readme-评审)
- [参考范例](#参考范例)
- [验证](#验证)
- [Dev Note](#dev-note)

## 新人测试

一个没有仓库背景的专业工程师，在读完三到五个互链页面后应能回答：产品或其功能做什么、如何安全地运行或使用、它的状态存放在哪里、哪个组件负责它、它如何失败、以及在哪里修改它。如果读者仅仅为了发现公开流程就必须查看源码，就补回缺失的解释。如果读者必须吸收无关的内部细节，就把这些细节移得更深。

## 证据评审

对照最强的归属方检查每一项实质性陈述。名称和入口点用包元数据，API 约定用公开类型和 JSDoc，行为用运行时代码，已演练的失败路径用测试，穷举清单用生成目录，理由用活跃的 Agent Note。绝不要把旧的 README、讨论或报告看得比当前代码和测试更权威。

对每一项操作性声明——CLI 命令、配置片段、默认值、错误消息、平台差异——证据是执行它，而不是阅读它。在页面陈述其行为之前，针对当前 checkout 执行确切的命令或挂载确切的配置；只引用观察到的输出、警告和失败。依赖不可用密钥或网络的声明，要写出核验归属方，而不是断言行为。对既有页面，与最新的 `origin/master` 比较，并对照代码重新核验过时的说法。

评审安装指引前先判定包类别：`package.json` 中的 `dsh.bundle.patch` 使其成为 bundle（可通过 `dsh plugin --profile <name> add <package>` 安装，也是该命令唯一会作为层激活的形态）；`apply` 导出或默认 service 导出使其成为插件（以 `cordis.yml` 的一行挂载）；普通模块 API 使其成为库（一项没有安装路径的依赖）。拒绝为其他形态编写的安装指引。

只有当陈述能帮助目标读者行动、推理或避免误用时才保留它。把理由、历史、测试走查、重复目录和无关的包细节移到它们的归属方。

## 包 README 评审

要求以下内容，但不强制统一的内部标题集合：

- 可搜索的 YAML 元数据，包含精确的 `description` 和机械推导出的 `kind`（`package-group`、`package-reference`、`package-library` 或 `package-bundle`）；
- 三到五句、最多 100 个 `wc -w` 风格单词的英文 Summary，说明该对象为其用户或 agent 读者做什么（DOES），并带有链接的 Table of Contents；
- 受控英语：明确的执行者、稳定的术语、直接的动词、分离的指令与条件，以及不变的情态；
- 何时选择或避免该包；
- 存在时给出最小的安全配置或使用路径——对 bundle 是经过验证的 `dsh plugin` 安装路径；对库是消费方入口点；绝不为不接受 profile 安装的形态写这类指引；
- 与消费方相关的可观察行为、失败、持久性、安全性和性能限制；
- 概念层面的面向开发者的归属与数据/生命周期设计——整体设计、架构、粗线条数据流——这些无法从公开类型低成本恢复，并附代码链接以提供精确细节；
- 包策略要求的规范 Model Experience 和 Known Limitations 章节；
- 相邻文档确实有实质帮助时，提供面向新人的 Further Exploration；
- 最后的非权威 Dev Note，作为半成品想法、草稿和未定方向的唯一存放处。

不要复述 JSDoc 或生成目录。链接归属方，只解释本地需要的决策或关系。包 Summary 描述读者可见的能力，而不是 Cordis 角色、注册项或内部组件；除非读者会直接在配置、命令或公共 API 中使用，否则省略源码标识符。拒绝任何叙述内部细节（函数主语、事件流、数据流）的面向用户章节，也拒绝任何只枚举 API 而不解释概念的折叠区。

## 参考范例

`session-persistence-jsonl` 的 README 配对（[英文](../../../../packages/session/session-persistence-jsonl/README.md)、[中文](../../../../packages/session/session-persistence-jsonl/README.zh.md)）在生产中演示了该格式：`kind` 选择本 package-reference 标准的可搜索 YAML、四句话的 Summary、带链接的 Table of Contents、覆盖选择、配置、布局、持久性和读取的面向用户的使用章节、面向开发者设计与存储细节的 GitHub 原生 `<details>` 折叠、Further Exploration、规范的 Model Experience 与 Known Limitations 章节，以及最后的 Dev Note。把它的结构、证据标准和双语对齐作为包 README 和跨包页面的范本；让每项声明都落到其归属源码和证据上。

## 验证

迭代时运行最小的针对性检查，然后运行常驻的文档检查：

```sh
pnpm run test:docs
pnpm run verify-translation-pairing --write <pair>
pnpm run doc-sync
pnpm run lint
git diff --check
```

对 skill 改动还要运行仓库的 skill 调用元数据检查，并对行对齐的配对比较英文/中文物理行数。最后把 diff 重读一遍，检查事实完整性；再读一遍，检查简洁性、导航和归属。

## Dev Note

None.

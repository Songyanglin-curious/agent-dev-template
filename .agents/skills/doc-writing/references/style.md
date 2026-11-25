# 页面风格

## Summary

页面级风格偏好在以下几方面让 DSH 页面便于扫读、不易误读：简短的 Summary、受控技术英语、主要部分之间的 `-----` 分隔线、保持章节标题可见的 `<details>` 折叠，以及有节制的强调。模板是 `session-persistence-jsonl` 的 README 配对。

## Table of Contents

- [简短的 Summary](#简短的-summary)
- [受控技术英语](#受控技术英语)
- [章节分隔线](#章节分隔线)
- [可折叠的内容章节](#可折叠的内容章节)
- [强调的使用](#强调的使用)
- [Dev Note](#dev-note)

## 简短的 Summary

每个由人编写的页面都以简短的 `Summary` 开头：一段三到五句话的文字，说明读者能做什么或观察到什么、读者为什么关心、运行模型以及最重要的边界。目录和各章节承载细节；位置和章节顺序见 [structure-hierarchy.md](structure-hierarchy.md)。英文包 README 的 Summary 还被 `verify-package-readme-summaries` 额外限制在 100 个 `wc -w` 风格单词内。

## 受控技术英语

对 agent、译者或非母语读者必须解析的英文文字，使用一轮受 [ASD-STE100](https://www.asd-ste100.org/) 启发的评审。这是一种清晰性纪律，不是经过认证的 ASD-STE100 合规。仓库不复制也不校验该标准的受控词典。

- 写明执行者和动作。执行者重要时优先使用主动语态。
- 每个概念只用一个固定术语。不要为了变化而轮换同义词。
- 优先使用直接动词。存在精确动词时，替换名词化表达和含混的短语动词。
- 每个句子只放一条指令。三个或更多步骤或条件时使用列表。
- 拆分分号和长从句链。每个段落只讲一个主题。
- 删除没有依据的质量形容词和层层叠加的模糊限定。保留来源中的每项事实和每一程度的确定性。

把一条指令 20 词、一段描述 25 词当作评审提示，而不是机械门禁。拆分会让条件或关系变得隐蔽时，保留更长的句子。绝不要为了满足长度目标而删除或加强 `must`、`may`、`never`、时序、例外、数字或其他约定用语。完整命题规则由[文字标准](../../prose-standard/SKILL.md)负责。

## 章节分隔线

用单独一行的 `-----` 水平分隔线隔开页面的主要部分，并在前后各留一个空行。紧跟在段落之后的水平线会被解析成 Setext 标题，而放在包 README 最后两个 H2 章节内部会破坏 Model Experience 门禁。模板分隔的是：front matter → 使用章节 → 折叠的开发者章节 → Further Exploration → Model Experience。

## 可折叠的内容章节

把面向开发者的细节和最后的 Dev Note 折叠进 GitHub 原生的 `<details>`/`<summary>` 块。保持章节标题（H2 或 H3）及其 `<a id>` 锚点可见；只折叠标题下的内容。块内部在 `<summary>` 之后留一个空行，所有 Markdown 行都保持在第 0 列（缩进的内容会变成代码块），并在空行之后以 `</details>` 结束。折叠区内的标题、列表、表格和链接会正常解析，并保留各自的锚点。`session-persistence-jsonl` 的 README 配对同时演示了两处折叠：实现章节和 Dev Note。

在包 README 中，`## Model Experience` 和 `## Known Limitations and Deferred Work` 保持为最后两个 H2 标题。把限制章节的锚点紧跟在它的 H2 之后，以免它成为前一个 Model Experience 正文的一部分。把最后的 Dev Note 作为带锚点的 H3 放在限制章节下。被明确豁免限制章节的包可以使用 H2 的 Dev Note。

## 强调的使用

粗体只留给改变行为的从句或真正重要的对比。在基准测试表格中，按参考范例那样把列标题和每行的最佳值加粗。

## Dev Note

None.

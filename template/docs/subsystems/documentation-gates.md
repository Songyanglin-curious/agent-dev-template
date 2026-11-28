# 文档门禁

门禁拒绝可以机械判定的结构错误，例如失效链接、缺失的子系统关联、位置与状态矛盾的记录。内容是否真实、模块划分是否合理、旧数据能否读取，不由门禁判断。安装与调用方式见[工具模块](../../scripts/README.md)，文档义务见[文档标准](../AGENTS.md)。

## 执行入口

在项目根目录按[命令清单](../../package.json)运行 `pnpm run` 命令。模板未配置 CI 或 Git hooks；以下入口都需要人或 Agent 按变更范围调用。项目根是独立 Git 工作树且有可解析的基线提交时，检查结果才完整；尚未初始化 Git 时，`verify-change-docs`、`verify-repository-references` 和空的归档校验会明确报告跳过，其余检查仍按本地文件执行。检查从不借用父目录仓库的历史。

| 要核对什么 | 本地入口 |
|---|---|
| 文档、引用、预算与文档影响 | `pnpm run test:docs`；失败时单独运行下表对应的检查 |
| 任务状态、位置、必需章节与引用 | `pnpm run verify-tasks`，规则见[研发任务](../../研发任务/README.md) |
| Note 分类、格式与归档封印 | `pnpm run test:notes`；分别由 `verify-agent-note-classification`、`verify-agent-note-format`、`verify-archived-agent-notes` 检查，规则见 [Agent Note](../../.agents/notes/README.md) |
| 改动路径 | `pnpm run change-scope --base <ref>`，将 `<ref>` 替换为项目中可解析的基线 |
| 门禁或范围工具本身的回归 | `pnpm run test:gates` 或 `pnpm run test:tools`；不是接入项目的业务测试 |

检查默认不写文件。归档时显式使用 `verify-archived-agent-notes --write` 才会写入新封印；已有封印不得改写。出现违规时按非零退出和具体诊断修正。零条记录、零条规则或跳过某项检查，不代表已验证该类内容。

## 文档检查范围

常规 Markdown 范围包含根 README 和 AGENTS、`docs/`、Notes、Skills 及代码旁的 README。原始研发输入、依赖目录及冻结的 Note 正文不是待修订的文档；任务和归档分别由其专用门禁检查。各检查进一步按路径、`kind` 或清单选择对象。

| 检查 | 对象与判据 |
|---|---|
| `verify-doc-metadata` | 有 `kind` 的 README：类型及其模板、description、标题和禁止字段；普通索引不要求声明 `kind` |
| `verify-module-readmes` | 模块与模块组的摘要；模块限制章节或有效豁免，模块组不得含限制章节 |
| `verify-module-groups` | 模块组职责表的链接须指向真实模块或模块组；排除模块专属章节 |
| `verify-subsystem-pages` | 模块组、未列入组的模块，须链接所属子系统或登记带理由的豁免；关联存在不等于语义同步 |
| `verify-doc-refs` | 在已配置源码范围检查指向文档和 Note 的仓库相对路径；不是对所有语言和所有字符串的解析器 |
| `verify-persistence-records` | [持久化记录](../persistence-changes/README.md)的位置、元数据、章节、机器声明、digest 语法、前驱引用和历史格式的伴生 schema；不比较真实数据 |
| `verify-generated-docs` | 生成区域的开始与结束标记配对、不嵌套，清单有生产者；不验证内容新鲜度 |
| `verify-md-wrap` / `verify-md-links` | 段落一个物理行；相对链接及 Markdown 锚点可解析，不检查外部网站可达性 |
| `verify-repository-references` | 跟踪及未忽略的新维护文件不引用能解析为本地 commit 的标识；原始输入、第三方来源和冻结归档除外 |
| `verify-doc-budgets` | 登记文件存在且用量不超过上限；`--list` 查看用量 |
| `verify-change-docs` | 以变更路径识别可能需要同步的归属文档，不分析正文 |

## 清单与接入配置

- [变更影响规则](../../scripts/change-doc-rules.json)：模板不带路径映射，接入项目按真实所有者配置。`when` 匹配改动，`owners` 指向已有文档。`remind` 只提示；`require` 在普通模式下也不阻断，只有 `--strict` 且命中规则、缺少归属文档改动时才失败。`--strict` 不会升级 `remind`；`pnpm run verify-change-docs --list-rules` 可查看实际规则，无须比较 Git 历史。
- [预算清单](../../scripts/doc-budgets.manifest.json)：登记常驻文档，而不是给所有参考资料统一限字。调整方式见[字数预算](../AGENTS.md#wordcount-budgets)。
- [生成区域清单](../../scripts/generated-docs.manifest.json)：有生成区域时登记文档与生产者。是否及时重新生成由生产者的验证负责。
- [限制章节豁免](../../scripts/module-readme-limitations.allowlist.json)、[子系统关联豁免](../../scripts/subsystem-page-exemptions.json)：无适用契约时按需登记真实路径与理由；不为通过检查而建空页。
- [归档封印](../../.agents/notes/archived/manifest.json)：只追加新记录，与可信 Git 基线比较，不作通用豁免清单。

## 修改门禁

按[新增文档门禁](../cookbook/add-a-doc-gate.md)协调命令、扫描范围、诊断与失败用例。模块检查依据 README 的 `kind` 发现文档；即使门禁通过，也要核对计数是否因漏标、目录或排除条件改变而意外下降。

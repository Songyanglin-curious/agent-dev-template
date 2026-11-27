# 元数据与链接

## 摘要

文档元数据是检索和模板选择的接口，不是缩微版报告或广告。`kind` 字段恰好选择一个存在于本 skill 中、并映射到文档标准的模板；frontmatter 不携带已由文件名约定或已执行门禁负责的字段。链接语法必须在 GitHub 和常见 Markdown 渲染器中都能正确解析，因此仓库内链接保持相对 URL，跨页面锚点使用标题生成的 id。

## 目录

- [文档元数据](#文档元数据)
- [kind 体系](#kind-体系)
- [description 质量](#description-质量)
- [仓库链接与路径提及](#仓库链接与路径提及)
- [章节锚点](#章节锚点)
- [开发备注](#开发备注)

## 文档元数据

每个映射到本 skill 模板的文档都以 YAML frontmatter 开头：模块文档、持久化变更记录、发布记录和格式参考。允许自定义字段，但通用字段要保持足够稳定，以支持搜索和索引。

```yaml
---
description: "负责把请求写入持久日志的存储模块，供部署与维护者在选型、配置和排查时查阅。"
kind: "module"
---
```

映射到模板的文档必须包含 `description` 和 `kind`。页面标题、文件名和模块 manifest（如有）已经负责名称，文档职责及其读者路径已经表达受众；在 frontmatter 里重复其中任何一项都不会增加检索价值。在仓库自有的分类法和搜索消费方证明 `tags` 的价值超过 description 与全文搜索之前，不要添加 `tags`。键名保持小写并带连字符，除非已有归属方定义了别的拼写；不要把易变的代码清单复制进 frontmatter。

## kind 体系

`kind` 直接选择文档模板；每个 kind 恰好映射到一个存在于本 skill 中的模板，没有 kind 就不会有模板。文档类型由实际职责和内容确定，位置只用于确认归属；不要仅凭目录名称或深度推导。

| `kind` | 仓库位置 | 模板 | 标准 |
|---|---|---|---|
| `module` | 模块所属位置附近的模块说明（通常为 `<module>/README.md`；具体位置由项目模块组织决定） | [module.md](../templates/module.md) | 模块约定：能力说明、使用方式、行为契约、职责边界、概念层面的内部设计与源码导航、已知限制。 |
| `module-group` | 模块组目录内的组说明（具体位置由项目的模块组织决定） | [module-group.md](../templates/module-group.md) | 模块组约定：组定位、直接下属模块的职责、组合关系与导航；不重复模块自己负责的使用方式、契约和限制。 |
| `persistence-change` | `docs/persistence-changes/YYYY-MM-DD-slug.md` | [persistence-change.md](../templates/persistence-change.md) | 历史确认：机械检测到的持久化数据结构变更、各 root 的前驱引用、兼容性决策和生成的 after schema。 |
| `persistence-release` | `docs/persistence-changes/releases/<release-tag>.md` | [persistence-release.md](../templates/persistence-release.md) | 回溯观察：固定的发布标签、相邻的 before/after digest、实际格式版本常量和变更的 after schema；不做兼容性确认。 |
| `persistence-format` | `docs/persistence-changes/historical-formats/vN.md` | [persistence-format.md](../templates/persistence-format.md) | 选定的历史格式：源码证据、完整的 root schema 和可达类型；当前写入器使用生成的 catalog。 |

`module` 覆盖一切随模块维护的模块说明。模块是具有独立职责和维护价值的软件单元；代码目录、入口和部署形态不是固定条件，具体形态由模块文档说明。它是常驻服务、进程内库、插件、命令行工具还是一次性脚本，写在使用方式和行为契约里，不改变文档类型。模块形态在动笔前应从 manifest、入口文件和配置声明读出，但不能根据目录名猜测，也不能用目录或入口条件否定一个模块。

`module` 与 `module-group` 都随模块代码维护，区别在职责而不是目录深度：README 描述一个模块的能力、使用方式和契约 → `module`；README 描述一组模块的整体能力、分工、组合关系与导航 → `module-group`。模块组的目录位置由项目的模块组织决定，不绑定 `packages/`、`src/` 等固定目录；没有模块分组的项目不需要 `module-group`。

文件夹 README 是索引，不是记录。模块类 kind 由 README 的职责与内容确定，持久化 kind 由路径约定确定。`verify-doc-metadata` 校验 frontmatter、description 和 kind 到模板的映射，并拒绝 `name`、`audience` 和未被治理的 `tags`；`verify-persistence-records` 按位置校验持久化记录的 kind。`verify-module-groups` 校验模块表只链接真实存在且 kind 为 `module` 或 `module-group` 的文档，并拒绝组文档出现使用方式、行为契约和限制章节。

只有同时具备独立模板文件、已记录的仓库位置或已声明的归属方，以及能把文档映射到该 kind 的针对性检查时，才新增 kind。新增 kind 时同步更新本表、[SKILL.md](../SKILL.md#文档类型与模板)的导航列表和对应检查。

## description 质量

agent 会搜索 frontmatter 的 `description` 值，在加载完整文档之前先筛选页面。每个值都要像 skill 描述那样写：说明页面涵盖什么，以及读者应在何时打开它。用一到两个具体句子，包含可搜索的领域术语，并把该页面与邻近的归属方区分开。不要逐节复述、宣称优越、重复标题、含糊宣传、保留变更历史，也不要写成技术状态报告。

好：`负责把请求写入持久日志的存储模块，供部署与维护者在选型、配置和排查时查阅。`

弱：`最先进、最强大的存储实现，带有大量优化。`

## 仓库链接与路径提及

链接目标保持可被机器检查，路径提及保持相对于上下文。当前页面的目录使用仅含 fragment 的链接，外部资源使用完整 URL。

期望的内部链接模型是从仓库根目录命名目标，但以 `/docs/...` 开头的 Markdown URL 会被大多数渲染器当作站点根路径解析到仓库之外，链接检查也会跳过它。在仓库自有的解析器支持所有渲染器中的根路径之前，Markdown 链接中要使用当前渲染器可识别的相对 URL，而 `docs/`、`src/` 这类逻辑路径提及则相对于讨论上下文书写。绝不要仅仅为了看起来像绝对路径就采用未经检查的斜杠开头链接。

指向尚不存在的文件、Skill、脚本或校验命令的引用用行内代码书写，以免产生失效链接，并在[验证](review.md#验证)的依赖表中登记现状；建立后再改成链接。

## 章节锚点

跨页面 fragment 以标题生成的 id 为规范 id。改写标题文字会改变该 id，因此同一次变更中要修复所有入站 fragment 链接。

标题重复、生成的 id 与读者预期不符，或某个章节需要稳定 id 以承受标题改写时，紧邻标题之前放一个显式的 `<a id="..."></a>` 锚点，并让目录链接到该锚点。生成区域内的别名由所属生成器负责，不要手工添加。

## 开发备注

None.

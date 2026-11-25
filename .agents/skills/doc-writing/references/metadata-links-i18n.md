# 元数据、链接与双语配对

## Summary

README 元数据是检索和模板选择的接口，不是缩微版报告或广告。`kind` 字段恰好选择一个存在于本 skill 中、并映射到文档标准的 README 模板；frontmatter 不携带任何已由文件名约定或已执行门禁负责的字段。双语页面保持同等权威、一一对应的结构和精确的物理行对齐。`*.i18n.yaml` sidecar 记录最后一次确认的配对，并支持自动合并。链接语法必须在 GitHub 和文档网站上都能正确渲染，因此仓库链接保持渲染器可识别的相对 URL。

## Table of Contents

- [README 元数据](#readme-元数据)
- [kind 体系](#kind-体系)
- [description 质量](#description-质量)
- [仓库链接与路径提及](#仓库链接与路径提及)
- [双语行对齐](#双语行对齐)
- [双语一致性记录](#双语一致性记录)
- [Dev Note](#dev-note)

## README 元数据

每个由人编写的 README 都以 YAML frontmatter 开头。允许自定义字段，但通用字段要保持足够稳定，以支持搜索和索引。

```yaml
---
description: "Example capability for users and maintainers choosing, configuring, or debugging the package."
kind: "package-reference"
---
```

包 README 配对必须包含 `description` 和 `kind`。页面标题和包 manifest 已经负责名称，文档职责及其读者路径已经表达受众；在 frontmatter 里重复其中任何一项都不会增加检索价值。对侧路径由同目录文件名（`README.zh.md`）得出，配对状态由 sidecar 负责，因此 README 局部的 `i18n` 元数据是多余的。在仓库自有的分类法和搜索消费方证明 `tags` 的价值超过 description 与全文搜索之前，不要添加 `tags`。键名保持小写并带连字符，除非已有归属方定义了别的拼写；不要把易变的代码清单复制进 frontmatter。

## kind 体系

`kind` 直接选择文档模板；每个 kind 恰好映射到一个存在于本 skill 中的模板，没有 kind 就不会有模板。命名为 `docs/persistence-changes/YYYY-MM-DD-slug.md` 的文件使用 `persistence-change`；命名为 `docs/persistence-changes/releases/dsh-v*.md` 的文件使用 `persistence-release`。命名为 `docs/persistence-changes/historical-formats/vN.md` 的文件使用 `persistence-format`。它们的中文姊妹篇使用相同的 kind。命名为 `docs/upgrade-guide/v<version>/<item>/guide.md` 的文件及其 `guide.zh.md` 姊妹篇使用 `upgrade-guide`。文件夹 README 是索引，不是记录。按以下顺序机械推导包 README 的 kind：

1. README 是 `packages/README.md` 或 `packages/<group>/README.md` → `package-group`。
2. 包 manifest 声明了 `dsh.bundle.patch` → `package-bundle`。
3. 包在 `scripts/doc-standard.spec.ts` 的受审计库注册表中 → `package-library`。
4. 其余情况——service 默认导出或 `apply` 插件——都是 `package-reference`。

| `kind` | 仓库位置 | 模板 | 标准 |
|---|---|---|---|
| `package-group` | `packages/README.md`、`packages/<group>/README.md` | [package-group.md](../templates/package-group.md) | 分组映射：为能力族定位，映射其直接包，说明组合关系，链接由包自己负责的细节。 |
| `package-reference` | 带插件入口的 `packages/<group>/<package>/README.md` | [package-reference.md](../templates/package-reference.md) | 包约定：遵循[包 README 评审标准](review.md#包-readme-评审)和规范的[包文档要求](../../../../docs/cookbook/adding-a-package.md#4-write-the-package-readme)。 |
| `package-library` | 带普通模块入口的 `packages/<group>/<package>/README.md` | [package-library.md](../templates/package-library.md) | 库约定：消费方入口与边界；没有 profile 安装路径，也没有挂载配置。 |
| `package-bundle` | 声明 `dsh.bundle.patch` 的 `packages/<group>/<package>/README.md` | [package-bundle.md](../templates/package-bundle.md) | 可安装层：经过验证的 `dsh plugin` 安装路径、层语义和 patch 文档。 |
| `persistence-change` | `docs/persistence-changes/YYYY-MM-DD-slug.md` 及其中文姊妹篇 | [persistence-change.md](../templates/persistence-change.md) | 历史确认：机械检测到的类型变更、各 root 的前驱引用、兼容性决策和生成的 after schema。 |
| `persistence-release` | `docs/persistence-changes/releases/dsh-v*.md` 及其中文姊妹篇 | [persistence-release.md](../templates/persistence-release.md) | 回溯观察：固定的 tag、相邻的 before/after digest、实际版本常量和变更的 after schema；不做兼容性确认。 |
| `persistence-format` | `docs/persistence-changes/historical-formats/vN.md` 及其中文姊妹篇 | [persistence-format.md](../templates/persistence-format.md) | 选定的历史格式：源码证据、完整的 root schema 和可达类型；当前写入器使用生成的 catalog。 |
| `upgrade-guide` | `docs/upgrade-guide/v<version>/<item>/guide.md` 及其中文姊妹篇 | [upgrade-guide.md](../templates/upgrade-guide.md) | 升级路径：从该目录对应的发布到下一个发布之间的单个外部可感知破坏，`Change` 与 `Migration` 章节合计不超过 500 个英文单词。 |

在指定 `package-library` 或 `package-bundle` 之前先检查事实：读 `package.json` 看 `dsh.bundle.patch`，读 `src/index.ts` 看入口形态（导出 `apply` 或默认导出 service 的是插件；普通模块 API 是库）。`dsh plugin --profile <name> add <package>` 可以安装任意 npm 依赖，但 profile reconcile 只会为声明 `dsh.bundle` 的包激活层；绝不要把这个命令说成库或普通插件的安装路径。文档检查会根据同样的这些事实推导出应使用的 kind，拒绝其他取值，并拒绝 `name`、`audience`、`tags` 和 README 局部的 `i18n` 元数据。只有具备独立模板、明确的仓库位置或已声明归属方，以及能把文档映射到该 kind 的针对性检查时，才新增 kind。

## description 质量

agent 会搜索 frontmatter 的 `description` 值，在加载完整文档之前先筛选页面。每个值都要像 skill 描述那样写：说明页面涵盖什么，以及读者应在何时打开它。用一到两个具体句子，包含可搜索的领域术语，并把该页面与邻近的归属方区分开。不要逐节复述、宣称优越、重复标题、含糊宣传、保留变更历史，也不要写成技术状态报告。

好：`The shipped JSONL session-persistence backend for deployments and maintainers choosing, configuring, or debugging per-session durable logs with optional Zstandard compression.`

弱：`The best and most advanced session storage implementation with lots of optimizations.`

## 仓库链接与路径提及

链接目标保持可被机器检查，路径提及保持相对于上下文。当前页面的菜单使用仅含 fragment 的链接。外部资源使用完整 URL。

期望的内部链接模型是从仓库根目录命名目标，但以 `/docs/...` 开头的 Markdown URL 在 GitHub 上会解析到仓库之外，网站投影器也不会处理它，`verify-md-links` 还会跳过它。在仓库自有的解析器支持所有渲染器中的根路径之前，Markdown 链接中要使用当前渲染器可识别的相对 URL，而 `docs/` 或 `packages/session/` 这类逻辑路径提及则相对于讨论上下文书写。绝不要仅仅为了看起来像绝对路径就采用未经检查的斜杠开头链接。

## 双语行对齐

英文和简体中文保持同等权威。frontmatter 键顺序、标题、空行、段落、列表项、表格、代码围栏、链接目标和物理总行数都要一一对应。英文侧把所有相对链接指向 `.md` 目标；中文侧在存在对侧文件时指向 `.zh.md` 姊妹篇，否则回退到 `.md` 目标——配对门禁会把 `.md` 和 `.zh.md` 目标视为同一文档。在对应行内自然翻译，不要对任一语言硬换行。代码块保持逐字节一致，并在不改变行结构的前提下调整首次出现的术语注释位置。

行数相等是结构性检查，不能证明含义忠实。完整性、术语、自然语言以及每行是否表达同一命题，仍然由评审负责。

## 双语一致性记录

每个双语配对都要保留 `*.i18n.yaml` sidecar。它按标题章节记录一对哈希，排除代码围栏和生成区域，因此对不同章节的编辑可以用 Git 默认的文本合并方式合并；生成数据属于生成区域，由生成器写入两侧页面；`verify-translation-pairing` 会把这些条目与当前内容比较并校验结构。任一语言改动后，都用 `pnpm run verify-translation-pairing --write <pair>` 重新记录。不要把内容哈希复制进 README frontmatter：相互独立的编辑会改动同一行头部，把本可合并的文字变成归属文件冲突。

## Dev Note

None.

# 网站发布

## Summary

文档网站是仓库 Markdown 经过测试的投影，绝不是第二份副本。[website/docs.ts](../../../../website/docs.ts) 是显式的公开允许列表，[scripts/project-doc-site.ts](../../../../scripts/project-doc-site.ts) 把映射的源文件改写进一次性的 `website/.generated/` 树，VitePress 构建这棵树。构建还会基于同一份 manifest，为每条路由产出一个原始 Markdown 孪生副本，并生成根级 `llms.txt` 索引。本参考负责 manifest 字段、投影器的链接规则、预览与校验命令，以及部署边界。

## Table of Contents

- [manifest 归属](#manifest-归属)
- [判定改动类型](#判定改动类型)
- [DocsPage 字段](#docspage-字段)
- [保持链接行为](#保持链接行为)
- [预览与校验](#预览与校验)
- [部署保持独立](#部署保持独立)
- [Dev Note](#dev-note)

## manifest 归属

改动 manifest 之前，先阅读 [docs/AGENTS.md](../../../../docs/AGENTS.md) 以及 [website/docs.ts](../../../../website/docs.ts) 中当前的 `DocsPage` 类型和条目；不要依赖记忆中的字段集合。新增章节、侧边栏集合、locale 或顶层导航项之前，先阅读 [website/.vitepress/config.ts](../../../../website/.vitepress/config.ts)。对于被编辑的双语源文件，遵循 [docs/AGENTS.md](../../../../docs/AGENTS.md#writing-rules) 中的轻量常规路径和[配对约定](../../../../docs/i18n/README.md)；不要自动调用扩展翻译 skill。

绝不编辑或提交 `website/.generated/`、`website/.cache/` 或 `website/.dist/`。除 `website/AGENTS.md` 之外，绝不在 `website/` 下添加 Markdown；`website/zh-CN/`、`website/en/`、`website/api/` 这类 locale 和路由目录都是无效的源布局。生成的 catalog 放在 `docs/` 下，在那里做新鲜度门禁，并通过 manifest 发布。

## 判定改动类型

- **编辑已发布的页面：** 只改它的权威 Markdown 源。除非路由或导航元数据变化，否则不要动 manifest。
- **发布新页面：** 在它所属的 `docs/` 层级创建，然后添加一条 manifest 条目。
- **重命名、移动或删除页面：** 原子更新权威文件、manifest 条目和仓库内的入站链接。删除过时的 manifest 条目；`docs:check` 会拒绝缺失的源。
- **发布生成的 catalog：** 在 manifest 中映射生成的 `docs/` 文件，但要改它的生成器或源元数据，而不是手工编辑 catalog。
- **改动站点结构：** 普通页面更新 manifest；只有当现有侧边栏、章节或 locale 模型无法表达该改动时，才更新 VitePress 配置。

让 manifest 保持显式的公开允许列表。不要因为 RFC、复盘、测试指南、`AGENTS.md` 或维护者工作流存在于 `docs/` 下就发布它们；只有当用户明确扩大站点发布范围时，才加入内部材料。

## DocsPage 字段

每个 `DocsPage` 字段都要有意识地设置。权威字段集合和 `DocsSidebar` 联合类型位于 [website/docs.ts](../../../../website/docs.ts)——在那里阅读，而不是把取值抄进文字；章节由该文件中的 `sections` 记录负责，VitePress 配置中没有单独的顺序列表。

- `source`：仓库相对的权威 Markdown 路径。对于完整的双语配对，通过 `pairedPages()` 添加英文 `.md` 路径；它会推导出 `.zh.md` 姊妹篇、内容 locale 和对侧别名。
- `route`：公开的 VitePress 路径，包含 `.md` 后缀。
- `label`：侧边栏标签，不必等于文档的 H1。
- `sidebar`：复用已有的 `DocsSidebar` 集合，除非信息架构确实需要另一个。
- `section`：尽量复用已有章节。若要新增，也要在 `sections` 记录中定义它。
- `order`：章节内的稳定顺序。
- `sourceAliases`：可选的额外仓库路径，在投影链接时应解析到本页面。它不会创建另一条公开路由。

只有当某个源有意在两条路由树中都回退到同一种可用语言时，才使用 `mirroredPages()`。对侧文件加入后，把该条目转换为 `pairedPages()`。站点路由树与源布局相互独立：`foo.zh.md` 投影到根路由，`foo.md` 投影到对应的 `/en/` 路由。

## 保持链接行为

在权威文档中写普通的仓库相对 Markdown 链接。投影器应用以下规则：

- 目标出现在 manifest 中时，变成站点相对路由。
- 存在于 manifest 之外的目标，变成 GitHub 源码链接，包括支持的行号后缀。
- 图像是例外：其文件会被复制进生成树并从那里引用，因此无论仓库是否公开，站点都能提供它。它必须是仓库内的常规文件。
- 外部 URL、站点绝对 URL、邮件链接和仅含 fragment 的链接保持不变。
- 缺失的仓库相对目标会让投影失败，而不是悄悄产生坏链接。
- 跨页面 fragment 以英文 GitHub 标题 id 作为规范 id。如果由人编写的标题生成了不同的 VitePress id，紧挨着它之前放一个显式的 `<a id="..."></a>`；生成的别名则在所属生成器中添加。

不要为了满足 VitePress 就把网站专用路由写进权威 Markdown。对于应当解析到已映射索引页的目录式仓库链接，使用 `sourceAliases`。

## 预览与校验

编辑时运行本地预览：

```sh
pnpm docs:dev
```

开发服务器会监听已映射的源文件并重新投影。如果新源没有被自动拾取，修改 manifest 后重启它。

在认为映射有效之前，先运行针对性的网站门禁：

```sh
pnpm docs:check
```

如果 Markdown 链接检查通过，但站点构建报告缺失 fragment，按 `verify-doc-site-fragments` 给出的源路径和目标路径处理。在由人编写的 Markdown 中或所属生成器中，用显式别名保留英文 GitHub id。

提交文档站点改动之前，运行：

```sh
pnpm run test:docs
pnpm run doc-sync
pnpm run lint
git diff --check
```

推送前使用 [dsh-pre-push-checks](../../dsh-pre-push-checks/SKILL.md)。报告改动的权威文件、增删的 manifest 条目、受影响的公开路由，以及实际运行的检查。

## 部署保持独立

把内容同步进 VitePress 构建并不等于发布到互联网。除非用户明确要求部署并确认托管策略，否则不要添加 GitHub Pages 权限、部署工作流、自定义域名或公开托管。

## Dev Note

None.

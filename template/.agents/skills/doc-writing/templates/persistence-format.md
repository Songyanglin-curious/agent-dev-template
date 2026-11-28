# 模板：persistence-format

本 kind 用于 `docs/persistence-changes/historical-formats/vN.md`。每条记录描述一个显式选定的历史持久化格式检查点，并包含完整声明的类型。它是格式参考，不是发布记录，也不是兼容性确认。当前写入格式由目标项目的实现与当前规范说明，不从历史检查点推导。

格式的提取与渲染由项目按所用持久化技术实现。工具就绪前不要创建本类记录：没有可控的提取器就无法保证历史 schema 与源码一致，临时结论留在 Agent Note 或复盘中。

## 元数据

```yaml
---
description: "该历史持久化格式、它的源码检查点，以及本文档记录的类型。"
kind: persistence-format
---
```

## 章节

1. **摘要：** 说明该格式及其有区分度的持久化字段。
2. **目录：** 链接后续章节，锚点使用标题生成的 id。
3. **源码证据：** 写明发布标签或变更请求编号，以及足以选定源码树的上下文。变更请求的中间状态不得被呈现为它的最终合并结果或产品发布。历史来源使用不带行号的文件路径；除非链接到确切源文件，否则保持为文本。
4. **格式特征：** 解释 header、记录和物理编码上的差异；超出声明类型清单的行为要链接其编解码归属方。
5. **机器声明：** 包含一个 `yaml persistence-format` 块，其中有 `schemaVersion: 1`、数值型 `formatVersion`、恰好包含一个 `tag` 或数值型 `pullRequest` 的 `source`，以及把每个 root 键映射到其捕获 SHA-256 digest 的 `roots`。链接同目录的 `vN.schema.json`。
6. **完整 schema：** 保留一个 `persistence-format-schema:start` / `persistence-format-schema:end` 注释区域。项目的格式工具会在这里渲染 root digest 和所有可达定义；不要手工编辑该区域。
7. **验证与限制：** 写明实际提取证据、覆盖范围限制和离线校验器。保留历史可选字段和不透明声明，但不声称已获编解码准入或迁移安全。
8. **开发备注：** 保留给非权威的工作语境，或写 `None.`。

项目按需建立 `docs/persistence-changes/historical-formats/README.md` 承载覆盖范围与维护规则，并提供 `verify-persistence-formats --write` 一类的校验与刷新入口；命令名与参数随项目工具而定。校验器无法创建历史证据或修复机器数据，因此不要把命令当成证据来源。当前写入器前进时，每个更旧的版本号都要保留文档；不要以历史文件名重复当前的 catalog。

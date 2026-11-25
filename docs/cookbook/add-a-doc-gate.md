# 新增文档门禁

## 适用场景

一条结构约束反复出现在评审中，能用文件内容、路径或 Git 状态机械判定，并且已经有明确的归属文档。语义判断、内容质量和归属正确性不写成门禁，它们属于评审和 Skills。

## 前置条件

- 约束有唯一归属：`docs/subsystems/documentation-gates.md` 中的一行，或另一份承担该事实的文档。
- Node ≥ 22.18，仓库依赖已安装。
- 已确认现有门禁没有覆盖同一约束；重复门禁会让同一违规报告两次。

## 步骤

1. 在 [文档门禁](../subsystems/documentation-gates.md) 的清单表中增加一行，写明扫描语料和检查内容；这一行是该门禁的归属声明。
2. 在 `scripts/` 新建 `verify-<subject>.ts`，复用 `doc-tooling.ts`、`repo-files.ts`、`markdown.ts`、`doc-units.ts`，不复制解析逻辑（[S.2](../core-guidelines/scripts.md#s2-共享解析只实现一次)）。
3. 实现通过路径：向 stdout 打印包含实际检查数量的一行摘要，以 0 退出。
4. 实现失败路径：向 stderr 逐条打印文件、行号（可得时）和期望值，以非零退出；不在失败后打印成功摘要（[S.1](../core-guidelines/scripts.md#s1-门禁以退出码和可定位诊断报告结果)）。
5. 如果门禁由清单驱动，在 `scripts/` 新建清单，并校验失效条目、缺失文件和非法字段。
6. 在 `package.json` 注册 `verify-<subject>` 命令，并把它加入 `test:docs` 或 `test:notes` 的串联命令。
7. 在 `scripts/change-doc-rules.json` 中确认 `scripts/**/*.ts` 规则覆盖新脚本；如果新脚本拥有额外归属文档，补充一条规则。
8. 更新 [scripts 模块](../../scripts/README.md) 的能力说明和源码导航表。
9. 在 `scripts/tests/gates.test.ts` 增加一个失败路径用例，确认门禁会拒绝违规并给出可定位诊断。
10. 运行 `pnpm run test:gates`、`pnpm run test:docs` 与 `pnpm run test:notes`，确认全绿。
11. 如果新增门禁包含取舍（例如为什么不做成硬失败），在同一次变更中新增或更新 Agent Note。

## 验证

```sh
pnpm run test:gates
pnpm run test:docs
pnpm run test:notes
node scripts/verify-<subject>.ts
```

最后一个命令在干净仓库上应报告非零检查数；失败路径由 `test:gates` 中的用例固定，不再依赖临时手改文件。

## 失败恢复

- **检查数为零**：检查 glob、排除条件与工作目录；语料为空通常意味着 glob 写错，而不是仓库缺少文件。
- **测试通过但门禁没有拒绝**：确认用例真的写入了违规内容，以及门禁语料覆盖了测试工作区。
- **清单失效条目**：删除对应条目或恢复目标文件；不要用豁免掩盖缺失。
- **重复报告**：删除新门禁或旧门禁中的一个，保留归属更准确的那个。

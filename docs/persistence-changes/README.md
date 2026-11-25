# 持久化记录

本目录保存具有长期维护价值的持久化数据结构变化：历史结构、兼容性决策和验证依据。它只处理会被旧版本读取、需要迁移或需要长期恢复的数据；纯行为变更属于子系统页或 Agent Note。

## 三类记录

| 记录 | 位置 | 回答的问题 |
|---|---|---|
| `persistence-change` | `docs/persistence-changes/YYYY-MM-DD-slug.md` | 这次结构变更改了什么、每个 root 的前驱是什么、兼容决策是什么 |
| `persistence-release` | `docs/persistence-changes/releases/<tag>.md` | 某个发布标签对应什么格式版本、与前一发布相比结构如何变化 |
| `persistence-format` | `docs/persistence-changes/historical-formats/vN.md` | 某个历史格式的完整 schema、源码证据和可达类型 |

记录模板在 [doc-writing](../../.agents/skills/doc-writing/SKILL.md) 的 `templates/` 中；`kind` 与位置共同决定使用哪一份。文件夹本页是索引和规则，不是记录。

## 不变量

- **只增不改。** 记录被接受后，后续演进通过新增后继记录表达；不得改写历史记录或重新解释已接受的 digests。
- **机器声明唯一。** 每条记录只包含一个 `yaml <kind>` 声明块；digest 由项目工具生成，不手填。声明之外的文字由作者维护。
- **伴生 schema 随记录提交。** `persistence-format` 记录附带完整的 `*.schema.json`，生成区域由生成器维护，不手工编辑。
- **版本决策显式。** 同版本兼容变更声明 `decision: same-version`；格式版本常量变化对应 `version-bump`，并链接迁移和验证。
- **验证证据可复现。** `Verification` 章节列出实际执行的命令与结果，以及锁定兼容性的测试。

## 工具要求

检测、schema 提取、digest 生成和迁移验证由项目按自己的持久化技术实现：关系数据库、文档数据库、配置文件、游戏存档、事件日志、导入导出文件各有不同的提取方式。本仓库没有运行时持久化数据，因此不建立记录，也不实现提取器；工具就绪前不要把临时决策写成记录，先放在 Agent Note 或复盘中，并从一条 baseline 记录开始。

## 与相邻层级的分界

- **子系统页 / 模块文档**：当前的运行时契约与读写行为。
- **Agent Note**：为什么选择这个格式、放弃了哪些兼容方案。
- **持久化记录**：历史上实际存在过的结构、兼容决策和验证证据。

## 索引

尚无记录。建立第一条 `baseline: true` 记录后，在本表登记日期、root 与变更摘要。

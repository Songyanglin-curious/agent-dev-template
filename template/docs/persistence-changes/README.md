# 持久化记录

需要长期读取、迁移或恢复的数据结构发生变化时，在此记录结构证据和兼容性决策。当前读写行为写在模块或子系统文档；选择某种格式、否决其他方案的理由写在 Agent Note。纯行为变更不建持久化记录。

## 选择记录

| 记录模板 | 位置（相对本目录） | 什么时候用 |
|---|---|---|
| [persistence-change](../../.agents/skills/doc-writing/templates/persistence-change.md) | `YYYY-MM-DD-slug.md` | 接受结构变更时，标明受影响的 root、每个 root 的前驱及兼容性决策 |
| [persistence-release](../../.agents/skills/doc-writing/templates/persistence-release.md) | `releases/<tag>.md` | 固定发布标签与格式版本，比较前后结构；比较结果本身不是兼容性证明 |
| [persistence-format](../../.agents/skills/doc-writing/templates/persistence-format.md) | `historical-formats/vN.md` | 固定一个历史格式的完整 schema、来源与结构摘要 |

## 建立记录的条件

1. 由接入项目确定需要追踪的结构根（root）、结构提取和 digest 生成方法，提供能重现结果的工具。模板不提供数据库、文件或其他存储技术的提取器。工具未就绪时可用 Note 保存取舍，不手填 digest 或编造历史记录。
2. 从真实结构建立第一条 `baseline: true` 记录；后继变更按 root 标明前驱。记录被接受后只追加后继，不改写已接受的历史或重新解释原有 digest。
3. 每条记录只含一个与 `kind` 一致的带标签 YAML 声明块。同版本兼容写 `decision: same-version` 并给出依据；格式版本变化写 `version-bump` 并链接实际迁移与验证。历史格式记录同时保存同文件主名的 `.schema.json`；生成区域由生产者刷新，不手工改写。
4. 在验证章节写实际执行的命令、结果和兼容性测试。运行 `pnpm run verify-persistence-records` 检查位置、必需章节、声明、前驱及伴生文件；结构检查不替代对旧数据的读写或迁移验证。

## 索引

有记录后在这里按日期、root 与变更摘要链接到正文；没有受管理的格式时只保留规则。

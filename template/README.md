# 【项目填写：项目名称】

【项目填写：用一两句话说明服务对象、项目能完成的事，以及用户从哪里开始使用。已有产品 README 时保留其内容，合并下面的研发入口。】

## 第一次使用

1. **选择接入方式。** 新项目把这套文件的**内容**放在项目根目录，而不是保留一层 `template/`；包括 `.agents/`、`.gitkeep`、`.gitignore` 和 `.gitattributes`。已有项目先按 [project-onboarding](.agents/skills/project-onboarding/SKILL.md) 盘点同名文件，再按需合并：保留产品说明、许可证、现用构建与 CI，不覆盖原有脚本、包清单或锁文件。模板所用材料的[许可声明](LICENSE.template)随拷贝保留，不替项目选择许可证。
2. **填入已核实的事实。** 替换本页和[架构页](docs/architecture.md)上的项目填写说明；模块边界由维护者确认，只为已存在的单元写[模块文档](.agents/skills/doc-writing/templates/module.md)。没有代码或证据时注明尚未实现或核实，不预建业务子系统。记录原始需求不等于创建任务。
3. **安装文档工具。** 从复制后的根目录运行 `pnpm install --frozen-lockfile`。随附的[命令与开发依赖](package.json)及[锁文件](pnpm-lock.yaml)只服务于治理工具，不规定产品语言、框架或包管理器；把其中的占位包名改为项目名称。运行这些脚本需 Node.js ≥ 22.18、pnpm 11.24.0；依赖来自包源或本地缓存。已有依赖体系时合并命令与开发依赖，确认脚本按 ES 模块运行，再用项目的包管理器产生一致的锁文件；不要为了这些门禁改变业务代码的模块类型。
4. **确认最小入口。** 在项目根按顺序运行 `pnpm run test:docs` 和 `pnpm run test:notes`，再运行 `pnpm run verify-tasks`（空模板应报告 0 项任务）。项目根还不是独立 Git 工作树时，依赖 Git 的检查会明确报告跳过，其余结构检查仍会执行；初始化 Git 并产生基线后重跑，才能得到完整结果。全套检查不需要远端，也不借用本模板所在仓库的历史。日常工作按[根规则](AGENTS.md)选择检查，不必重复首检。

## 这次工作从哪里开始？

| 场景 | 入口与结束条件 |
|---|---|
| 询问机制、调查或讨论 | 默认只读；给出有依据的答复和未知项，不建任务或 Note。 |
| 一次可完成的局部修改 | 直接实施，跑受影响的检查；交付时说明结果。 |
| 收到外部需求或约束 | 原文放[研发输入](研发输入/README.md)。需要跨回合管理时按[任务规则](研发任务/README.md)记目标、范围、验收并链接输入；内部目标不必造输入。交付、放弃或被替代时移动同一份任务文件并校验。 |
| 复杂改动或长期设计取舍 | 先查[架构](docs/architecture.md)、子系统和现有决策。需要记录「为什么不选另一方案」时写 [Agent Note](.agents/notes/README.md)，不是每次改动的审批环节；过时决策按[归档规则](.agents/skills/archive-agent-notes/SKILL.md)处理。 |
| 修改当前行为、契约或文档 | 依[文档标准](docs/AGENTS.md)同步事实；[doc-writing](.agents/skills/doc-writing/SKILL.md)提供五类文档骨架，[prose-standard](.agents/skills/prose-standard/SKILL.md)处理文字契约，[trim-cot-leakage](.agents/skills/trim-cot-leakage/SKILL.md)用于清理失效的推理记录。 |
| 修复系统性缺陷或沉淀可重复操作 | 事故经过进[复盘](docs/postmortem/README.md)，如何避免同类错误进[防御模式](docs/defensive-patterns/README.md)，重复设计选择进[核心准则](docs/core-guidelines/README.md)，已验证步骤进 [cookbook](docs/cookbook/README.md)。 |
| 本地变更待评审、交付或准备推送 | 用 [code-review](.agents/skills/code-review/SKILL.md)按证据评审，用 [pre-push-checks](.agents/skills/pre-push-checks/SKILL.md)按范围验证。报告执行过的检查、失败与未覆盖项；交付不触发发布。 |

根规则规定何时行动，专项 Skill 提供对应场景的做法，[Scripts](scripts/README.md)只检查可机械判断的事项。宿主不支持自动发现 Skill 时，直接打开相应文件即可；模板不会自动调度任务、评审或归档。

## 项目接入项

下表是接入说明，不是已配置的能力。把适用行替换成项目**实际验证过**的入口、责任人或权威文档；不适用时说明原因。文档门禁不能代替业务验收。

| 接入项 | 项目需要补充什么 |
|---|---|
| 本地工程验证 | 【项目填写：安装与启动前提、静态检查、构建、聚焦测试及必要的集成测试命令，失败怎样定位。】 |
| CI 与合并保护 | 【项目填写：在哪些变更事件运行哪些本地同款检查，如何取得可信比较基线、保存日志和阻止失败合并。】模板不附平台工作流或保护设置。 |
| Git Hooks | 【项目填写：是否用 Hook；若用，说明安装、触发点、失败行为和补跑方式。】未安装时提交或推送不会自动运行本地检查。 |
| 发布与部署 | 【项目填写：发布授权、环境、版本与产物、发布前验证、回退与迁移责任。】不在模板中放置凭据或提供默认部署命令。 |
| 文档与路径清单 | 按[文档门禁](docs/subsystems/documentation-gates.md)登记真实归属与预算；有实际生成器、持久化格式或合理豁免时再登记相应清单。按所用语言调整源码引用的扫描范围。 |

填完后由维护者确认项目使用入口、架构边界和工程命令；另行接通并验证 CI、Hook 或部署前，不把它们列为自动保障。

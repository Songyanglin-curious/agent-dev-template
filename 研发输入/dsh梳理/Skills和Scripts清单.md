# **DSH 研发工具清单**

以 DSH `master` 分支为依据，本次不局限于根目录 AGENTS.md 已经引用的工具。

## **一、Skills 清单**

[原始目录：.agents/skills/](https://github.com/deepseek-ai/deepseek-harness/tree/master/.agents/skills?utm_source=chatgpt.com)

该目录目前共有 **22 个 Skill**。

| Skill 名称                      | 主要作用                                                                                             |
| ------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `agent-experience`            | 优化 Agent 工具定义、参数描述、上下文加载、Skills 与多步骤工作流，提高信息可发现性和上下文使用效率。 |
| `cordis-styling-nitpicking`   | 审查 Cordis 插件的资源所有权、生命周期、单例状态、副作用与资源释放问题。                             |
| `dsh-archive-agent-notes`     | 审查、整理、合并、删除和归档研发决策记录，控制有效决策文档的规模。                                   |
| `dsh-ci-test-reliability`     | 设计与审查可靠的测试，排查并发、时钟、共享资源、子进程和异步清理导致的不稳定测试。                   |
| `dsh-client-ui-ux`            | 指导 UI/UX 设计、实现与审查，涉及布局、间距、图标、几何关系和交互。                                  |
| `dsh-code-review`             | 指导代码审查，根据项目规则、设计决策、防御性模式和质量检查识别实际缺陷。                             |
| `dsh-create-upgrade-guide`    | 在发生外部可感知的破坏性变更时创建或更新版本升级指南。                                               |
| `dsh-cua-macos-signing`       | 配置 macOS Computer Use 开发环境的固定签名身份，减少重新构建导致的重复权限授权。                     |
| `dsh-doc-writing`             | 指导文档创建、重构、审查、目录组织、README 编写及文档验证。                                          |
| `dsh-error-handling`          | 指导错误类型、错误码、故障隔离、恢复、重试和错误报告的设计与审查。                                   |
| `dsh-find-simplifications`    | 发现并论证可以删除的冗余功能、代码、配置、接口、测试及文档，降低维护成本。                           |
| `dsh-merging-stacked-prs`     | 指导具有依赖关系的多个 GitHub PR 的组织、合并与状态管理。                                            |
| `dsh-official-plugin-artwork` | 指导官方插件图标、功能预览图的设计、检查与审核。                                                     |
| `dsh-pr-description`          | 规范 PR 描述，记录关联需求、模块职责、变更内容、测试设计及 AI 使用情况。                             |
| `dsh-pre-push-checks`         | 根据代码变更及影响范围选择必要的测试和工程检查，避免无意义地运行全部测试。                           |
| `dsh-prose-standard`          | 规范文档、代码注释、JSDoc、提示词、错误信息和 UI 文案的内容与表达。                                  |
| `dsh-responsive-ui`           | 指导响应式布局、移动端适配、触摸交互、文本截断、焦点与键盘行为。                                     |
| `dsh-session-projection`      | 指导根据会话事件构建、恢复、维护及审查会话状态投影。                                                 |
| `dsh-speed-up-perf`           | 指导性能调查、性能基准设计、瓶颈定位及基于实际测量的性能优化。                                       |
| `dsh-translate-docs`          | 执行双语文档翻译、翻译任务分配及双语文档一致性验证。                                                 |
| `dsh-trim-cot-leakage`        | 清除文档和注释中的临时讨论痕迹、推理过程、审查历史与过时的变更叙述，同时保留有效事实。               |
| `record-browser-gif`          | 录制真实 Web UI 操作过程，生成优化后的 GIF，作为功能展示与 PR 审查证据。                             |

以上 22 项均已读取对应 `SKILL.md` 的官方描述，不是根据名称猜测。

## **二、Scripts 清单**

[原始目录：scripts/](https://github.com/deepseek-ai/deepseek-harness/tree/master/scripts?utm_source=chatgpt.com)

脚本数量较多，我按用途分类，但不替你筛选。清单包含根目录下的检查脚本、生成脚本、工程操作脚本及内部辅助模块，以及主要子目录中的功能脚本。

### **1. 文档与研发记录检查**

| 脚本名称                                      | 作用                                                     |
| --------------------------------------------- | -------------------------------------------------------- |
| `verify-md-links.ts`                        | 检查 Markdown 文档中的链接有效性。                       |
| `verify-md-wrap.ts`                         | 检查 Markdown 段落是否符合物理行换行规则。               |
| `verify-mermaid.ts`                         | 检查 Mermaid 图表。                                      |
| `verify-doc-budgets.ts`                     | 检查不同文档是否超过各自的篇幅限制。                     |
| `verify-doc-refs.ts`                        | 检查 TypeScript 源码中引用的文档路径是否有效。           |
| `verify-doc-site-fragments.ts`              | 检查生成的文档网站中的页面片段及锚点引用。               |
| `verify-public-repository-links.ts`         | 检查公开仓库链接是否符合项目规定。                       |
| `verify-repository-references.ts`           | 检查维护中的文件是否包含被禁止的 Commit 引用及仓库地址。 |
| `verify-concrete-terms.ts`                  | 检查项目明确禁止使用的歧义术语。                         |
| `verify-agent-note-classification.ts`       | 检查 Agent Notes 的分类与目录组织是否符合规定。          |
| `verify-agent-note-format.ts`               | 检查 Agent Notes 的文档结构、元数据与内容格式。          |
| `verify-archived-agent-notes.ts`            | 检查已归档研发记录的完整性及冻结内容是否被修改。         |
| `verify-subsystem-pages.ts`                 | 检查子系统文档及其归属关系。                             |
| `verify-package-readme-summaries.ts`        | 检查软件包 README 的摘要内容。                           |
| `verify-package-readme-limitations.ts`      | 检查软件包 README 中的限制说明。                         |
| `verify-package-readme-model-experience.ts` | 检查软件包 README 中面向模型的使用体验说明。             |
| `verify-skill-invocation-metadata.ts`       | 检查 Skill 的调用权限与调用元数据。                      |
| `verify-upgrade-guides.ts`                  | 检查版本升级指南的组织和内容规范。                       |
| `verify-export-jsdoc.ts`                    | 检查导出接口、函数和模块的 JSDoc 文档。                  |
| `verify-type-equiv.ts`                      | 检查文档中声明的类型与实际源代码类型是否一致。           |
| `doc-typecheck.ts`                          | 对文档中的 TypeScript 示例进行类型检查。                 |
| `verify-translation-pairing.ts`             | 检查中英文文档的配对与一致性记录。                       |
| `verify-translation-prompt.ts`              | 检查文档翻译工作流使用的提示词。                         |

### **2. 文档与参考资料生成**

| 脚本名称                           | 作用                                                        |
| ---------------------------------- | ----------------------------------------------------------- |
| `gen-cli-help.ts`                | 根据实际 CLI 生成命令帮助文档。                             |
| `gen-client-catalog.ts`          | 生成客户端相关能力的参考目录。                              |
| `gen-config-catalog.ts`          | 生成配置项参考目录。                                        |
| `gen-cordis-api.ts`              | 生成 Cordis API 参考文档。                                  |
| `gen-cordis-catalog.ts`          | 生成 Cordis 服务、事件等能力目录。                          |
| `gen-cordis-inspect-catalog.ts`  | 生成 Cordis 检查能力的参考目录。                            |
| `gen-dependency-catalog.ts`      | 生成项目依赖目录。                                          |
| `gen-doc-graphs.ts`              | 生成文档使用的关系图。                                      |
| `gen-module-graph.ts`            | 生成软件模块及依赖关系图。                                  |
| `gen-official-bundle-catalog.ts` | 生成官方 Bundle 目录。                                      |
| `gen-persistence-catalog.ts`     | 生成持久化数据结构参考目录。                                |
| `gen-plugin-packages.ts`         | 根据软件包清单和配置分类生成可加载插件列表，供 Skill 使用。 |
| `gen-session-format-catalog.ts`  | 生成 Session 数据格式参考目录。                             |
| `gen-third-party-notices.ts`     | 生成第三方依赖声明及许可信息。                              |
| `gen-tool-catalog.ts`            | 生成 Agent 可用工具的参考目录。                             |
| `gen-translation-brief.ts`       | 生成文档翻译任务所需的说明材料。                            |
| `gen-workflow-guest.ts`          | 生成 Workflow Guest 相关源码。                              |
| `project-doc-site.ts`            | 将仓库文档组织、转换为文档网站使用的内容。                  |
| `stage-dsh-docs.ts`              | 准备和整理需要随 DSH 交付的文档资源。                       |
| `render-persistence-schema.ts`   | 将持久化 Schema 转换为可阅读的参考内容。                    |

部分生成器支持 `--check` 模式，用于判断已经提交的生成内容是否落后于源代码。

### **3. 代码规范与架构检查**

| 脚本名称                                | 作用                                           |
| --------------------------------------- | ---------------------------------------------- |
| `verify-empty-catch.ts`               | 检查空 catch 是否符合异常处理约定。            |
| `verify-no-unknown-casts.ts`          | 阻止新增不符合项目规则的 `unknown`类型断言。 |
| `verify-no-top-level-await.ts`        | 检查禁止使用顶层 await 的代码。                |
| `verify-no-bare-dispatcher.ts`        | 检查不符合规则的裸 Dispatcher 使用。           |
| `verify-css-selectors.ts`             | 检查 CSS 选择器是否符合项目约束。              |
| `verify-cordis-root.ts`               | 阻止新增对 Cordis 根 Context 的直接访问。      |
| `verify-cordis-config.ts`             | 检查 Cordis 配置文件、插件引用与依赖声明。     |
| `verify-config-source-ownership.ts`   | 检查配置项的源码归属。                         |
| `verify-client-domain-graph.ts`       | 检查客户端领域模块之间的依赖关系。             |
| `verify-client-packages.ts`           | 检查客户端软件包是否符合架构与组织约束。       |
| `verify-client-route-resolution.ts`   | 检查客户端路由解析机制。                       |
| `verify-client-ui-i18n.ts`            | 检查 UI 文案是否使用规定的国际化机制。         |
| `verify-application-entrypoints.ts`   | 检查应用程序入口是否符合项目启动约束。         |
| `verify-plugin-entry-exports.ts`      | 检查插件入口的导出内容。                       |
| `verify-plugin-record-callers.ts`     | 检查插件记录相关 API 的调用位置。              |
| `verify-default-product-isolation.ts` | 检查默认产品与其他可选组件之间的隔离。         |
| `verify-runtime-closure.ts`           | 检查运行时依赖是否完整。                       |
| `verify-v3-event-vocabulary.ts`       | 检查 V3 会话事件使用的类型及术语。             |
| `verify-locale-metadata.ts`           | 检查语言区域相关的元数据。                     |

### **4. 软件包、依赖与版本检查**

| 脚本名称                                  | 作用                                               |
| ----------------------------------------- | -------------------------------------------------- |
| `verify-package-paths.ts`               | 检查软件包路径与目录组织。                         |
| `verify-package-meta.ts`                | 检查软件包元数据。                                 |
| `verify-package-dependencies.ts`        | 检查软件包依赖声明。                               |
| `verify-optional-dependency-imports.ts` | 检查可选依赖的导入方式。                           |
| `verify-product-use.ts`                 | 检查软件包是否符合产品使用及分类要求。             |
| `verify-dsh-package-licenses.ts`        | 检查 DSH 软件包许可信息。                          |
| `verify-npm-install-layout.ts`          | 检查 npm 安装后的目录与软件包布局。                |
| `verify-node-next-types.ts`             | 检查软件包在 NodeNext 模块解析模式下的类型兼容性。 |
| `verify-version-sync.ts`                | 检查相关组件的版本是否同步。                       |
| `check-workspace-constraints.ts`        | 检查 Monorepo 工作区约束。                         |
| `check-vendor-manifest.sh`              | 检查第三方源码引入清单。                           |
| `check-expected-filenames.sh`           | 检查预期结果文件的命名。                           |
| `check-macos-deployment-target.py`      | 检查 macOS 构建产物的部署版本要求。                |
| `publint-all.ts`                        | 对软件包的发布规范执行检查。                       |
| `gen-tsconfig-paths.ts`                 | 生成 TypeScript 项目的路径映射配置。               |
| `generate-typert.ts`                    | 生成 Typert 类型相关产物。                         |

### **5. 构建、开发与工程流程**

| 脚本名称                             | 作用                                                          |
| ------------------------------------ | ------------------------------------------------------------- |
| `run-gates.ts`                     | 统一组织、并发执行工程检查，处理检查依赖与结果汇总。          |
| `change-scope.ts`                  | 根据 Git 基准与目标版本生成结构化的变更范围报告。             |
| `pre-merge-check.ts`               | 执行合并前的工程检查。                                        |
| `build.ts`                         | 统一调度项目构建、构建产物生成和类型检查。                    |
| `clean.ts`                         | 清理构建产物及已删除模块的安全残留。                          |
| `compile-referenced-projects.ts`   | 编译具有项目引用关系的 TypeScript 工程。                      |
| `run-oxlint.ts`                    | 执行 Oxlint 代码检查。                                        |
| `install-lefthook.mjs`             | 安装或配置 Lefthook Git Hooks。                               |
| `dev-web.ts`                       | 启动 Web 开发环境并支持开发期间的更新。                       |
| `demo-ptc.mjs`                     | 运行 PTC 模式演示。                                           |
| `rescope-vendor.ts`                | 调整引入的第三方源码及软件包命名空间。                        |
| `wine-windows-gates.sh`            | 通过 Wine 执行 Windows 相关工程检查。                         |
| `ci-compatible-toolcache.mjs`      | 处理 CI 环境中的兼容工具缓存。                                |
| `ci-verified-download.sh`          | 执行需要完整性验证的 CI 下载操作。                            |
| `prepare-ci-bubblewrap.sh`         | 准备 CI 使用的 Bubblewrap 沙箱环境。                          |
| `prepare-linux-node-pty.sh`        | 准备 Linux 下的 Node PTY 运行环境。                           |
| `build-exe-for-python-sdk.ts`      | 为 Python SDK 构建独立可执行程序。                            |
| `build-exe-for-ssh-helper.ts`      | 构建 SSH Helper 可执行程序。                                  |
| `build-python-release.py`          | 构建 Python 发布产物。                                        |
| `smoke-python-runtime.py`          | 执行 Python 运行环境的冒烟测试。                              |
| `publish-npm-baseline.ts`          | 发布 npm 基准版本相关产物。                                   |
| `desktop-archive-workflow-test.ts` | 验证桌面应用归档相关的工作流。                                |
| `upstream-skills-digest.ts`        | 计算指定上游 Skill 集合的文件摘要、大小及路径，用于版本固定。 |

### **6. 测试、性能与验证证据**

| 脚本名称                                 | 作用                                                   |
| ---------------------------------------- | ------------------------------------------------------ |
| `run-bench-suite.ts`                   | 执行性能基准测试集合。                                 |
| `run-ci-bench.ts`                      | 在 CI 环境中执行性能基准测试。                         |
| `run-memory-pressure-bench.ts`         | 执行内存压力相关的性能测试。                           |
| `benchmark-next-package-dependency.ts` | 测量软件包依赖相关的性能。                             |
| `benchmark-npm-resolution.ts`          | 测量 npm 依赖解析性能。                                |
| `render-benchmark-report.ts`           | 将性能基准测试结果生成报告。                           |
| `run-coverage-partitions.ts`           | 分区执行测试覆盖率检查。                               |
| `merge-coverage-shards.ts`             | 合并不同测试分片产生的覆盖率结果。                     |
| `coverage-uncovered-locations.cjs`     | 定位未被测试覆盖的代码位置。                           |
| `run-web-snapshots.ts`                 | 执行 Web 快照测试。                                    |
| `snapshot-diff-page.ts`                | 生成用于查看快照差异的页面。                           |
| `attribute-chunk-bytes.mjs`            | 根据 Source Map 分析构建产物体积由哪些模块和依赖贡献。 |

### **7. 持久化数据与迁移**

| 脚本名称                               | 作用                                   |
| -------------------------------------- | -------------------------------------- |
| `persistence-changes.ts`             | 记录与检查持久化类型变更历史。         |
| `persistence-formats.ts`             | 管理和检查历史持久化数据格式。         |
| `persistence-releases.ts`            | 管理和检查已发布版本的持久化数据记录。 |
| `persistence-review.ts`              | 支持持久化数据类型变更审查。           |
| `persistence-schema.ts`              | 处理持久化数据 Schema。                |
| `persistence-finalization.ts`        | 处理持久化格式最终确认相关工作。       |
| `persistence-artifacts.ts`           | 处理持久化格式相关产物。               |
| `migrate-sessions-to-v4.ts`          | 将历史 Session 数据迁移至 V4 格式。    |
| `migrate-packed-session-fixtures.ts` | 迁移已打包的 Session 测试数据。        |
| `migration-failure-summary.ts`       | 汇总数据迁移失败信息。                 |

### **8. 发布与交付**

以下位于 `scripts/release/`。

| 脚本名称                                   | 作用                             |
| ------------------------------------------ | -------------------------------- |
| `release/bump.ts`                        | 更新发布版本号。                 |
| `release/families.ts`                    | 管理需要协调发布的软件包分组。   |
| `release/pack.ts`                        | 构建软件包发布压缩包。           |
| `release/publish.ts`                     | 执行软件包发布。                 |
| `release/verify.ts`                      | 验证发布相关的工程要求。         |
| `release/verify-packed-install.ts`       | 验证打包产物安装后的实际可用性。 |
| `release/installed-product-isolation.ts` | 检查已安装产品的软件包隔离。     |
| `release/process.ts`                     | 提供发布流程中的子进程执行能力。 |
| `release/tarball.ts`                     | 提供发布压缩包的处理能力。       |

### **9. 专项运行环境与辅助程序**

| 脚本名称                                  | 作用                                         |
| ----------------------------------------- | -------------------------------------------- |
| `cua-helper/build-inputs.ts`            | 管理 Computer Use 辅助程序的构建输入。       |
| `cua-helper/package.ts`                 | 对 CUA 辅助程序进行打包。                    |
| `cua-helper/payload.ts`                 | 处理 CUA 辅助程序的交付内容。                |
| `cua-helper/select-artifact.ts`         | 选择对应平台或条件的辅助程序产物。           |
| `cua-helper/stage.ts`                   | 准备 CUA 辅助程序的交付文件。                |
| `cua-helper/verify-tarball.ts`          | 检查 CUA 辅助程序压缩包。                    |
| `cua-helper/smoke.py`                   | 执行 CUA 辅助程序冒烟测试。                  |
| `primary-runtime/prepare.ts`            | 准备主要运行环境。                           |
| `primary-runtime/prune-python-tests.ts` | 清理 Python 运行环境中不需要交付的测试文件。 |
| `primary-runtime/smoke.py`              | 验证主要运行环境的可用性。                   |
| `ssh-helper/artifact.ts`                | 处理 SSH Helper 构建产物。                   |
| `ssh-helper/native.ts`                  | 处理 SSH Helper 原生组件。                   |
| `ssh-helper/probe.ts`                   | 探测 SSH Helper 的相关能力。                 |
| `ssh-helper/release.ts`                 | 处理 SSH Helper 的发布。                     |
| `ssh-helper/worker-probe.ts`            | 探测 SSH Helper 的 Worker 运行能力。         |
| `verify-ssh-helper-artifact.ts`         | 验证 SSH Helper 产物。                       |
| `verify-ssh-helper-ssh.ts`              | 验证 SSH Helper 的实际 SSH 功能。            |

### **10. Scripts 内部辅助模块**

这些文件主要为其他工程脚本提供共用能力，不一定能够单独运行。为了便于你了解 DSH 的完整工程工具组织，也保留在清单中。

| 脚本名称                                  | 作用                                                       |
| ----------------------------------------- | ---------------------------------------------------------- |
| `agent-note-tree.ts`                    | 定义和处理 Agent Notes 的目录与分类结构。                  |
| `archived-agent-notes.ts`               | 提供归档研发记录的处理与验证能力。                         |
| `baseline-inventory.ts`                 | 管理历史违规代码基线，禁止新增违规并允许逐步消除历史存量。 |
| `bench-phase.ts`                        | 处理性能测试阶段。                                         |
| `browser-bundled-externals.ts`          | 处理浏览器构建中的外部依赖。                               |
| `build-exe-for-python-sdk-office.ts`    | 处理 Python SDK 独立可执行程序的 Office 相关组件。         |
| `build-exe-for-python-sdk-resources.ts` | 处理 Python SDK 可执行程序资源。                           |
| `build-exe-for-python-sdk-staging.ts`   | 准备 Python SDK 可执行程序的构建及交付文件。               |
| `bundle-input-isolation.ts`             | 处理 Bundle 构建输入的隔离。                               |
| `client-build-environment.ts`           | 管理客户端构建环境。                                       |
| `cordis-config-files.ts`                | 发现和处理 Cordis 配置文件。                               |
| `cordis-core-api.ts`                    | 提供 Cordis 核心 API 的提取与处理能力。                    |
| `cordis-walk.ts`                        | 遍历 Cordis 相关结构。                                     |
| `cordis-yaml.ts`                        | 解析和处理 Cordis YAML 配置。                              |
| `coverage-canonical-locations.ts`       | 规范化覆盖率记录中的代码位置。                             |
| `coverage-exempt.ts`                    | 管理覆盖率检查的豁免范围。                                 |
| `coverage-file-times.ts`                | 处理覆盖率测试文件的耗时信息。                             |
| `coverage-fork-diagnostics.ts`          | 提供覆盖率测试子进程诊断信息。                             |
| `coverage-partitions.ts`                | 提供覆盖率测试分区计算能力。                               |
| `dev-bundle-registry.ts`                | 管理开发环境中的 Bundle 注册信息。                         |
| `doc-typecheck-paths.ts`                | 处理文档类型检查使用的文件路径。                           |
| `executable-native-pty.ts`              | 处理可执行程序需要的原生 PTY 组件。                        |
| `executable-packaging.ts`               | 提供独立可执行程序打包能力。                               |
| `experimental-package-policy.ts`        | 定义实验性软件包的管理策略。                               |
| `historical-schema-region.ts`           | 识别历史 Schema 文档区域。                                 |
| `jsdoc.ts`                              | 提取和处理 JSDoc 信息。                                    |
| `libreoffice-packages.mjs`              | 处理 LibreOffice 相关的软件包。                            |
| `local-bundle-registry.ts`              | 管理本地 Bundle 注册信息。                                 |
| `markdown.ts`                           | 提供 Markdown 文档解析及处理能力。                         |
| `npm-baseline-packages.ts`              | 管理 npm 基准版本的软件包集合。                            |
| `npm-platform.ts`                       | 提供 npm 平台相关处理能力。                                |
| `package-dependency-policy.ts`          | 定义软件包依赖管理策略。                                   |
| `package-graph.ts`                      | 构建及分析软件包依赖关系图。                               |
| `package-source-uses.worker.ts`         | 并行分析软件包源码的使用关系。                             |
| `paired-markdown-derivatives.ts`        | 处理成对 Markdown 文档的派生内容。                         |
| `parallelism.ts`                        | 计算和管理工程任务并发度。                                 |
| `persistence-catalog-source.ts`         | 提取持久化参考目录的数据来源。                             |
| `persistence-catalog-text.ts`           | 处理持久化参考目录的文本生成。                             |
| `persistence-format-facts.ts`           | 提供持久化格式相关事实。                                   |
| `persistence-release-facts.ts`          | 提供持久化发布历史相关事实。                               |
| `persistence-schema-model.ts`           | 定义和处理持久化 Schema 模型。                             |
| `persistence-source-annotations.ts`     | 处理持久化源码注解。                                       |
| `persistence-source-metadata.ts`        | 处理持久化源码元数据。                                     |
| `persistence-source-policy.ts`          | 定义持久化源码相关检查策略。                               |
| `plugin-entry-existing-exports.ts`      | 分析已有插件入口导出内容。                                 |
| `plugin-record-catalog.ts`              | 处理插件记录参考目录。                                     |
| `pnpm-invocation.ts`                    | 提供跨平台 pnpm 命令执行能力。                             |
| `product-package-policy.ts`             | 定义产品软件包分类及产品使用策略。                         |
| `project-reference-faces.ts`            | 处理不同 TypeScript 工程的引用关系。                       |
| `publication-payload.ts`                | 处理软件包发布内容。                                       |
| `publint-browser-format.ts`             | 处理浏览器软件包发布格式检查。                             |
| `python-runtime-deploy.pnpmfile.mjs`    | 处理 Python 运行时部署相关的依赖配置。                     |
| `repo-files.ts`                         | 提供仓库文件发现、路径处理与引用检查能力。                 |
| `session-fixture-layout.ts`             | 管理 Session 测试数据布局。                                |
| `session-snapshot-corpus-policy.ts`     | 定义 Session 快照测试数据的管理策略。                      |
| `session-snapshot-corpus.corpus.ts`     | 定义 Session 快照测试语料集合。                            |
| `shipped-locales.ts`                    | 管理产品交付的语言集合。                                   |
| `slot-walk.ts`                          | 遍历相关插槽结构。                                         |
| `snapshot-shell-path.ts`                | 处理快照测试中的 Shell 路径。                              |
| `snapshot-spill-locators.ts`            | 处理快照测试中的溢出内容定位。                             |
| `snapshot-workspace-parent.ts`          | 处理快照测试使用的工作区父路径。                           |
| `source-parse-uses.ts`                  | 分析源码中的使用与引用关系。                               |
| `fixture-file.ts`                       | 提供测试数据文件处理能力。                                 |
| `test-dom-environment.ts`               | 准备测试使用的 DOM 环境。                                  |
| `test-fixture-cleanup.ts`               | 清理测试产生的临时资源。                                   |
| `test-non-loopback-address.ts`          | 为测试提供非回环网络地址相关能力。                         |
| `test-official-listing-guard.ts`        | 提供官方列表相关的测试保护机制。                           |
| `test-proxy-environment.ts`             | 管理测试中的代理环境。                                     |
| `translation-brief.ts`                  | 组织翻译任务说明。                                         |
| `translation-links.ts`                  | 处理双语文档中的链接对应关系。                             |
| `translation-pairing-git.ts`            | 利用 Git 信息处理双语文档配对。                            |
| `translation-pairing-record.ts`         | 管理双语文档配对记录。                                     |
| `translation-pairing.ts`                | 提供双语文档配对机制。                                     |
| `translation-prompt.ts`                 | 构建翻译任务使用的提示词。                                 |
| `ts-project.ts`                         | 提供 TypeScript 工程加载与处理能力。                       |
| `type-equiv-prefilter.ts`               | 对类型一致性检查进行预筛选。                               |
| `typert-faces.ts`                       | 处理 Typert 的不同类型工程组成。                           |
| `vitest-source-remote.ts`               | 提供 Vitest 源码测试相关的 Remote 支持。                   |
| `web-product-bundle-isolation.ts`       | 处理 Web 产品 Bundle 的隔离。                              |
| `web-snapshot-projects.ts`              | 组织 Web 快照测试工程。                                    |
| `web-snapshot-sequencer.ts`             | 管理 Web 快照测试执行顺序。                                |
| `web-snapshot-slice.setup.ts`           | 初始化 Web 快照测试分片环境。                              |
| `workspace-package-globs.ts`            | 管理工作区软件包的路径匹配规则。                           |

**资料范围说明：**

* Skills 已逐一核对全部 22 个 `SKILL.md` 的描述。
* Scripts 已依据实际目录清单整理，结合 `package.json`、`run-gates.ts` 和部分脚本源码确认用途；尚未逐一精读所有实现，因此部分内部辅助模块的用途属于初步归纳。
* 未纳入脚本自身的 `.spec.ts` 测试文件、测试 Fixture、类型声明文件、JSON 清单及快照数据。
* 未展开 DSH 产品内部各个 Package 自带的 Skills 和 Scripts。本清单针对的是 DSH **自身的研发治理工具**，而不是 DSH 向终端用户提供的全部产品能力。

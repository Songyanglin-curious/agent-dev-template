# 精炼文字示例

用这些示例识别背后的支配原则，不要把它们当作文字模板。“平衡版”在该位置所需的最少解释下保留每一项承重命题。

## 保留每个事实从句

**原文：** “The uploader serializes chunk writes per file, flushes buffered blocks before the handle closes, and reports storage failures to the caller.”

**删减过度：** “The uploader serializes writes.”

**平衡版：** “The uploader serializes chunk writes per file, flushes buffered blocks before the handle closes, and reports storage failures to the caller.”

删除修饰和重复，而不是删除命题。执行者、按文件的范围、关闭句柄前的顺序和失败的可见性是各自独立的事实。

## 显式的 Skill 范围是有功能的

**删减过度：** “Read the sources and use judgment.”

**平衡版：** “This skill is guidance, not a complete checklist. Use judgment beyond the named checks; documented requirements still apply.”

**过度详细：** 用好几段论证为什么清单不能替代独立推理。

保留这条显式限制，因为它会改变 agent 应用工作流程的方式。删掉重复的说服，而不是删掉护栏。

## cookbook 保留动作与验证

**删减过度：** “Add tests for the cache.”

**平衡版：** “Test eviction and expiry at unit level, exercise the cache through the real factory path, and add a snapshot when the diagnostic output changes. Verify the assertion observes the evicted key rather than the log line.”

**过度详细：** 逐步走查示例代码中已经可见的每个 fixture 文件和断言。

保留测试层级、必需动作、真实入口路径和可观察的验证。删除 fixture 叙述。

## 保留归属与时序

**删减过度：** “Worker work is cancelled during teardown.”

**平衡版：** “The runtime requests worker cancellation before releasing the parent scope; the worker pool remains responsible for joining its threads before shutdown resolves.”

**过度详细：** 按时序记录实现 teardown 所用的每个 promise 和 callback。

执行者、顺序、归属转移的时点和完成保证是各自独立的事实从句。

## 事件 JSDoc 保留边界时序

**删减过度：** “Composes and caches the request headers.”

**平衡版：** “Composes the request headers once before the first middleware step and the transport call. Headers appended by listeners join the current request, and the retry budget receives the composed headers.”

**过度详细：** 走查实现该顺序的循环辅助函数、缓存字段和 promise callback。

事件顺序及其对当前请求的后果是调用方可见的行为，不是实现叙述。

## 为复杂代码提供定位，但不要叙述它

**删减过度：** “Worker support.”

**平衡版：** “Owns the compression worker and its bridge to the main thread. Worker initialization is single-shot; closing the module terminates the worker and rejects later calls. See the worker-isolation design note for the protocol rationale.”

**过度详细：** 逐段预告下面的类和辅助函数。

保留模块的角色、依赖、职责和非显而易见的生命周期行为。链接架构理由，让代码自己展示本地控制流。

## 公开 JSDoc 包含失败情形

**删减过度：** “Returns the connection pool.”

**平衡版：** “Returns the initialized connection pool. Throws if initialization has not completed or the pool has already been closed.”

**过度详细：** 内部状态机分支和导致每次抛出的确切辅助函数调用。

抛出和状态前置条件是调用方可见的契约事实。

## 保留简洁的实现映射

**删减过度：** “Search adapter backed by an external API.”

**平衡版：** “Maps each upstream result to the shared search-result fields, preserving the title, URL, and snippet while omitting upstream-only ranking metadata.”

**过度详细：** 逐字段复述映射代码，包括同名且赋值显而易见的字段。

保留那些说明适配器在何处丢弃或改变信息的映射细节。

## 链接理由，同时保留本地契约

**删减过度：** “Shutdown is documented in the lifecycle design note.”

**平衡版：** “Shutdown aborts the run and waits for worker quiescence. See the lifecycle design note for ownership and race handling.”

**过度详细：** 在每个 disposer 旁边重复设计笔记里的 promise 编排和被否决的归属模型。

把行为和完成保证放在调用方需要的位置。算法和理由可以积极链接；但链接不能替代本地契约。

## 已实现的 Agent Note 保留验证契约

**删减过度：** 因为 Agent Note 已经交付，就删掉整个 Testing 章节。

**平衡版：** “Unit tests cover cancellation before and after publication, shutdown quiescence, and adapter reload. A built-entry smoke covers the real module loader path; snapshot coverage is deferred because the transport is process-local.”

**过度详细：** 逐文件走查 fixture 和断言，却没有额外的行为区分。

删除迁移任务和测试叙述。保留测试层级、它们锚定的行为、真实入口路径和具名覆盖缺口。

## 安全边界可能需要一个具体示例

**删减过度：** “Mounted extensions share the host's authority.”

**平衡版：** “Mounted extensions share the host's authority; for example, access to the shell bridge permits commands with the host process's privileges.”

**过度详细：** 列出扩展可能滥用的每项服务以及每一种假想攻击。

当一个示例能让原本抽象的安全限制在操作上变得清楚时，就保留它。

## 完全删除推理过程记录

**过度详细：** “First the loop checks whether the value is absent. If it is absent, the next branch returns early. Otherwise it continues, which is why the final assertion is safe.”

**平衡版：** 代码已经表达了这些分支时，不写注释。如果提前返回保护了某个非显而易见的不变量，就只陈述该不变量。

不要把推理过程记录压缩成更短的叙述；直接删掉它。

## 配置注释解释配置树表达不了的内容

**过度详细：** 在相邻条目已经展示该顺序时，仍写“This entry loads the input filter, followed by the policy module, followed by the read, write, and edit tools.”

**平衡版：** “Load the policy check before the file tools so their write and edit calls pass through the read-before-mutation check.”

保留顺序带来的后果、出人意料的范围规则或安全边界。让配置自己展示它的清单。

## 不要只为字数而删减

**当前版本：** “The adapter converts upstream errors into the shared error type so callers can handle authentication, rate-limit, and transient failures uniformly.”

**更短但更差：** “The adapter normalizes upstream errors.”

**平衡的决策：** 保留当前句子，除非链接或周边契约已经列出这些失败类别。更短的版本丢失了后果和区分，却没有改善结构。

## 归属：用户可见文本不复制别处

**删减过度：** “The command returns errors when a call fails.”

**过度详细：** 把另一个模块的 schema 和渲染器字符串复制进此命令的 README。

**平衡版：** 引用由本模块负责的稳定 prompt、result 和 error 文本。schema 部分链接生成的命令参考，另一个模块负责的文本链接消费方 README；本地只陈述本模块自己的条件或差异。

用户看到的措辞就是行为，但复制仍会漂移。精确性属于归属方。

只改文字的审计可以指出可疑措辞，但在没有所属可运行快照时不得悄悄修改。保持不变并报告延期，或者扩大授权改动范围，把所属场景和必需的 GUI 证据一并纳入。

## 生成的摘要必须能独立成立

**删减过度：** “Approval request and policy service.” 归属方在后面解释了策略顺序和审计日志，但生成的目录只导出第一句。

**过度详细：** 把该服务的完整生命周期和通知行为塞进被抽取的句子。

**平衡版：** “Approval service that applies workspace policy before approvers and logs every ask/outcome pair to the requesting client.” 把不属于生成目录的细节留在后续句子中。

弄清生成器抽取了什么。该片段必须保留其生成输出上所需的契约。

## 限制是契约，不是债务清单

**删减过度：** 省略一项使配置变更必须重启服务的进程级缓存。

**过度详细：** 列出私有辅助函数的清理逻辑和未使用的测试专用访问器，却没有调用方或维护者层面的后果。

**平衡版：** “The adapter choice is cached for the process lifetime; installing or repairing an adapter requires a restart.” 把普通清理留在其 TODO 或 Agent Note 中。

保留影响使用或安全维护的缺口和非显而易见的约束。模块文档不是待办清单的倾倒场。

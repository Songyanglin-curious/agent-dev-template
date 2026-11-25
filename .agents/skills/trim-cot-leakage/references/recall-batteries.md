# 检索探针

这些探针用来发现八类泄漏的候选段落。探针只负责发现，不负责定性：它们按设计会过度匹配，也天然会漏掉变体——每轮审计都会遇到没有命中任何模式、却确实泄漏了编写过程的文字。每个命中都要回到原文，按本 Skill 开头的可解析性测试人工判断，判断尺度见[示例](examples.md)；在探针之外，还要不带模式地通读范围内最密集的文字（模块 JSDoc、README、Agent Note、复盘、Skill 文件）。

## 调用规则

- **显式给出搜索根。** 常用文档范围是 `docs/`、`.agents/notes/`、根目录 `AGENTS.md` 与 `README.md`、模块文档（本仓库的 `template/README.md` 等）以及 `.agents/skills/*/SKILL.md`。下面的命令以 `docs .agents README.md AGENTS.md template` 为例；审计其他范围时替换这些路径。只有针对全仓库代码注释的探针使用 `.`，并显式排除 `node_modules/` 与 `.git/`。
- **覆盖隐藏目录。** ripgrep 默认跳过以点开头的目录；要搜索 `.agents/` 时加 `--hidden`，并用 `--glob '!.git/**'` 排除版本库元数据。只审计单个文件时可以不加。
- **排除项放在包含项之后。** 后续的 include 会重新纳入先前的 exclude，因此把 `--glob '!.agents/notes/archived/**'` 和 `--glob '!.agents/skills/trim-cot-leakage/**'` 放在命令末尾。归档笔记是冻结快照；本 Skill 的示例故意引用泄漏措辞作为校准材料，只作证据看待。
- **大小写要匹配意图。** 英文模式加 `-i`，让句首大写的 “This PR adds…”、“Probably fine…” 也能命中；纯代码形态的模式（`\bT\d\b`、`\bP-I\b`）保持大小写敏感，否则会变成噪声。
- **用完整短语限界。** `\bthis PR\b` 不应命中 “this project”“this process”“this provider”。
- **先校准再相信结果。** 零命中不能证明干净，除非该模式能命中一个已知正例；噪声大的模式不能证明有问题，除非它至少排除一个近似的反例。例如用存量段落里的 `used to` 作正例，用 `the key used to sign requests`（工具性用法）作反例。
- **中英文各跑一遍。** 正文以中文为主时，泄漏常以英文过程短语混入（`used to`、`plan §`、`TODO`），也可能以中文变更叙述出现（“不再”“本次”“已改为”）；中文探针同时用于发现英文正文或英文注释里的中文残留。

## 英文探针

```sh
# 设计过程引用、草稿章节与阶段标签
rg -n --hidden '\(decision \d|\(audit [A-Z]\d|design §|plan §|\bP-I\b|\bT\d\b|\bW\d\b' docs .agents README.md AGENTS.md template --glob '!.agents/notes/archived/**' --glob '!.agents/skills/trim-cot-leakage/**'

# 分支、提交与评审视角
rg -n --hidden -i '\bthis PR\b|\bthis branch\b|\bthis stack\b|\blater PRs?\b|\bprevious commits?\b|\bthis commit\b|\breview round\b|\breviewer\b|rejected in review|as of v\d' docs .agents README.md AGENTS.md template --glob '!.agents/notes/archived/**' --glob '!.agents/skills/trim-cot-leakage/**'

# 变更叙述与版本印章
rg -n --hidden -i '\bused to\b|\bno longer\b|\bpreviously\b|\bthe old\b|\bwas renamed\b|\bwas moved\b|\bthis cut\b|\bcut \d|\bv1\b|\btoday\b|\bfor now\b|roadmap' docs .agents README.md AGENTS.md template --glob '!.agents/notes/archived/**' --glob '!.agents/skills/trim-cot-leakage/**'

# 面向评审者的辩护、含糊措辞与延期标记
rg -n --hidden -i 'probably |should be enough|should suffice|it simply|is safe|for now|temporarily|\bTODO\b|\bFIXME\b' docs .agents README.md AGENTS.md template --glob '!.agents/notes/archived/**' --glob '!.agents/skills/trim-cot-leakage/**'
```

## 中文探针

```sh
# 变更叙述、设计引用、评审视角与规划残留
rg -n --hidden '不再|此前|以前|本次|这个版本|这版|已改为|上一?轮|评审中|评审(指出|要求|确认)|旧版|老的|暂时|本轮|计划(在|以后)|留给以后|审计 ?[A-Z]\d|方案 ?§|决策 ?\d' docs .agents README.md AGENTS.md template --glob '!.agents/notes/archived/**' --glob '!.agents/skills/trim-cot-leakage/**'

# 英文注释与英文正文里夹带的中文过程碎片
rg -n --hidden '设计稿|上一轮|评审|本次|已改为|不再|私有' --glob '*.{ts,tsx,js,jsx,mjs,cjs,py}' --glob '!node_modules/**' --glob '!.git/**' .
```

## 按表面复核

探针跑完后，按文字所在的表面补一轮定向阅读，因为同一句泄漏在不同位置的判断不同。

- **模块文档与 README。** 读“行为、配置、限制、失败”章节，确认没有把变更故事、评审结论或实现步骤写成契约；这些位置最常出现“本次”“不再”“已改为”。
- **公开 JSDoc 与注释。** 检查导出 API 是否缺少失败情形、错误类型、归属和时序；这类缺失不会命中任何探针。
- **Agent Note。** 在 `.agents/notes/implemented/` 下，`## Proposal`、`## Plan`、`## Acceptance criteria` 和迁移步骤属于计划语言；`## Alternatives considered` 中记录否决理由则是合法体裁。
- **Skill 文件。** 检查触发描述、工作流和示例里的目录、命令是否仍对应当前仓库；本 Skill 示例目录引用泄漏措辞，是校准材料，不是用法。
- **生成目录与归档笔记。** 生成的摘要、目录和快照是衍生产物，命中时去改源 JSDoc、模板或场景，再重新生成；归档笔记是冻结快照，不作为文字审计对象。

## 已知误报类别

以下命中在审计中通常应当保留；先用可解析性测试确认，再决定是否改写。

- **工具性的 “used to”。** “the key used to sign requests” 表示用途，不是时间；只有主语存在过去状态时才是变更叙述。中文“用来”“用于”同理。
- **运行时的旧/新状态。** “旧连接排空后，新连接才开始接受”描述切换期间同时存在的对象，不是仓库历史。
- **复盘里的“本次”“此前”。** 指事故时间线（“本次事件的触发点”“此前 10 分钟”），属于复盘体裁；指代码版本的“本次改动”才是泄漏。
- **`v1` 作为协议或路径片段。** `/v1/chat`、wire format 名称是标识符，不是版本印章。
- **有归属的 `§N`。** 外部标准（RFC 9110 §10.1.5）和拥有章节编号的已提交文档可以按节引用；只有未提交草稿的 § 编号不可解析。
- **`TODO` 与 `FIXME`。** 它们是延期的正规归属，不是残留；没有标记的“暂时”“应该够”才属于第 7 类。
- **项目口吻与体裁章节。** 复盘的事件序列、Agent Note 的 `## Alternatives considered` 中的“否决”都是正规写法，不是评审编排。
- **归档与生成内容。** 归档笔记是冻结历史；生成目录是衍生物。两者都不按普通文字审计，命中时转向其来源或跳过。
- **本 Skill 目录中的引文。** 示例文件与本文件引用泄漏措辞作校准，是证据而非用法；探针已排除该目录，人工阅读时也不要把它当成待修段落。

/**
 * 拒绝维护内容中对真实仓库提交的引用。历史应通过发布标签或
 * PR 编号引用，而不是提交标识符，因为标签和 PR 编号在
 * 历史重写后仍然有意义。十六进制串仅当本地 Git 对象
 * 数据库将其解析为恰好一个类型为 `commit` 的对象时，
 * 才计为提交引用，因此摘要、大小和纯十进制串从不触发
 * 该门禁。冻结历史 `.agents/notes/archived/`、
 * 第三方来源 `vendor/` 以及原始研究输入 `研发输入/` 被排除：
 * 原始材料保留其外部标识符，
 * 而不是为维护门禁而改写。
 */

import { execFileSync } from 'node:child_process'
import { lstatSync, readFileSync, readlinkSync } from 'node:fs'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')

// 至少包含一个十六进制字母的十六进制串；纯十进制串会与
// 大小、计数和版本组成部分冲突。
const commitCandidate = /(?<![a-z0-9])(?=[\da-f]{0,39}[a-f])[\da-f]{7,40}(?![a-z0-9])/gi
const excludedPrefixes = ['vendor/', '.agents/notes/archived/', '研发输入/']
const gitOutputLimit = 64 * 1024 * 1024
// 每个对象一行 41 字节；120 万个对象约产生 49 MiB。
const objectListingLimit = 1024 * 1024 * 1024

/** 维护源文件中一处被禁止的提交引用。 */
export interface RepositoryReference {
  /** 仓库相对路径，使用正斜杠。 */
  file: string
  /** 包含该引用的 1 基源文件行号。 */
  line: number
  /** 匹配到的十六进制标识符，已转小写。 */
  ref: string
}

/** 路径是维护中的文本，而不是第三方或冻结历史。 */
function isMaintained(file: string): boolean {
  const path = file.replaceAll('\\', '/')
  return !excludedPrefixes.some(prefix => path.startsWith(prefix))
}

/**
 * 依据已知提交标识符检查一个维护源文件。
 * @param file - 用于诊断和排除的仓库相对路径。
 * @param source - 文件文本或符号链接存储的目标。
 * @param commits - 命名提交对象的小写、无歧义标识符。
 * @returns 每个违规标识符和行号对应一条发现，按源文件顺序。
 */
export function findRepositoryReferences(
  file: string,
  source: string,
  commits: ReadonlySet<string>,
): RepositoryReference[] {
  if (!isMaintained(file)) return []
  const references: RepositoryReference[] = []
  for (const [index, line] of source.split('\n').entries()) {
    const seen = new Set<string>()
    for (const match of line.matchAll(commitCandidate)) {
      const ref = match[0].toLowerCase()
      if (!commits.has(ref) || seen.has(ref)) continue
      seen.add(ref)
      references.push({ file, line: index + 1, ref })
    }
  }
  return references
}

/** 读取已跟踪和未被忽略的新增维护文件，跟随符号链接到其存储目标。 */
function readMaintainedFiles(repoRoot: string): Map<string, string> {
  const files = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', '-z'], {
    cwd: repoRoot,
    encoding: 'utf8',
    maxBuffer: gitOutputLimit,
  }).split('\0').filter(file => file !== '' && isMaintained(file))
  const sources = new Map<string, string>()
  for (const file of files) {
    const path = resolve(repoRoot, file)
    const stat = lstatSync(path, { throwIfNoEntry: false })
    if (stat?.isSymbolicLink() === true) sources.set(file, readlinkSync(path))
    else if (stat?.isFile() === true) sources.set(file, readFileSync(path, 'utf8'))
  }
  return sources
}

/** 运行一条 Git 命令，返回以换行分隔的名称。 */
function gitLines(repoRoot: string, args: readonly string[], maxBuffer: number, input?: string): string[] {
  const output = execFileSync('git', args, {
    cwd: repoRoot,
    env: { ...process.env, GIT_NO_LAZY_FETCH: '1' },
    encoding: 'utf8',
    input,
    maxBuffer,
    stdio: ['pipe', 'pipe', 'pipe'],
  }).trimEnd()
  return output === '' ? [] : output.split('\n')
}

/**
 * 找出名称以某前缀开头的唯一对象。
 * @param objects - 本地对象数据库中的全部对象名称，已排序。
 * @param prefix - 小写十六进制前缀。
 * @returns 匹配的对象名称；没有或多个匹配时为 `undefined`。
 */
export function uniquePrefixMatch(objects: readonly string[], prefix: string): string | undefined {
  let low = 0
  let high = objects.length
  while (low < high) {
    const middle = (low + high) >>> 1
    if ((objects[middle] ?? prefix) < prefix) low = middle + 1
    else high = middle
  }
  const match = objects[low]
  if (match?.startsWith(prefix) !== true || objects[low + 1]?.startsWith(prefix) === true) return undefined
  return match
}

/**
 * 用本地对象数据库解析维护源文件中的提交标识符候选。
 * @param repoRoot - 检查其 Git 对象的工作树。
 * @param sources - 用于提取候选的文件文本或符号链接目标。
 * @returns 恰好命名一个可用 commit 类型对象的小写候选。
 */
export function repositoryCommits(repoRoot: string, sources: Iterable<string>): Set<string> {
  const candidates = [...new Set([...sources].flatMap(source =>
    [...source.matchAll(commitCandidate)].map(match => match[0].toLowerCase())))]
  if (candidates.length === 0) return new Set()
  // Git 会在所有可用对象（包括不可达和备用对象）中解析前缀；
  // 一次列出这些对象即可替代为每个候选执行一次 Git 前缀查找。
  // 有歧义的前缀无法确定一个对象，也不能构成提交引用。
  const objects = gitLines(repoRoot, ['cat-file', '--batch-all-objects', '--batch-check=%(objectname)'], objectListingLimit).sort()
  const matches = new Map<string, string>()
  for (const candidate of candidates) {
    const object = uniquePrefixMatch(objects, candidate)
    if (object !== undefined) matches.set(candidate, object)
  }
  if (matches.size === 0) return new Set()
  const matched = [...new Set(matches.values())]
  const commits = new Set(gitLines(repoRoot, ['cat-file', '--batch-check=%(objectname) %(objecttype)'], gitOutputLimit, `${matched.join('\n')}\n`)
    .map(line => line.split(' '))
    .filter(([, type]) => type === 'commit')
    .map(([object]) => object))
  return new Set([...matches].filter(([, object]) => commits.has(object)).map(([candidate]) => candidate))
}

/**
 * 仅使用本地 Git 对象数据库扫描已跟踪和未被忽略的新增文件。
 * @param repoRoot - 检查其文件和 Git 对象的工作树。
 * @returns 排除 vendor 和冻结 Agent Notes 后的禁止引用；缺失的浅历史对象无法匹配。
 */
export function scanRepositoryReferences(repoRoot: string): RepositoryReference[] {
  const sources = readMaintainedFiles(repoRoot)
  const commits = repositoryCommits(repoRoot, sources.values())
  return [...sources].flatMap(([file, source]) => findRepositoryReferences(file, source, commits))
}

const invokedPath = process.argv[1]
if (invokedPath !== undefined && import.meta.filename === resolve(invokedPath)) {
  const references = scanRepositoryReferences(root)
  if (references.length === 0) {
    console.log('verify-repository-references: maintained files cite no commit identifiers; history references use tags or PR numbers.')
  } else {
    console.error('verify-repository-references: history references must use a release tag or PR number, not a commit identifier:')
    for (const { file, line, ref } of references) console.error(`  ${file}:${String(line)}  ${ref}`)
    process.exitCode = 1
  }
}

/** 共用的仓库文件发现与按行引用扫描。 */

import { existsSync, readdirSync, readFileSync, realpathSync, statSync } from 'node:fs'
import type { Dirent } from 'node:fs'
import { join, relative, resolve, sep } from 'node:path'

/** 指定工作树及其 .git（含 worktree 的 gitfile），不向父目录查找仓库。 */
export function gitRootArgs(root: string): string[] {
  return ['--git-dir', resolve(root, '.git'), '--work-tree', root, '-C', root]
}

/** 一个原始路径及其用于符号链接去重的规范目标。 */
export interface RepoFile {
  /** 被调用方 glob 匹配到的绝对路径。 */
  abs: string
  /** 仅用于去重的绝对规范路径。 */
  real: string
}

/** 规范化之前的一次遍历匹配。 */
interface GlobMatch {
  /** 仓库相对的正斜杠路径。 */
  path: string
  /** 仅当匹配项是完全经由真实目录到达的普通文件时才为 false。 */
  viaSymlink: boolean
}

/** 一条被拒绝的按行仓库引用。 */
export interface ReferenceViolation {
  /** 包含该引用的仓库相对文件。 */
  file: string
  /** 包含该引用的行号，从 1 开始。 */
  line: number
  /** 规范化后的引用文本。 */
  ref: string
}

/** 判断仓库路径是否是已冻结的 Agent Note 历史，而非仍在演进的源码散文。 */
export function isArchivedAgentNotePath(path: string): boolean {
  return path.replaceAll('\\', '/').startsWith('.agents/notes/archived/')
}

/**
 * 判断模式中的一个片段是否匹配目录名或文件名。片段内支持 `*` 和
 * `?`，并沿用 node glob 的 `dot: false` 语义：首字符为通配符的片段
 * 不匹配点开头的名字。`**` 由遍历器按整个片段处理，
 * 不会进入这里。
 */
function segmentMatches(pattern: string, name: string): boolean {
  if (name.startsWith('.') && (pattern.startsWith('*') || pattern.startsWith('?'))) return false
  let expression = ''
  for (const character of pattern) {
    if (character === '*') expression += '.*'
    else if (character === '?') expression += '.'
    else expression += character.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  }
  return new RegExp(`^${expression}$`).test(name)
}

/**
 * 拒绝遍历器未建模的 glob 语法。Node 的 `fs.glob` 支持
 * 字符类、花括号交替和扩展 glob；把它们当作字面量静默展开
 * 会匹配不到任何内容，从而悄悄缩小门禁的语料，
 * 因此使用这些语法的模式片段会显式失败。纯字面量
 * 片段同样不得包含被拒绝的元字符，
 * 即使 node glob 会把它们读作字面量。
 */
const UNSUPPORTED_GLOB = /[[\]{}()!+@\\]/

function assertSupportedSegment(segment: string): void {
  if (UNSUPPORTED_GLOB.test(segment)) {
    throw new TypeError(`repo-files walker does not model glob syntax in segment: ${segment}`)
  }
}

/**
 * 遍历 `root` 匹配一个仓库相对 glob，不使用 node 的 `fs.glob`。
 * 仓库自带遍历器，是因为 node 内部 glob 从某些
 * 24.x 版本起，在展开 `**` 时会 lstat 探测 `<matched>/<next segment>`，
 * 对符号链接文件抛出 ENOTDIR 而不是跳过（在
 * node 24.13.0 上展开 `**` 跨过一个符号链接 Markdown 文件时观察到）。遍历器
 * 依据 dirent 类型和 stat 结果判断是否目录，从不在
 * 文件之下的路径上做探测，因此同一棵树在每个 node
 * 版本上枚举结果一致。
 *
 * 片段语义：字面量片段通过 `stat` 解析，因此指向符号链接目录的
 * 字面量会像 node glob 那样进入该目录，
 * 包括在多个片段中重复出现的字面量——node glob 每次都会
 * 解析它；通配符片段和 `**` 通过 dirent
 * 类型解析，因此从不进入符号链接目录，也从不匹配点开头的
 * 名字。node 仅为 `**` 展开记录 `follow: false`，所以
 * 通配符一侧的行为是遍历器自身的约定，而不是
 * 跨 node 版本的保证；使用方门禁的当前模式中
 * 没有覆盖符号链接目录的通配符片段，因此语料不变。`**` 跨越零个或多个
 * 目录。最后一段匹配文件和符号链接；损坏或
 * 成环的符号链接随后会在调用方的 realpathSync 中显式失败，而不是
 * 缩小扫描语料；而字面量非末段之下的损坏符号链接
 * 匹配不到任何内容，同样与 node glob 一致。遍历
 * 在没有已访问集合的情况下终止：每个字面量片段每次递归消耗一个模式
 * 片段，`**` 只递归进入真实目录，这些目录
 * 构成有限树，因为它从不展开符号链接目录。
 * 模式片段支持 `*`、`?`，以及不包含
 * `[]{}()!+@\` 中任何字符的字面量；其他 node-glob 语法，包括结尾的 `**`、`..` 和
 * 空片段，都会在最前面显式拒绝，而 `.` 片段会
 * 像 node glob 规范化时那样被折叠掉。目录列表来自
 * `listDirectory`，调用方在各模式间共享它，使每个目录
 * 只读取一次。`skipDirectory` 返回 true 的目录永不
 * 进入。返回仓库相对的正斜杠路径，已排序，每项都标记
 * `viaSymlink`，除非它指向仅通过真实目录到达的普通
 * 文件。
 */
function expandGlob(
  root: string,
  pattern: string,
  listDirectory: (dirAbs: string) => readonly Dirent[],
  skipDirectory: (relativeDirectory: string) => boolean,
): GlobMatch[] {
  const segments: string[] = []
  for (const segment of pattern.split('/')) {
    if (segment === '.') {
      // node glob 会把 `.` 片段规范化掉；这里丢弃它，
      // 让 `./README.md` 和 `a/./b` 的匹配结果与 node glob 完全一致，
      // 而不是静默地匹配不到任何内容。
      continue
    }
    if (segment === '..') {
      // `..` 片段会逸出扫描根目录，并与 `**` 产生
      // node glob 特殊处理过的交互；没有门禁模式使用它，因此遍历器
      // 显式拒绝这种形式，而不是静默地匹配不到任何内容。
      throw new TypeError(`repo-files walker does not model .. segments in pattern: ${pattern}`)
    }
    if (segment === '') {
      // 开头、连续或结尾的斜杠会产生空片段，
      // 它永远匹配不到任何条目；node glob 会容忍这种形式，因此
      // 遍历器必须显式拒绝，而不是静默返回空结果。
      throw new TypeError(`repo-files walker does not model empty segments in pattern: ${pattern}`)
    }
    segments.push(segment)
  }
  if (segments.length === 0) {
    throw new TypeError(`repo-files walker does not model a pattern with no segments: ${pattern}`)
  }
  for (const segment of segments) {
    if (segment !== '**') assertSupportedSegment(segment)
  }
  // 结尾的 `**` 会匹配前缀之下的文件、目录和符号链接；
  // 遍历器只把 `**` 建模为跨越目录的片段，因此
  // 必须显式拒绝这种形式，而不是静默返回空结果。
  if (segments[segments.length - 1] === '**') {
    throw new TypeError(`repo-files walker does not model a trailing ** segment in pattern: ${pattern}`)
  }
  const out: GlobMatch[] = []

  const visit = (dirAbs: string, dirRel: string, index: number, viaSymlink: boolean): void => {
    if (index >= segments.length) return
    if (segments[index] !== '**') {
      visitSegment(dirAbs, dirRel, index, viaSymlink)
      return
    }
    // 这里的 `**` 消耗零个目录，并在每次递归中消耗一个目录。
    visitSegment(dirAbs, dirRel, index + 1, viaSymlink)
    for (const entry of listDirectory(dirAbs)) {
      if (entry.name.startsWith('.') || !entry.isDirectory()) continue
      const childRel = dirRel === '.' ? entry.name : `${dirRel}/${entry.name}`
      if (skipDirectory(childRel)) continue
      visit(join(dirAbs, entry.name), childRel, index, viaSymlink)
    }
  }

  const visitSegment = (dirAbs: string, dirRel: string, index: number, viaSymlink: boolean): void => {
    if (index >= segments.length) return
    const segment = segments[index]
    if (segment === undefined) return
    if (segment === '**') {
      visit(dirAbs, dirRel, index, viaSymlink)
      return
    }
    const last = index === segments.length - 1
    for (const entry of listDirectory(dirAbs)) {
      if (!segmentMatches(segment, entry.name)) continue
      const childAbs = join(dirAbs, entry.name)
      const childRel = dirRel === '.' ? entry.name : `${dirRel}/${entry.name}`
      if (last) {
        // 文件和符号链接都会匹配；损坏或成环的符号链接随后
        // 会像 node glob 那样在调用方的 realpathSync 中显式失败，
        // 而不是悄悄缩小扫描语料。
        if (entry.isFile() || entry.isSymbolicLink()) {
          out.push({ path: childRel, viaSymlink: viaSymlink || !entry.isFile() })
        }
        continue
      }
      if (entry.isDirectory()) {
        if (!skipDirectory(childRel)) visitSegment(childAbs, childRel, index + 1, viaSymlink)
        continue
      }
      // 字面量非末段像 node glob 一样通过 stat 解析，
      // 因此会进入符号链接目录；通配符片段从不进入
      // 这个分支，因为它们在上面的逻辑中按 dirent 类型匹配。
      if (!entry.isSymbolicLink() || hasWildcard(segment)) continue
      let target: ReturnType<typeof statSync>
      try {
        target = statSync(childAbs)
      } catch {
        // 字面量片段之下的损坏符号链接匹配不到任何内容，
        // 与 node glob 对它静默返回无匹配一致。
        continue
      }
      if (!target.isDirectory() || skipDirectory(childRel)) continue
      visitSegment(childAbs, childRel, index + 1, true)
    }
  }

  visit(root, '.', 0, false)
  return out.sort((left, right) => left.path < right.path ? -1 : left.path > right.path ? 1 : 0)
}

/** 判断模式片段是否包含 `*` 或 `?`，从而属于通配符片段。 */
function hasWildcard(segment: string): boolean {
  return segment.includes('*') || segment.includes('?')
}

/**
 * 展开仓库相对的 glob 并对符号链接文件去重。
 * 每次调用中每个目录最多列出一次，并在各模式间共享。
 * 仅通过真实目录到达的普通文件会规范化为
 * `realpathSync(root)` 与其相对路径的拼接；其他每个匹配项都走
 * `realpathSync`，因此损坏或成环的符号链接仍会抛出。
 * @param root - 仓库根目录的绝对路径。
 * @param patterns - 仓库相对的 glob 模式，按顺序处理。
 * @param isExcluded - 可选，对每个匹配到的相对路径求值的排除谓词。
 * @param skipDirectory - 可选，在遍历器列出每个仓库相对目录之前对其求值的谓词；
 *   仅当该目录之下的每个路径都满足 `isExcluded` 时才返回 true。
 * @returns 按稳定首见顺序排列的匹配文件。
 */
export function uniqueRepoFiles(
  root: string,
  patterns: readonly string[],
  isExcluded: (relativePath: string) => boolean = () => false,
  skipDirectory: (relativeDirectory: string) => boolean = () => false,
): RepoFile[] {
  const listings = new Map<string, readonly Dirent[]>()
  const listDirectory = (dirAbs: string): readonly Dirent[] => {
    let entries = listings.get(dirAbs)
    if (entries === undefined) {
      entries = readdirSync(dirAbs, { withFileTypes: true })
      listings.set(dirAbs, entries)
    }
    return entries
  }
  let realRoot: string | undefined
  const seen = new Set<string>()
  const files: RepoFile[] = []
  for (const pattern of patterns) {
    for (const { path: repoPath, viaSymlink } of expandGlob(root, pattern, listDirectory, skipDirectory)) {
      if (isExcluded(repoPath)) continue
      const abs = resolve(root, repoPath)
      const real = viaSymlink ? realpathSync(abs) : join(realRoot ??= realpathSync(root), repoPath)
      if (seen.has(real)) continue
      seen.add(real)
      files.push({ abs, real })
    }
  }
  return files
}

/**
 * 逐行扫描正则匹配，返回被调用方谓词判定为拒绝的
 * 规范化匹配项。
 * @param root - 用于生成违规路径的仓库根目录绝对路径。
 * @param absPath - 待扫描文本文件的绝对路径。
 * @param pattern - 对每一行独立匹配的全局正则。
 * @param normalize - 把原始正则文本映射为门禁评估的引用。
 * @param isViolation - 规范化后的引用无效时返回 true。
 * @param excludedRange - 可选，选取一个从 0 开始、右端不含的行区间不做扫描。
 * @returns 按源顺序排列的每条被拒绝引用。
 */
export function findReferenceViolations(
  root: string,
  absPath: string,
  pattern: RegExp,
  normalize: (raw: string) => string,
  isViolation: (ref: string) => boolean,
  excludedRange?: (file: string, source: string) => readonly [number, number] | undefined,
): ReferenceViolation[] {
  const file = relative(root, absPath).split(sep).join('/')
  const out: ReferenceViolation[] = []
  const source = readFileSync(absPath, 'utf8')
  const lines = source.split('\n')
  const excluded = excludedRange?.(file, source)
  for (let i = 0; i < lines.length; i++) {
    if (excluded !== undefined && i >= excluded[0] && i < excluded[1]) continue
    const line = lines[i]
    if (line === undefined) continue
    for (const match of line.matchAll(pattern)) {
      const ref = normalize(match[0])
      if (isViolation(ref)) out.push({ file, line: i + 1, ref })
    }
  }
  return out
}

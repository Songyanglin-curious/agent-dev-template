/** 文档结构门禁共用的解析辅助函数。 */

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { JSON_SCHEMA, load } from 'js-yaml'
import { isArchivedAgentNotePath, uniqueRepoFiles } from './repo-files.ts'

/** 所有引入本模块的门禁所使用的仓库根目录。 */
export const REPO_ROOT = resolve(import.meta.dirname, '..')

/** 解析后的 YAML frontmatter 及其后面的 Markdown 正文。 */
export interface DocumentFrontmatter {
  /** YAML 映射中的值。 */
  data: Record<string, unknown>
  /** 结束分隔符之后的源文本。 */
  body: string
  /** 结束分隔符所在行，行号从 1 开始。 */
  endLine: number
}

/**
 * 从 Markdown 源文本中解析 YAML frontmatter。
 * @param source - 待解析的 Markdown 文本。
 * @returns frontmatter 映射与正文；不存在 frontmatter 时返回 undefined。
 * @throws 当分隔符已打开却未闭合，或取到的值不是映射时抛出。
 */
export function parseDocumentFrontmatter(source: string): DocumentFrontmatter | undefined {
  const lines = source.replaceAll('\r\n', '\n').split('\n')
  if (lines[0]?.trim() !== '---') return undefined
  const end = lines.indexOf('---', 1)
  if (end < 0) throw new Error('frontmatter is not closed')
  const value = load(lines.slice(1, end).join('\n'), { schema: JSON_SCHEMA })
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('frontmatter must be a YAML mapping')
  }
  return { data: value as Record<string, unknown>, body: lines.slice(end + 1).join('\n'), endLine: end + 1 }
}

/** 围栏代码块之外的一个 Markdown 标题。 */
export interface DocumentHeading {
  /** 标题层级，取值为 1 到 6。 */
  depth: number
  /** 渲染后的标题文本，不含开头的井号。 */
  text: string
  /** 源行号，从 1 开始。 */
  line: number
}

/** 返回一行中用于打开或关闭围栏代码块的标记。 */
function fenceDelimiter(line: string): string | undefined {
  const match = /^\s*(`{3,}|~{3,})/.exec(line)
  return match?.[1]
}

/**
 * 返回每一行源文本及其围栏代码块状态。
 * @param source - 待扫描的 Markdown 文本。
 * @returns 行文本、从 1 开始的行号，以及该行是否位于围栏内。
 */
export function proseLines(source: string): { text: string; line: number }[] {
  const out: { text: string; line: number }[] = []
  let fence: string | undefined
  const lines = source.split('\n')
  for (let index = 0; index < lines.length; index += 1) {
    const text = lines[index] ?? ''
    const delimiter = fenceDelimiter(text)
    if (fence === undefined) {
      if (delimiter !== undefined) {
        fence = delimiter
        continue
      }
      out.push({ text, line: index + 1 })
      continue
    }
    if (delimiter !== undefined && delimiter[0] === fence[0] && delimiter.length >= fence.length) {
      fence = undefined
    }
  }
  return out
}

/**
 * 返回围栏代码块之外的每个 ATX 标题。
 * @param source - 待扫描的 Markdown 文本。
 * @returns 按文档顺序排列的标题。
 */
export function documentHeadings(source: string): DocumentHeading[] {
  const headings: DocumentHeading[] = []
  for (const { text, line } of proseLines(source)) {
    const match = /^(#{1,6})\s+(.*)$/.exec(text)
    if (match === null) continue
    headings.push({ depth: match[1]?.length ?? 0, text: (match[2] ?? '').trim(), line })
  }
  return headings
}

/**
 * 返回某个二级标题的小节正文，不含该标题本身及下一个二级标题。
 * @param source - 待检查的 Markdown 文本。
 * @param heading - 要查找的标题精确文本，不含开头的井号。
 * @returns 小节正文；不存在匹配的二级标题时返回 undefined。
 */
export function h2Section(source: string, heading: string): string | undefined {
  const lines = source.split('\n')
  const headings = documentHeadings(source)
  const start = headings.findIndex(candidate => candidate.depth === 2 && candidate.text === heading)
  if (start < 0) return undefined
  const startLine = headings[start]?.line ?? 0
  const next = headings.slice(start + 1).find(candidate => candidate.depth <= 2)
  const endLine = next === undefined ? lines.length : next.line - 1
  return lines.slice(startLine, endLine).join('\n')
}

/** 围栏代码块之外的一个 Markdown 链接。 */
export interface DocumentLink {
  /** 链接标签文本。 */
  text: string
  /** 按原样书写的目标地址，不含两侧的尖括号。 */
  url: string
  /** 源行号，从 1 开始。 */
  line: number
}

/**
 * 返回围栏代码块之外的每个 Markdown 链接。
 * 图片链接也在其中；调用方按目标地址过滤。
 * @param source - 待扫描的 Markdown 文本。
 * @returns 按文档顺序排列的链接。
 */
export function documentLinks(source: string): DocumentLink[] {
  const links: DocumentLink[] = []
  for (const { text, line } of proseLines(source)) {
    for (const match of text.matchAll(/!?\[([^\]]*)\]\(\s*([^)\s]+)(?:\s+"[^"]*")?\s*\)/gu)) {
      links.push({ text: match[1] ?? '', url: match[2] ?? '', line })
    }
  }
  return links
}

/** Markdown 表格中的一行。 */
export interface TableRow {
  /** 源行号，从 1 开始。 */
  line: number
  /** 单元格文本，不含两侧的竖线或填充空白。 */
  cells: string[]
}

/**
 * 从 Markdown 片段中解析表格行，跳过表头分隔行。
 * @param source - 包含表格的 Markdown 片段。
 * @param firstLine - `source` 在其文档中的行号，从 1 开始。
 * @returns 数据行；表头行与分隔行不在其中。
 */
export function tableRows(source: string, firstLine = 1): TableRow[] {
  const rows: TableRow[] = []
  const lines = source.split('\n')
  let headerSkipped = false
  for (let index = 0; index < lines.length; index += 1) {
    const text = lines[index] ?? ''
    if (!text.trimStart().startsWith('|')) continue
    if (/^\s*\|?[\s:|-]+\|?\s*$/.test(text)) continue
    if (!headerSkipped) {
      headerSkipped = true
      continue
    }
    const cells = text.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map(cell => cell.trim())
    rows.push({ line: firstLine + index, cells })
  }
  return rows
}

/**
 * 结构门禁检查的受维护 Markdown 源。`**` 模式不会进入点目录，
 * 因此用显式的 `.agents` 模式覆盖 Note 与 Skill；
 * `**\/README.md` 把与代码相邻的模块文档
 * 也纳入同一组链接、换行和生成区域检查。
 */
const MAINTAINED_MARKDOWN_PATTERNS = [
  'README.md',
  'AGENTS.md',
  'docs/**/*.md',
  '.agents/notes/**/*.md',
  '.agents/skills/**/*.md',
  '**/README.md',
]

/** 其内容不算 Markdown 门禁受维护散文的目录。 */
function skipUnauthoredDirectory(relativeDirectory: string): boolean {
  const path = relativeDirectory.replaceAll('\\', '/')
  return path.split('/').includes('node_modules')
    || path === '研发输入'
    || path.startsWith('研发输入/')
}

/**
 * 发现结构门禁使用的仓库相对 Markdown 源。
 * 已冻结的 Agent Note、`node_modules/`和研发输入
 * 不作为源；活动文档仍可以链接到它们。
 * @returns 相对于仓库根目录的正斜杠路径，已排序。
 */
export function markdownSourcePaths(): string[] {
  return uniqueRepoFiles(
    REPO_ROOT,
    MAINTAINED_MARKDOWN_PATTERNS,
    path => isArchivedAgentNotePath(path.replaceAll('\\', '/')),
    skipUnauthoredDirectory,
  ).map(file => repositoryRelative(file.abs))
}

/**
 * 发现匹配给定 glob 模式的仓库 Markdown 文件。
 * @param patterns - 仓库相对的 glob 模式。
 * @returns 仓库相对的正斜杠路径。
 */
export function repositoryMarkdownFiles(patterns: readonly string[]): string[] {
  return uniqueRepoFiles(REPO_ROOT, patterns, isArchivedAgentNotePath, skipUnauthoredDirectory)
    .map(file => repositoryRelative(file.abs))
}

/** 以 UTF-8 读取一个仓库相对文件。 */
export function readRepositoryFile(relativePath: string): string {
  return readFileSync(resolve(REPO_ROOT, relativePath), 'utf8')
}

/** 把路径规范化为仓库相对的正斜杠形式。 */
export function repositoryRelative(absolutePath: string): string {
  return absolutePath.replaceAll('\\', '/').replace(`${REPO_ROOT.replaceAll('\\', '/')}/`, '')
}

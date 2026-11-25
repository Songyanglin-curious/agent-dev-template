/** Shared parsing helpers for documentation-structure gates. */

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { JSON_SCHEMA, load } from 'js-yaml'
import { isArchivedAgentNotePath, uniqueRepoFiles } from './repo-files.ts'

/** Repository root for every gate that imports this module. */
export const REPO_ROOT = resolve(import.meta.dirname, '..')

/** Parsed YAML frontmatter plus the Markdown body that follows it. */
export interface DocumentFrontmatter {
  /** YAML mapping values. */
  data: Record<string, unknown>
  /** Source after the closing delimiter. */
  body: string
  /** 1-based line of the closing delimiter. */
  endLine: number
}

/**
 * Parse YAML frontmatter from a Markdown source.
 * @param source - Markdown text to parse.
 * @returns the frontmatter mapping and body, or undefined when no frontmatter exists.
 * @throws when a delimiter is opened but not closed, or the value is not a mapping.
 */
export function parseDocumentFrontmatter(source: string): DocumentFrontmatter | undefined {
  const lines = source.split('\n')
  if (lines[0]?.trim() !== '---') return undefined
  const end = lines.indexOf('---', 1)
  if (end < 0) throw new Error('frontmatter is not closed')
  const value = load(lines.slice(1, end).join('\n'), { schema: JSON_SCHEMA })
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('frontmatter must be a YAML mapping')
  }
  return { data: value as Record<string, unknown>, body: lines.slice(end + 1).join('\n'), endLine: end + 1 }
}

/** One Markdown heading outside fenced code. */
export interface DocumentHeading {
  /** Heading depth, 1 through 6. */
  depth: number
  /** Rendered heading text without the leading hashes. */
  text: string
  /** 1-based source line. */
  line: number
}

/** Whether a line opens or closes a fenced code block. */
function fenceDelimiter(line: string): string | undefined {
  const match = /^\s*(`{3,}|~{3,})/.exec(line)
  return match?.[1]
}

/**
 * Return each source line with its fenced-code status.
 * @param source - Markdown text to scan.
 * @returns line text, 1-based line number, and whether the line is inside a fence.
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
 * Return every ATX heading outside fenced code.
 * @param source - Markdown text to scan.
 * @returns headings in document order.
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
 * Return one H2 section body, excluding its heading and the next H2.
 * @param source - Markdown text to inspect.
 * @param heading - exact heading text to find, without leading hashes.
 * @returns the section body, or undefined when no matching H2 exists.
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

/** One Markdown link outside fenced code. */
export interface DocumentLink {
  /** Link label text. */
  text: string
  /** Destination as authored, without surrounding angle brackets. */
  url: string
  /** 1-based source line. */
  line: number
}

/**
 * Return every Markdown link outside fenced code.
 * Images are included; callers filter by destination.
 * @param source - Markdown text to scan.
 * @returns links in document order.
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

/** One Markdown table row. */
export interface TableRow {
  /** 1-based source line. */
  line: number
  /** Cell text without surrounding pipes or padding. */
  cells: string[]
}

/**
 * Parse table rows from a Markdown fragment, skipping the header separator.
 * @param source - Markdown fragment containing a table.
 * @param firstLine - 1-based line number of `source` in its document.
 * @returns data rows; header and separator rows are excluded.
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

/** Options for repository Markdown discovery. */
export interface MarkdownScanOptions {
  /** Skip the template deliverable tree. */
  excludeTemplate?: boolean
  /** Include frozen Agent Notes. */
  includeArchived?: boolean
}

/**
 * Maintained Markdown sources checked by the structure gates. `**` patterns do
 * not descend into dot directories, so the explicit `.agents` patterns cover
 * Notes and Skills; `**\/README.md` brings module docs that live next to code
 * into the same link, wrap, and generated-region checks.
 */
const MAINTAINED_MARKDOWN_PATTERNS = [
  'README.md',
  'AGENTS.md',
  'docs/**/*.md',
  '.agents/notes/**/*.md',
  '.agents/skills/**/*.md',
  '**/README.md',
]

/** Directories whose content is not maintained prose for Markdown gates. */
function skipUnauthoredDirectory(relativeDirectory: string): boolean {
  const path = relativeDirectory.replaceAll('\\', '/')
  return path === 'node_modules'
    || path.startsWith('node_modules/')
    || path === 'template'
    || path.startsWith('template/')
    || path === '研发输入'
    || path.startsWith('研发输入/')
}

/**
 * Discover repository-relative Markdown sources for the structure gates.
 * Frozen Agent Notes, `node_modules/`, the template deliverable, and research
 * inputs are excluded as sources; active documents may still link to them.
 * @returns forward-slash paths relative to the repository root, sorted.
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
 * Discover repository Markdown files matching the given glob patterns.
 * @param patterns - repository-relative glob patterns.
 * @param options - exclusion switches.
 * @returns repository-relative slash paths.
 */
export function repositoryMarkdownFiles(
  patterns: readonly string[],
  options: MarkdownScanOptions = {},
): string[] {
  const isExcluded = (path: string): boolean => {
    const normalized = path.replaceAll('\\', '/')
    if (normalized.includes('node_modules/')) return true
    if (options.excludeTemplate === true && normalized.startsWith('template/')) return true
    if (options.includeArchived !== true && isArchivedAgentNotePath(normalized)) return true
    return false
  }
  const skipDirectory = (relativeDirectory: string): boolean => {
    const normalized = relativeDirectory.replaceAll('\\', '/')
    if (normalized === 'node_modules' || normalized.startsWith('node_modules/')) return true
    if (normalized === '研发输入' || normalized.startsWith('研发输入/')) return true
    return options.excludeTemplate === true
      && (normalized === 'template' || normalized.startsWith('template/'))
  }
  return uniqueRepoFiles(REPO_ROOT, patterns, isExcluded, skipDirectory)
    .map(file => repositoryRelative(file.abs))
}

/** Read one repository-relative file as UTF-8. */
export function readRepositoryFile(relativePath: string): string {
  return readFileSync(resolve(REPO_ROOT, relativePath), 'utf8')
}

/** Normalize a path to repository-relative slash form. */
export function repositoryRelative(absolutePath: string): string {
  return absolutePath.replaceAll('\\', '/').replace(`${REPO_ROOT.replaceAll('\\', '/')}/`, '')
}

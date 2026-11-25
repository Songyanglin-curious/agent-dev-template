/**
 * Reject Markdown prose paragraphs spanning multiple physical lines. The GFM
 * AST distinguishes paragraphs—including those in lists and blockquotes—from
 * multiline structural nodes. The checker never rewrites; symlinked files are
 * deduped. YAML frontmatter is skipped before parsing; archived Agent Notes
 * are excluded as frozen history. The owning convention is the repository's
 * documentation standard.
 */

import { readFileSync } from 'node:fs'
import { relative, resolve, sep } from 'node:path'
import type { Nodes } from 'mdast'
import { parseMarkdown, visitMarkdown } from './markdown.ts'
import { isArchivedAgentNotePath, uniqueRepoFiles } from './repo-files.ts'

const root = resolve(import.meta.dirname, '..')

/**
 * Authored Markdown checked for hard-wrapped prose. Template deliverables stay
 * out of the gate until they are handled separately.
 */
const PATTERNS = [
  'README.md',
  'AGENTS.md',
  'docs/**/*.md',
  '.agents/notes/**/*.md',
  '.agents/skills/**/*.md',
]

/** A located hard-wrap: a prose paragraph spanning more than one source line. */
interface Violation {
  file: string
  /** 1-based line where the hard-wrapped paragraph starts. */
  line: number
  text: string
}

/**
 * Blank YAML frontmatter while preserving line numbers, so metadata never
 * parses as prose. A document that does not start with a `---` delimiter is
 * returned unchanged.
 * @param source - Markdown source whose frontmatter is masked.
 * @returns source with the same line count and every frontmatter line empty.
 */
function maskFrontmatter(source: string): string {
  const lines = source.split('\n')
  if (lines[0]?.trim() !== '---') return source
  const closing = lines.findIndex((line, index) => index > 0 && line.trim() === '---')
  if (closing === -1) return source
  for (let index = 0; index <= closing; index += 1) lines[index] = ''
  return lines.join('\n')
}

/** Find every hard-wrapped prose paragraph in one Markdown file via its AST. */
function findViolations(absPath: string): Violation[] {
  const file = relative(root, absPath).split(sep).join('/')
  const source = readFileSync(absPath, 'utf8')
  const rawLines = source.split('\n')
  const tree = parseMarkdown(maskFrontmatter(source))
  const out: Violation[] = []

  visitMarkdown(tree, (node: Nodes): boolean | void => {
    if (node.type === 'paragraph' && node.position) {
      const { start, end } = node.position
      if (end.line > start.line) {
        const firstLine = rawLines[start.line - 1] ?? ''
        out.push({ file, line: start.line, text: firstLine.trim() })
      }
      // Paragraph children are inline, so no further paragraph can be nested.
      return false
    }
  })
  return out
}

const files = uniqueRepoFiles(root, PATTERNS, isArchivedAgentNotePath)
const all = files.flatMap(file => findViolations(file.abs))
const checked = files.length

if (all.length === 0) {
  console.log(`verify-md-wrap: ${checked} file(s) checked, no hard-wrapped prose paragraphs.`)
  process.exit(0)
}

console.error('verify-md-wrap: hard-wrapped prose paragraphs found (write one physical line per paragraph):')
for (const v of all) {
  console.error(`  ${v.file}:${v.line}  ${v.text.slice(0, 80)}${v.text.length > 80 ? '…' : ''}`)
}
process.exit(1)

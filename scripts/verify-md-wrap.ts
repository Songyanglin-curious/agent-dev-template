/**
 * 拒绝跨多个物理行的 Markdown 散文段落。GFM AST 能区分
 * 段落（包括列表和块引用中的段落）与多行结构节点。
 * 检查器从不改写文件；符号链接文件会去重。
 * 解析前跳过 YAML frontmatter；归档的 Agent Note 作为
 * 冻结历史被排除在外。相关约定的归属方是仓库的
 * 文档标准。
 */

import { readFileSync } from 'node:fs'
import { relative, resolve, sep } from 'node:path'
import type { Nodes } from 'mdast'
import { markdownSourcePaths } from './doc-tooling.ts'
import { parseMarkdown, visitMarkdown } from './markdown.ts'

const root = resolve(import.meta.dirname, '..')

/** 一处定位到的硬换行：跨多个源码行的散文段落。 */
interface Violation {
  file: string
  /** 硬换行段落起始处、从 1 开始计数的行号。 */
  line: number
  text: string
}

/**
 * 清空 YAML frontmatter 同时保留行号，使元数据永远不会
 * 被当作散文解析。不以 `---` 分隔符开头的文档
 * 原样返回。
 * @param source - frontmatter 被遮蔽的 Markdown 源码。
 * @returns 行数相同、且每个 frontmatter 行都为空的原文本。
 */
function maskFrontmatter(source: string): string {
  const lines = source.split('\n')
  if (lines[0]?.trim() !== '---') return source
  const closing = lines.findIndex((line, index) => index > 0 && line.trim() === '---')
  if (closing === -1) return source
  for (let index = 0; index <= closing; index += 1) lines[index] = ''
  return lines.join('\n')
}

/** 通过 AST 找出单个 Markdown 文件中所有硬换行的散文段落。 */
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
      // 段落的子节点都是行内节点，因此不可能再嵌套段落。
      return false
    }
  })
  return out
}

const files = markdownSourcePaths().map(path => resolve(root, path))
const all = files.flatMap(file => findViolations(file))
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

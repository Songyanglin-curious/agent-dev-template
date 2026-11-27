/**
 * 校验模块组 README。每个模块组文档都必须带有一个
 * `## 模块与职责` 表格，其每一行链接到已存在的 `module`
 * 或嵌套的 `module-group` 文档；模块组文档不得包含
 * 归其模块所有的使用方式、行为契约、配置、已知限制
 * 与暂缓工作或内部设计等章节。
 */

import { existsSync } from 'node:fs'
import { dirname, relative, resolve, sep } from 'node:path'
import {
  documentHeadings,
  h2Section,
  parseDocumentFrontmatter,
  readRepositoryFile,
  REPO_ROOT,
  repositoryMarkdownFiles,
  tableRows,
} from './doc-tooling.ts'

const MODULE_SECTION = '模块与职责'
const FORBIDDEN_SECTIONS = new Set([
  '使用方式',
  '行为契约',
  '配置',
  '已知限制与暂缓工作',
  '内部设计',
])

const failures: string[] = []
let checked = 0

for (const file of repositoryMarkdownFiles(['**/README.md'], { excludeTemplate: true })) {
  const source = readRepositoryFile(file)
  const frontmatter = parseDocumentFrontmatter(source)
  if (frontmatter?.data.kind !== 'module-group') continue
  checked += 1

  const headings = documentHeadings(source)
  for (const heading of headings) {
    if (heading.depth === 2 && FORBIDDEN_SECTIONS.has(heading.text)) {
      failures.push(`${file}:${String(heading.line)}: module-group docs must not carry "## ${heading.text}"`)
    }
  }

  const sectionHeading = headings.find(heading => heading.depth === 2 && heading.text === MODULE_SECTION)
  if (sectionHeading === undefined) {
    failures.push(`${file}: missing ## ${MODULE_SECTION}`)
    continue
  }
  const section = h2Section(source, MODULE_SECTION) ?? ''
  const rows = tableRows(section, sectionHeading.line + 1)
  if (rows.length === 0) {
    failures.push(`${file}: ## ${MODULE_SECTION} needs at least one module row`)
    continue
  }

  const targets = new Set<string>()
  for (const row of rows) {
    const first = row.cells[0] ?? ''
    const links = [...first.matchAll(/\[[^\]]*\]\(([^)\s]+)\)/gu)]
    if (links.length !== 1) {
      failures.push(`${file}:${String(row.line)}: each row needs exactly one module link`)
      continue
    }
    const url = (links[0]?.[1] ?? '').replace(/[#?].*$/, '')
    if (url === '' || url.startsWith('#') || /^[a-z][a-z0-9+.-]*:/iu.test(url)) {
      failures.push(`${file}:${String(row.line)}: module link must be a relative path`)
      continue
    }
    const absolute = resolve(REPO_ROOT, dirname(file), url)
    if (!absolute.startsWith(REPO_ROOT + sep)) {
      failures.push(`${file}:${String(row.line)}: module link escapes the repository: ${url}`)
      continue
    }
    const target = relative(REPO_ROOT, absolute).replaceAll('\\', '/')
    if (!target.endsWith('.md')) {
      failures.push(`${file}:${String(row.line)}: module link must name a Markdown document: ${url}`)
      continue
    }
    if (!existsSync(absolute)) {
      failures.push(`${file}:${String(row.line)}: linked module document does not exist: ${target}`)
      continue
    }
    let targetKind: unknown
    try {
      targetKind = parseDocumentFrontmatter(readRepositoryFile(target))?.data.kind
    } catch (error) {
      failures.push(`${file}:${String(row.line)}: ${target} has unreadable frontmatter: ${error instanceof Error ? error.message : String(error)}`)
      continue
    }
    if (targetKind !== 'module' && targetKind !== 'module-group') {
      failures.push(`${file}:${String(row.line)}: ${target} must declare kind module or module-group`)
    }
    if (targets.has(target)) {
      failures.push(`${file}:${String(row.line)}: duplicate module row for ${target}`)
    }
    targets.add(target)
  }
}

if (failures.length > 0) {
  console.error('verify-module-groups: module-group violations found:')
  for (const failure of failures) console.error(`  ${failure}`)
  process.exit(1)
}
console.log(`verify-module-groups: ${String(checked)} module group doc(s) checked, all conform.`)

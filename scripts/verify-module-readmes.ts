/**
 * 校验模块与模块组 README：摘要保持在
 * 100 词当量的限制内，模块文档带有标准的限制
 * 章节（或理由充分的允许清单条目），而模块组文档
 * 省略归其模块所有的章节。识别依据是声明的
 * frontmatter `kind`，绝不使用目录名，因此模块
 * 边界始终是项目自己的决定。
 */

import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import {
  documentHeadings,
  h2Section,
  parseDocumentFrontmatter,
  readRepositoryFile,
  REPO_ROOT,
  repositoryMarkdownFiles,
} from './doc-tooling.ts'
import { countWordEquivalents } from './doc-units.ts'

const CANONICAL_LIMITATIONS = '已知限制与暂缓工作'
const SUMMARY_LIMIT = 100
const ALLOWLIST_PATH = 'scripts/module-readme-limitations.allowlist.json'

/** 有意不带限制章节的模块文档。 */
function readAllowlist(): Record<string, string> {
  const absolute = resolve(REPO_ROOT, ALLOWLIST_PATH)
  if (!existsSync(absolute)) return {}
  const parsed: unknown = JSON.parse(readFileSync(absolute, 'utf8'))
  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error(`${ALLOWLIST_PATH} must be a JSON object keyed by module README path`)
  }
  return parsed as Record<string, string>
}

const failures: string[] = []
let modules = 0
let groups = 0
const allowlist = readAllowlist()
const seen = new Set<string>()

for (const [path, reason] of Object.entries(allowlist)) {
  if (typeof reason !== 'string' || reason.trim().length === 0) {
    failures.push(`${ALLOWLIST_PATH}: ${path} needs a non-empty justification`)
  }
}

for (const file of repositoryMarkdownFiles(['**/README.md'], { excludeTemplate: true })) {
  const source = readRepositoryFile(file)
  const frontmatter = parseDocumentFrontmatter(source)
  const kind = frontmatter?.data.kind
  if (kind !== 'module' && kind !== 'module-group') continue
  seen.add(file)
  if (kind === 'module') modules += 1
  else groups += 1

  const headings = documentHeadings(source)
  const summary = h2Section(source, '摘要')
  if (summary === undefined) {
    failures.push(`${file}: 缺少 ## 摘要`)
  } else if (summary.trim().length === 0) {
    failures.push(`${file}: ## 摘要 为空`)
  } else {
    const words = countWordEquivalents(summary)
    if (words > SUMMARY_LIMIT) {
      failures.push(`${file}: 摘要为 ${String(words)} 个词等量，超过 ${String(SUMMARY_LIMIT)} 上限`)
    }
  }

  const limitationsLike = headings.filter(heading =>
    heading.depth === 2 && /限制|limitation|deferred work/iu.test(heading.text))
  if (kind === 'module-group') {
    for (const heading of limitationsLike) {
      failures.push(`${file}:${String(heading.line)}: module-group docs must not carry "${heading.text}"`)
    }
    continue
  }

  const variant = limitationsLike.find(heading => heading.text !== CANONICAL_LIMITATIONS)
  if (variant !== undefined) {
    failures.push(
      `${file}:${String(variant.line)}: use the canonical heading "## ${CANONICAL_LIMITATIONS}", not "${variant.text}"`,
    )
    continue
  }

  const allowlisted = Object.hasOwn(allowlist, file)
  const section = h2Section(source, CANONICAL_LIMITATIONS)
  if (allowlisted) {
    if (section !== undefined) {
      failures.push(`${file}: allowlisted as having no limitations, but carries ## ${CANONICAL_LIMITATIONS}`)
    }
    continue
  }
  if (section === undefined) {
    failures.push(`${file}: missing ## ${CANONICAL_LIMITATIONS}; add it or a justified allowlist entry`)
    continue
  }
  if (!/^- /mu.test(section)) {
    failures.push(`${file}: ## ${CANONICAL_LIMITATIONS} needs at least one top-level bullet`)
  }
}

for (const path of Object.keys(allowlist)) {
  if (!seen.has(path)) failures.push(`${ALLOWLIST_PATH}: ${path} no longer names a module doc; remove the stale entry`)
}

if (failures.length > 0) {
  console.error('verify-module-readmes: module documentation violations found:')
  for (const failure of failures) console.error(`  ${failure}`)
  process.exit(1)
}
console.log(
  `verify-module-readmes: ${String(modules)} module(s) and ${String(groups)} module group(s) checked, all conform.`,
)

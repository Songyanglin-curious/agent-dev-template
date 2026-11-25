/**
 * Verify module and module-group READMEs: the Summary stays within the
 * 100-word-equivalent limit, module docs carry the canonical limitations
 * section (or a justified allowlist entry), and module-group docs omit the
 * sections that belong to their modules. Discovery uses the declared
 * frontmatter `kind`, never a directory name, so module boundaries stay a
 * project decision.
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

/** Module docs that intentionally carry no limitations section. */
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
  const summary = h2Section(source, 'Summary')
  if (summary === undefined) {
    failures.push(`${file}: missing ## Summary`)
  } else if (summary.trim().length === 0) {
    failures.push(`${file}: ## Summary is empty`)
  } else {
    const words = countWordEquivalents(summary)
    if (words > SUMMARY_LIMIT) {
      failures.push(`${file}: Summary is ${String(words)} word equivalents, over the ${String(SUMMARY_LIMIT)} limit`)
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

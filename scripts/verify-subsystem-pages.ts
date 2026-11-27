/**
 * Verify that each documentation unit links the subsystem page that owns its
 * cross-module capability. Units are all module-group docs plus module docs not
 * listed by any group; a unit without such a link needs a justified entry in
 * `scripts/subsystem-page-exemptions.json`. Stale exemptions, exempt units that
 * do link a page, and links to missing pages all fail.
 */

import { existsSync, readFileSync } from 'node:fs'
import { dirname, relative, resolve, sep } from 'node:path'
import {
  documentLinks,
  h2Section,
  parseDocumentFrontmatter,
  readRepositoryFile,
  REPO_ROOT,
  repositoryMarkdownFiles,
  tableRows,
} from './doc-tooling.ts'

const EXEMPTIONS_PATH = 'scripts/subsystem-page-exemptions.json'
const SUBSYSTEM_PAGE = /^docs\/subsystems\/[^/]+\.md$/u

/** Units intentionally without a subsystem page. */
function readExemptions(): Record<string, string> {
  const absolute = resolve(REPO_ROOT, EXEMPTIONS_PATH)
  if (!existsSync(absolute)) return {}
  const parsed: unknown = JSON.parse(readFileSync(absolute, 'utf8'))
  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error(`${EXEMPTIONS_PATH} must be a JSON object keyed by unit document path`)
  }
  return parsed as Record<string, string>
}

const failures: string[] = []
const exemptions = readExemptions()
for (const [path, reason] of Object.entries(exemptions)) {
  if (typeof reason !== 'string' || reason.trim().length === 0) {
    failures.push(`${EXEMPTIONS_PATH}: ${path} needs a non-empty justification`)
  }
}

const moduleGroups: string[] = []
const modules: string[] = []
for (const file of repositoryMarkdownFiles(['**/README.md'], { excludeTemplate: true })) {
  let kind: unknown
  try {
    kind = parseDocumentFrontmatter(readRepositoryFile(file))?.data.kind
  } catch (error) {
    failures.push(`${file}: unreadable frontmatter: ${error instanceof Error ? error.message : String(error)}`)
    continue
  }
  if (kind === 'module-group') moduleGroups.push(file)
  else if (kind === 'module') modules.push(file)
}
const moduleSet = new Set(modules)
const groupedModules = new Set<string>()
for (const group of moduleGroups) {
  const section = h2Section(readRepositoryFile(group), '模块与职责')
  if (section === undefined) continue
  for (const row of tableRows(section)) {
    const first = row.cells[0] ?? ''
    const match = /\[[^\]]*\]\(([^)\s]+)\)/u.exec(first)
    if (match === null) continue
    const url = (match[1] ?? '').replace(/[#?].*$/, '')
    if (url === '' || url.startsWith('#') || /^[a-z][a-z0-9+.-]*:/iu.test(url)) continue
    const absolute = resolve(REPO_ROOT, dirname(group), url)
    if (!absolute.startsWith(REPO_ROOT + sep)) continue
    const target = relative(REPO_ROOT, absolute).replaceAll('\\', '/')
    if (moduleSet.has(target)) groupedModules.add(target)
  }
}
const independentModules = modules.filter(file => !groupedModules.has(file))
const units = [...moduleGroups, ...independentModules]
const unitSet = new Set(units)

for (const file of units) {
  const source = readRepositoryFile(file)
  const linked = new Set<string>()
  for (const link of documentLinks(source)) {
    const url = link.url.replace(/[#?].*$/, '')
    if (url === '' || url.startsWith('#') || /^[a-z][a-z0-9+.-]*:/iu.test(url)) continue
    const absolute = resolve(REPO_ROOT, dirname(file), url)
    if (!absolute.startsWith(REPO_ROOT + sep)) continue
    const target = relative(REPO_ROOT, absolute).replaceAll('\\', '/')
    if (!SUBSYSTEM_PAGE.test(target) || target.endsWith('/README.md')) continue
    if (!existsSync(absolute)) {
      failures.push(`${file}:${String(link.line)}: linked subsystem page does not exist: ${target}`)
      continue
    }
    linked.add(target)
  }

  const exempt = Object.hasOwn(exemptions, file)
  if (linked.size === 0 && !exempt) {
    failures.push(
      `${file}: link at least one docs/subsystems/*.md page, or add a justified entry to ${EXEMPTIONS_PATH}`,
    )
  }
  if (linked.size > 0 && exempt) {
    failures.push(`${EXEMPTIONS_PATH}: ${file} links a subsystem page but remains exempt; remove the stale entry`)
  }
}

for (const path of Object.keys(exemptions)) {
  if (!unitSet.has(path)) {
    failures.push(`${EXEMPTIONS_PATH}: ${path} is not a current module or module-group doc; remove the stale entry`)
  }
}

if (failures.length > 0) {
  console.error('verify-subsystem-pages: subsystem ownership violations found:')
  for (const failure of failures) console.error(`  ${failure}`)
  process.exit(1)
}
const composition = moduleGroups.length > 0
  ? `${String(moduleGroups.length)} module group(s), ${String(independentModules.length)} independent module(s)`
  : `${String(modules.length)} module(s)`
console.log(`verify-subsystem-pages: ${String(units.length)} unit(s) checked (${composition}), all conform.`)

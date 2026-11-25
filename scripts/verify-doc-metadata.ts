/**
 * Verify `description` / `kind` frontmatter on READMEs that belong to the
 * doc-writing type system. The kind must map to exactly one template under
 * `.agents/skills/doc-writing/templates/`; the description must let a reader
 * decide whether to open the page; and fields already owned by the title, the
 * manifest, or the gate system are rejected. READMEs without a `kind` are
 * ordinary project or index pages and are not checked here.
 */

import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import {
  documentHeadings,
  parseDocumentFrontmatter,
  readRepositoryFile,
  REPO_ROOT,
  repositoryMarkdownFiles,
} from './doc-tooling.ts'

const TEMPLATE_DIRECTORY = resolve(REPO_ROOT, '.agents/skills/doc-writing/templates')

/** Document kinds that map to a template. */
const KINDS = new Set([
  'module',
  'module-group',
  'persistence-change',
  'persistence-release',
  'persistence-format',
])

/** Fields owned elsewhere or intentionally not supported. */
const FORBIDDEN_FIELDS = ['name', 'audience', 'tags', 'i18n'] as const

/** Minimum and maximum description length in characters. */
const MIN_DESCRIPTION = 10
const MAX_DESCRIPTION = 300

/** Advertising language the description must not use. */
const ADVERTISING = /最先进|最强大|世界级|the best|world-class|best-in-class/iu

const failures: string[] = []
let checked = 0

for (const file of repositoryMarkdownFiles(['**/README.md'], { excludeTemplate: true })) {
  const source = readRepositoryFile(file)
  let frontmatter
  try {
    frontmatter = parseDocumentFrontmatter(source)
  } catch (error) {
    failures.push(`${file}: ${error instanceof Error ? error.message : String(error)}`)
    continue
  }
  if (frontmatter === undefined) continue
  const kind = frontmatter.data.kind
  if (kind === undefined) continue
  checked += 1

  if (typeof kind !== 'string' || !KINDS.has(kind)) {
    failures.push(`${file}: kind must be one of ${[...KINDS].join(', ')}, got ${JSON.stringify(kind)}`)
    continue
  }
  const template = resolve(TEMPLATE_DIRECTORY, `${kind}.md`)
  if (!existsSync(template)) {
    failures.push(`${file}: kind "${kind}" has no template at .agents/skills/doc-writing/templates/${kind}.md`)
  }

  for (const field of FORBIDDEN_FIELDS) {
    if (field in frontmatter.data) failures.push(`${file}: remove frontmatter field "${field}"`)
  }

  const description = frontmatter.data.description
  if (typeof description !== 'string') {
    failures.push(`${file}: description must be a string`)
  } else {
    const text = description.trim()
    if (text.length === 0) failures.push(`${file}: description is empty`)
    else if (text.length < MIN_DESCRIPTION) failures.push(`${file}: description is too short to guide retrieval`)
    else if (text.length > MAX_DESCRIPTION) failures.push(`${file}: description exceeds ${MAX_DESCRIPTION} characters`)
    if (ADVERTISING.test(text)) failures.push(`${file}: description uses advertising language`)
    if (/TODO|待补充|coming soon/iu.test(text)) failures.push(`${file}: description is a placeholder`)
    const h1 = documentHeadings(source).find(heading => heading.depth === 1)?.text
    if (h1 !== undefined && text === h1) failures.push(`${file}: description repeats the H1`)
  }

  if (kind.startsWith('persistence-')) {
    failures.push(`${file}: persistence records do not use a README filename; move to docs/persistence-changes/`)
  }
  if (!documentHeadings(source).some(heading => heading.depth === 1)) {
    failures.push(`${file}: missing H1 title`)
  }
}

if (failures.length > 0) {
  console.error('verify-doc-metadata: metadata violations found:')
  for (const failure of failures) console.error(`  ${failure}`)
  process.exit(1)
}
console.log(`verify-doc-metadata: ${String(checked)} kind-bearing README(s) checked, all metadata conform.`)

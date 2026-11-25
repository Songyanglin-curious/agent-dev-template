/**
 * Verify root-relative documentation paths cited by source comments. The scan
 * covers repo-authored source under `src/`, `app/`, and `scripts/`; a token
 * such as `docs/AGENTS.md` or `.agents/notes/README.md` must name an existing file.
 * Generated output, vendored sources, and the template deliverable are out of
 * scope. Add language extensions to {@link SOURCE_EXTENSIONS} when the project
 * adopts another stack.
 */

import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { readRepositoryFile, REPO_ROOT } from './doc-tooling.ts'
import { uniqueRepoFiles } from './repo-files.ts'

/** Source roots that may cite documentation. */
const PATTERNS = ['src/**/*', 'app/**/*', 'scripts/**/*']

/** File extensions treated as source code. */
const SOURCE_EXTENSIONS = new Set([
  '.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs',
  '.py', '.cs', '.go', '.rs', '.java', '.kt', '.swift',
  '.gd', '.lua', '.rb', '.php', '.c', '.h', '.cc', '.cpp', '.hpp',
  '.sh', '.ps1',
])

/** Root-relative Markdown path token. */
const DOC_REF = /(?:\bdocs|\.agents\/notes)\/[A-Za-z0-9._/-]+\.md/gu

const failures: string[] = []
let scanned = 0

const isExcluded = (path: string): boolean =>
  path.replaceAll('\\', '/').includes('node_modules/')

for (const { abs } of uniqueRepoFiles(REPO_ROOT, PATTERNS, isExcluded)) {
  const extension = abs.slice(abs.lastIndexOf('.')).toLowerCase()
  if (!SOURCE_EXTENSIONS.has(extension)) continue
  scanned += 1
  const file = abs.replaceAll('\\', '/').replace(`${REPO_ROOT.replaceAll('\\', '/')}/`, '')
  const source = readRepositoryFile(file)
  const lines = source.split('\n')
  for (let index = 0; index < lines.length; index += 1) {
    for (const match of (lines[index] ?? '').matchAll(DOC_REF)) {
      const reference = match[0]
      if (!existsSync(resolve(REPO_ROOT, reference))) {
        failures.push(`${file}:${String(index + 1)}: documentation reference does not exist: ${reference}`)
      }
    }
  }
}

if (failures.length > 0) {
  console.error('verify-doc-refs: broken documentation references found:')
  for (const failure of failures) console.error(`  ${failure}`)
  process.exit(1)
}
console.log(`verify-doc-refs: ${String(scanned)} source file(s) checked, all documentation references resolve.`)

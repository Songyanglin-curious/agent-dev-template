/**
 * 校验源码注释中引用的、以仓库根为基准的文档路径。扫描范围覆盖
 * `src/`、`app/` 和 `scripts/` 下仓库自行编写的源码；像
 * `docs/AGENTS.md` 或 `.agents/notes/README.md` 这样的 token
 * 必须指向一个已存在的文件。生成产物、第三方源码
 * 以及测试夹具不在范围内。当项目采用其他技术栈时，向
 * {@link SOURCE_EXTENSIONS} 添加对应的语言扩展名。
 */

import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { readRepositoryFile, REPO_ROOT } from './doc-tooling.ts'
import { uniqueRepoFiles } from './repo-files.ts'

/** 可能引用文档的源码根目录。 */
const PATTERNS = ['src/**/*', 'app/**/*', 'scripts/**/*']

/** 视为源代码的文件扩展名。 */
const SOURCE_EXTENSIONS = new Set([
  '.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs',
  '.py', '.cs', '.go', '.rs', '.java', '.kt', '.swift',
  '.gd', '.lua', '.rb', '.php', '.c', '.h', '.cc', '.cpp', '.hpp',
  '.sh', '.ps1',
])

/** 以仓库根为基准的 Markdown 路径 token。 */
const DOC_REF = /(?:\bdocs|\.agents\/notes)\/[A-Za-z0-9._/-]+\.md/gu

const failures: string[] = []
let scanned = 0

const isExcluded = (path: string): boolean => {
  const normalized = path.replaceAll('\\', '/')
  return normalized.includes('node_modules/') || normalized.startsWith('scripts/tests/')
}

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

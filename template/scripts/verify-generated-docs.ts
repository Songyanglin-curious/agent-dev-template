/**
 * 校验生成的文档区域及其归属。生成区域由
 * `<!-- name:start -->` / `<!-- name:end -->` 注释界定；
 * 标记必须成对、不得嵌套，且在一个文件内必须唯一。
 * 每个带有生成区域的文档都必须在
 * `scripts/generated-docs.manifest.json` 中声明一个 producer，
 * 以便读者找到拥有该区域的脚本。门禁检查归属与结构，
 * 不检查新鲜度：何时运行生成器由各项目自行决定。
 */

import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { markdownSourcePaths, readRepositoryFile, REPO_ROOT } from './doc-tooling.ts'

const MANIFEST_PATH = 'scripts/generated-docs.manifest.json'
const MARKER = /<!--\s*([A-Za-z0-9_-]+):(start|end)\s*-->/gu

/** 判断 producer 是否形如仓库相对路径的脚本路径。 */
function isScriptPath(producer: string): boolean {
  return producer.includes('/') || /\.(?:[cm]?[jt]sx?|py|sh|ps1)$/u.test(producer)
}

const failures: string[] = []
const documentsWithRegions = new Set<string>()

for (const file of markdownSourcePaths()) {
  const source = readRepositoryFile(file)
  const lines = source.split('\n')
  const stack: { name: string; line: number }[] = []
  let hasRegion = false

  for (let index = 0; index < lines.length; index += 1) {
    for (const match of (lines[index] ?? '').matchAll(MARKER)) {
      hasRegion = true
      const name = match[1] ?? ''
      const kind = match[2]
      const line = index + 1
      if (kind === 'start') {
        if (stack.some(entry => entry.name === name)) {
          failures.push(`${file}:${String(line)}: duplicate start marker for "${name}"`)
          continue
        }
        if (stack.length > 0) {
          failures.push(`${file}:${String(line)}: region "${name}" nests inside "${stack[stack.length - 1]?.name ?? ''}"`)
        }
        stack.push({ name, line })
      } else {
        const top = stack[stack.length - 1]
        if (top === undefined) {
          failures.push(`${file}:${String(line)}: end marker for "${name}" has no start`)
          continue
        }
        if (top.name !== name) {
          failures.push(`${file}:${String(line)}: end marker for "${name}" closes "${top.name}"`)
          stack.pop()
          continue
        }
        stack.pop()
      }
    }
  }
  for (const entry of stack) {
    failures.push(`${file}:${String(entry.line)}: start marker for "${entry.name}" has no end`)
  }
  if (hasRegion) documentsWithRegions.add(file)
}

let manifest: Record<string, unknown> = {}
const manifestAbsolute = resolve(REPO_ROOT, MANIFEST_PATH)
if (existsSync(manifestAbsolute)) {
  const parsed: unknown = JSON.parse(readFileSync(manifestAbsolute, 'utf8'))
  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    failures.push(`${MANIFEST_PATH} must be a JSON object keyed by document path`)
  } else {
    manifest = parsed as Record<string, unknown>
  }
}

for (const [file, value] of Object.entries(manifest)) {
  if (!existsSync(resolve(REPO_ROOT, file))) {
    failures.push(`${MANIFEST_PATH}: ${file} does not exist`)
    continue
  }
  if (!documentsWithRegions.has(file)) {
    failures.push(`${MANIFEST_PATH}: ${file} has no generated region; remove the stale entry`)
  }
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    failures.push(`${MANIFEST_PATH}: ${file} must declare an object with a producer`)
    continue
  }
  const entry = value as Record<string, unknown>
  const producer = entry.producer
  if (typeof producer !== 'string' || producer.trim() === '') {
    failures.push(`${MANIFEST_PATH}: ${file} needs a non-empty producer`)
  } else if (isScriptPath(producer) && !existsSync(resolve(REPO_ROOT, producer))) {
    failures.push(`${MANIFEST_PATH}: ${file} producer does not exist: ${producer}`)
  }
  if (entry.description !== undefined && (typeof entry.description !== 'string' || entry.description.trim() === '')) {
    failures.push(`${MANIFEST_PATH}: ${file} description must be a non-empty string when present`)
  }
}

for (const file of documentsWithRegions) {
  if (!Object.hasOwn(manifest, file)) {
    failures.push(`${file}: generated region is not declared in ${MANIFEST_PATH}`)
  }
}

if (failures.length > 0) {
  console.error('verify-generated-docs: generated-region violations found:')
  for (const failure of failures) console.error(`  ${failure}`)
  process.exit(1)
}
console.log(
  `verify-generated-docs: ${String(documentsWithRegions.size)} document(s) with generated regions checked, all declared.`,
)

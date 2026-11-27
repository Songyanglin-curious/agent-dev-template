/**
 * 校验 persistence-change、persistence-release 和
 * persistence-format 记录，且不假设任何持久化技术。
 * 该门禁检查每个项目共用的记录契约：位置、frontmatter、
 * 必需章节、恰好一个机器可读声明块、声明结构、摘要语法、
 * 前驱引用，以及生成的 schema 区域。抽取与刷新
 * 工具由各项目自行维护；本门禁只校验项目
 * 已提交的内容。
 */

import { existsSync } from 'node:fs'
import { basename, resolve } from 'node:path'
import { JSON_SCHEMA, load } from 'js-yaml'
import {
  documentHeadings,
  parseDocumentFrontmatter,
  readRepositoryFile,
  REPO_ROOT,
  repositoryMarkdownFiles,
} from './doc-tooling.ts'

const CHANGES_ROOT = 'docs/persistence-changes'
const REQUIRED_SECTIONS: Record<string, readonly string[]> = {
  'persistence-change': ['Summary', 'Table of Contents', 'Declaration', 'Compatibility', 'Verification', 'Dev Note'],
  'persistence-release': ['Summary', 'Table of Contents', '发布证据', 'Declaration', '结构变更', '验证', 'Dev Note'],
  'persistence-format': ['Summary', 'Table of Contents', '源码证据', '格式特征', 'Declaration', '完整 schema', '验证与限制', 'Dev Note'],
}

/** 判断某个值是否为普通映射。 */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** 判断某个值是否为 64 位小写 SHA-256 摘要。 */
function isDigest(value: unknown): boolean {
  return typeof value === 'string' && /^[0-9a-f]{64}$/u.test(value)
}

/** 判断某个值是否为 null 或摘要。 */
function isDigestOrNull(value: unknown): boolean {
  return value === null || isDigest(value)
}

/** 对记录路径分类；位置未知时返回 undefined。 */
function kindOf(file: string): string | undefined {
  if (file.startsWith(`${CHANGES_ROOT}/releases/`) && basename(file) !== 'README.md') return 'persistence-release'
  if (file.startsWith(`${CHANGES_ROOT}/historical-formats/`) && basename(file) !== 'README.md') return 'persistence-format'
  if (/^docs\/persistence-changes\/\d{4}-\d{2}-\d{2}-[^/]+\.md$/u.test(file)) return 'persistence-change'
  return undefined
}

/** 按记录类别校验单个声明块。 */
function validateDeclaration(kind: string, file: string, value: unknown, stem: string, failures: string[]): void {
  if (!isRecord(value)) {
    failures.push(`${file}: declaration block must be a YAML mapping`)
    return
  }
  if (value.schemaVersion !== 1) failures.push(`${file}: schemaVersion must be 1`)
  if (kind === 'persistence-change') {
    if (value.id !== stem) failures.push(`${file}: id "${String(value.id)}" must equal the filename stem "${stem}"`)
    if (typeof value.baseline !== 'boolean') failures.push(`${file}: baseline must be a boolean`)
    if (!Array.isArray(value.changes) || value.changes.length === 0) {
      failures.push(`${file}: changes must be a non-empty array`)
      return
    }
    for (const [index, change] of value.changes.entries()) {
      const at = `changes[${String(index)}]`
      if (!isRecord(change)) {
        failures.push(`${file}: ${at} must be a mapping`)
        continue
      }
      if (typeof change.root !== 'string' || change.root.trim() === '') failures.push(`${file}: ${at}.root must be a non-empty string`)
      if (!isDigestOrNull(change.after)) failures.push(`${file}: ${at}.after must be null or a 64-character SHA-256 digest`)
      if (change.previous !== null && typeof change.previous !== 'string') failures.push(`${file}: ${at}.previous must be null or a record id`)
      if (change.decision !== 'same-version' && change.decision !== 'version-bump') {
        failures.push(`${file}: ${at}.decision must be same-version or version-bump`)
      }
      if (typeof change.previous === 'string' && !existsSync(resolve(REPO_ROOT, CHANGES_ROOT, `${change.previous}.md`))) {
        failures.push(`${file}: ${at}.previous names a missing record: ${change.previous}`)
      }
    }
    return
  }
  if (kind === 'persistence-release') {
    if (value.tag !== stem) failures.push(`${file}: tag "${String(value.tag)}" must equal the filename stem "${stem}"`)
    if (typeof value.formatVersion !== 'number' || !Number.isInteger(value.formatVersion)) {
      failures.push(`${file}: formatVersion must be an integer`)
    }
    if (value.previous !== null && typeof value.previous !== 'string') {
      failures.push(`${file}: previous must be null or a release tag`)
    }
    if (typeof value.previous === 'string'
      && !existsSync(resolve(REPO_ROOT, CHANGES_ROOT, 'releases', `${value.previous}.md`))) {
      failures.push(`${file}: previous names a missing release record: ${value.previous}`)
    }
    if (!Array.isArray(value.changes)) {
      failures.push(`${file}: changes must be an array`)
      return
    }
    for (const [index, change] of value.changes.entries()) {
      const at = `changes[${String(index)}]`
      if (!isRecord(change)) {
        failures.push(`${file}: ${at} must be a mapping`)
        continue
      }
      if (typeof change.root !== 'string' || change.root.trim() === '') failures.push(`${file}: ${at}.root must be a non-empty string`)
      if (!isDigestOrNull(change.before)) failures.push(`${file}: ${at}.before must be null or a digest`)
      if (!isDigestOrNull(change.after)) failures.push(`${file}: ${at}.after must be null or a digest`)
    }
    return
  }
  if (value.formatVersion === undefined || typeof value.formatVersion !== 'number' || !Number.isInteger(value.formatVersion)) {
    failures.push(`${file}: formatVersion must be an integer`)
  }
  if (!isRecord(value.source)) {
    failures.push(`${file}: source must be a mapping`)
  } else {
    const keys = ['tag', 'pullRequest'].filter(key => key in value.source!)
    if (keys.length !== 1) failures.push(`${file}: source must contain exactly one of tag or pullRequest`)
    else if (keys[0] === 'tag' && (typeof value.source.tag !== 'string' || value.source.tag.trim() === '')) {
      failures.push(`${file}: source.tag must be a non-empty string`)
    } else if (keys[0] === 'pullRequest'
      && (typeof value.source.pullRequest !== 'number' || !Number.isInteger(value.source.pullRequest) || value.source.pullRequest <= 0)) {
      failures.push(`${file}: source.pullRequest must be a positive integer`)
    }
  }
  if (!isRecord(value.roots) || Object.keys(value.roots).length === 0) {
    failures.push(`${file}: roots must be a non-empty mapping of root to digest`)
  } else {
    for (const [root, digest] of Object.entries(value.roots)) {
      if (!isDigest(digest)) failures.push(`${file}: roots.${root} must be a 64-character SHA-256 digest`)
    }
  }
  if (!existsSync(resolve(REPO_ROOT, CHANGES_ROOT, 'historical-formats', `${stem}.schema.json`))) {
    failures.push(`${file}: missing companion schema ${stem}.schema.json`)
  }
}

const failures: string[] = []
let checked = 0
const counts: Record<string, number> = { 'persistence-change': 0, 'persistence-release': 0, 'persistence-format': 0 }

for (const file of repositoryMarkdownFiles(['docs/persistence-changes/**/*.md'])) {
  if (basename(file) === 'README.md') continue
  const kind = kindOf(file)
  if (kind === undefined) {
    failures.push(`${file}: unknown persistence record location`)
    continue
  }
  checked += 1
  counts[kind] = (counts[kind] ?? 0) + 1
  const source = readRepositoryFile(file)
  const stem = basename(file, '.md')

  let frontmatter
  try {
    frontmatter = parseDocumentFrontmatter(source)
  } catch (error) {
    failures.push(`${file}: ${error instanceof Error ? error.message : String(error)}`)
    continue
  }
  if (frontmatter === undefined) {
    failures.push(`${file}: missing frontmatter`)
    continue
  }
  if (frontmatter.data.kind !== kind) failures.push(`${file}: kind must be ${kind}, got ${JSON.stringify(frontmatter.data.kind)}`)
  if (typeof frontmatter.data.description !== 'string' || frontmatter.data.description.trim() === '') {
    failures.push(`${file}: description must be a non-empty string`)
  }

  const headings = documentHeadings(source)
  if (!headings.some(heading => heading.depth === 1)) failures.push(`${file}: missing H1 title`)
  for (const section of REQUIRED_SECTIONS[kind] ?? []) {
    if (!headings.some(heading => heading.depth === 2 && heading.text === section)) {
      failures.push(`${file}: missing ## ${section}`)
    }
  }

  const blocks = [...source.matchAll(/```yaml\s+([a-z-]+)\s*\n([\s\S]*?)```/gu)]
  if (blocks.length !== 1) {
    failures.push(`${file}: expected exactly one \`yaml ${kind}\` block, found ${String(blocks.length)} yaml blocks`)
    continue
  }
  const block = blocks[0]
  if (block?.[1] !== kind) {
    failures.push(`${file}: declaration block must be labelled ${kind}, got ${String(block?.[1])}`)
    continue
  }
  let declaration: unknown
  try {
    declaration = load(block[2] ?? '', { schema: JSON_SCHEMA })
  } catch (error) {
    failures.push(`${file}: declaration is not valid YAML: ${error instanceof Error ? error.message : String(error)}`)
    continue
  }
  validateDeclaration(kind, file, declaration, stem, failures)

  if (kind === 'persistence-format') {
    const start = source.indexOf('persistence-format-schema:start')
    const end = source.indexOf('persistence-format-schema:end')
    if (start < 0 || end < 0 || end < start) {
      failures.push(`${file}: missing ordered persistence-format-schema:start/end region`)
    }
  }
}

if (failures.length > 0) {
  console.error('verify-persistence-records: persistence record violations found:')
  for (const failure of failures) console.error(`  ${failure}`)
  process.exit(1)
}
console.log(
  `verify-persistence-records: ${String(checked)} record(s) checked`
  + ` (${String(counts['persistence-change'])} change, ${String(counts['persistence-release'])} release,`
  + ` ${String(counts['persistence-format'])} format).`,
)
